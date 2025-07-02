import * as JSZip from 'jszip';
import axios from 'axios';
import sharp from 'sharp';

interface ImageData {
  buffer: Buffer;
  width: number;
  height: number;
}

interface ImagePlaceholder {
  tag: string;
  imageUrl?: string;
  buffer?: Buffer;
}

class CustomImageModule {
  private images: Map<string, ImageData> = new Map();
  private docxZip: JSZip | null = null;
  private imageCounter = 0;

  constructor() {
    console.log('📸 CustomImageModule initialized');
  }

  // Download and process image from S3 URL
  async downloadAndProcessImage(imageUrl: string, maxWidth = 400, maxHeight = 300): Promise<ImageData> {
    console.log(`📥 Downloading image: ${imageUrl.substring(0, 100)}...`);
    
    try {
      const response = await axios({
        method: 'GET',
        url: imageUrl,
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'IncidentReporter ImageModule'
        }
      });

      console.log(`✅ Downloaded image: ${response.data.byteLength} bytes`);

      // Process with sharp to resize and optimize
      const originalBuffer = Buffer.from(response.data);
      const metadata = await sharp(originalBuffer).metadata();
      
      console.log(`🖼️ Original dimensions: ${metadata.width}x${metadata.height}`);

      // Calculate new dimensions while maintaining aspect ratio
      let newWidth = metadata.width!;
      let newHeight = metadata.height!;

      if (newWidth > maxWidth || newHeight > maxHeight) {
        const widthRatio = maxWidth / newWidth;
        const heightRatio = maxHeight / newHeight;
        const ratio = Math.min(widthRatio, heightRatio);
        
        newWidth = Math.round(newWidth * ratio);
        newHeight = Math.round(newHeight * ratio);
      }

      console.log(`📐 Resizing to: ${newWidth}x${newHeight}`);

      const processedBuffer = await sharp(originalBuffer)
        .resize(newWidth, newHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png({ quality: 85 })
        .toBuffer();

      console.log(`✅ Processed image: ${processedBuffer.length} bytes`);

      return {
        buffer: processedBuffer,
        width: newWidth,
        height: newHeight
      };
    } catch (error) {
      console.error(`❌ Failed to download/process image from ${imageUrl}:`, error);
      
      // Return a 1x1 transparent PNG as fallback
      const transparentPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P4z8DwHwAFgwJ/lR9AwQAAAABJRU5ErkJggg==',
        'base64'
      );
      
      return {
        buffer: transparentPng,
        width: 1,
        height: 1
      };
    }
  }

  // Add image to the DOCX zip structure
  private addImageToDocx(imageBuffer: Buffer, imageName: string): string {
    if (!this.docxZip) {
      throw new Error('DOCX zip not initialized');
    }

    const imagePath = `word/media/${imageName}`;
    this.docxZip.file(imagePath, imageBuffer);

    // Update [Content_Types].xml to register the image
    this.updateContentTypes(imageName);

    // Update document.xml.rels to create the relationship
    const relationshipId = this.addImageRelationship(imageName);

    return relationshipId;
  }

  private updateContentTypes(imageName: string): void {
    if (!this.docxZip) return;

    const contentTypesXml = this.docxZip.file('[Content_Types].xml');
    if (contentTypesXml) {
      let content = contentTypesXml.asText();
      const extension = imageName.split('.').pop()?.toLowerCase() || 'png';
      
      const defaultEntry = `<Default Extension="${extension}" ContentType="image/${extension === 'jpg' ? 'jpeg' : extension}"/>`;
      
      if (!content.includes(defaultEntry)) {
        content = content.replace('</Types>', `  ${defaultEntry}\n</Types>`);
        this.docxZip.file('[Content_Types].xml', content);
      }
    }
  }

  private addImageRelationship(imageName: string): string {
    if (!this.docxZip) return '';

    const relsFile = this.docxZip.file('word/_rels/document.xml.rels');
    if (relsFile) {
      let content = relsFile.asText();
      
      // Generate unique relationship ID
      const relationshipId = `rId${Date.now()}${this.imageCounter++}`;
      
      const relationshipEntry = `<Relationship Id="${relationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${imageName}"/>`;
      
      content = content.replace('</Relationships>', `  ${relationshipEntry}\n</Relationships>`);
      this.docxZip.file('word/_rels/document.xml.rels', content);
      
      return relationshipId;
    }
    
    return '';
  }

  // Create Word image XML (inline, no extra spacing)
  private createImageXml(relationshipId: string, width: number, height: number): string {
    // Convert pixels to EMUs (English Metric Units) - Word's internal measurement
    const emuWidth = Math.round(width * 9525);
    const emuHeight = Math.round(height * 9525);

    // Return compact XML without extra whitespace or line breaks
    return `<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${emuWidth}" cy="${emuHeight}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="${this.imageCounter}" name="Picture ${this.imageCounter}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${this.imageCounter}" name="Picture ${this.imageCounter}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${relationshipId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${emuWidth}" cy="${emuHeight}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>`;
  }

  // Process image placeholders in document
  async processImagePlaceholders(documentXml: string, imagePlaceholders: ImagePlaceholder[]): Promise<string> {
    let processedXml = documentXml;

    console.log(`🔍 Document XML length before processing: ${documentXml.length}`);
    console.log(`🔍 Looking for placeholders in conclusions area...`);
    
    // Check for spacing issues around conclusions
    if (documentXml.includes('conclusions')) {
      const conclusionsMatch = documentXml.match(/conclusions.*?photo_1/s);
      if (conclusionsMatch) {
        console.log(`🔍 Found content between conclusions and photo_1: ${conclusionsMatch[0].length} chars`);
      }
    }

    for (const placeholder of imagePlaceholders) {
      const { tag, imageUrl, buffer } = placeholder;
      
      try {
        let imageData: ImageData;
        
        if (buffer) {
          // Use provided buffer
          const metadata = await sharp(buffer).metadata();
          imageData = {
            buffer,
            width: metadata.width || 400,
            height: metadata.height || 300
          };
        } else if (imageUrl) {
          // Download from URL
          imageData = await this.downloadAndProcessImage(imageUrl);
        } else {
          console.warn(`⚠️ No image data provided for ${tag}`);
          continue;
        }

        // Generate unique image name
        const imageName = `image_${tag}_${Date.now()}.png`;
        
        // Add image to DOCX
        const relationshipId = this.addImageToDocx(imageData.buffer, imageName);
        
        // Create image XML
        const imageXml = this.createImageXml(relationshipId, imageData.width, imageData.height);
        
        // Careful placeholder replacement to preserve spacing
        const placeholderRegex = new RegExp(`{{${tag}}}`, 'g');
        
        // Check if this is an empty placeholder (no image)
        if (imageData.width === 1 && imageData.height === 1) {
          // Remove placeholder completely for transparent images
          processedXml = processedXml.replace(placeholderRegex, '');
          console.log(`🔄 Removed empty placeholder for ${tag}`);
        } else {
          // Replace with actual image
          processedXml = processedXml.replace(placeholderRegex, imageXml);
          console.log(`✅ Embedded image for ${tag}`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to process image for ${tag}:`, error);
        // Replace with error text
        const placeholderRegex = new RegExp(`{{${tag}}}`, 'g');
        processedXml = processedXml.replace(placeholderRegex, `[Image Error: ${tag}]`);
      }
    }

    return processedXml;
  }

  // Initialize with DOCX zip
  setDocxZip(zip: JSZip): void {
    this.docxZip = zip;
  }

  // Clean up
  cleanup(): void {
    this.images.clear();
    this.docxZip = null;
    this.imageCounter = 0;
  }
}

export { CustomImageModule, ImagePlaceholder, ImageData };