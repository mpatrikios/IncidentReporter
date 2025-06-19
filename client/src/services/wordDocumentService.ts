import { Document, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType, Packer } from 'docx';
import { saveAs } from 'file-saver';

interface ReportImage {
  originalFilename: string;
  googleDriveUrl?: string;
  publicUrl?: string;
  fileSize: number;
  description?: string;
}

interface ReportData {
  projectInformation: any;
  assignmentScope: any;
  buildingObservations: any;
  research: any;
  discussionAnalysis: any;
  conclusions: any;
}

interface WordGenerationOptions {
  title: string;
  reportData: ReportData;
  images: ReportImage[];
  includePhotosInline: boolean;
  aiEnhanceText?: boolean;
  onProgress?: (progress: number, message: string) => void;
}

// Image processing utilities
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_IMAGE_WIDTH = 800;
const MAX_IMAGE_HEIGHT = 600;
const JPEG_QUALITY = 0.85;

class WordDocumentService {
  private abortController: AbortController | null = null;

  /**
   * Generate Word document on client-side
   */
  async generateDocument(options: WordGenerationOptions): Promise<boolean> {
    const { title, reportData, images, includePhotosInline, aiEnhanceText, onProgress } = options;

    try {
      this.abortController = new AbortController();
      
      onProgress?.(0, 'Initializing document generation...');

      // Create document sections
      const sections = [];

      // Add title
      sections.push(
        new Paragraph({
          text: title,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );

      // Process and add report sections
      const reportSections = await this.processReportSections(reportData, aiEnhanceText);
      sections.push(...reportSections);

      // Handle images
      if (images && images.length > 0) {
        onProgress?.(20, 'Processing images...');
        
        if (includePhotosInline) {
          // Process images inline
          const imageSections = await this.processInlineImages(images, onProgress);
          sections.push(...imageSections);
        } else {
          // Add image references
          const referenceSection = this.createImageReferences(images);
          sections.push(...referenceSection);
        }
      }

      onProgress?.(80, 'Creating document...');

      // Create the document
      const doc = new Document({
        sections: [{
          properties: {},
          children: sections
        }],
        creator: "Engineering Report Generator",
        description: "Generated engineering report document",
        title: title,
      });

      onProgress?.(90, 'Packaging document...');

      // Generate and save the document
      const blob = await Packer.toBlob(doc);
      
      // Check document size
      if (blob.size > 50 * 1024 * 1024) { // 50MB limit
        throw new Error('Document size exceeds 50MB limit. Please use server-side generation.');
      }

      onProgress?.(100, 'Saving document...');
      
      // Save the file
      saveAs(blob, `${title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.docx`);

      return true;
    } catch (error) {
      console.error('Client-side Word generation failed:', error);
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Process engineering report sections
   */
  private async processReportSections(reportData: ReportData, aiEnhanceText?: boolean): Promise<Paragraph[]> {
    const sections: Paragraph[] = [];

    // Assignment section
    if (reportData.projectInformation) {
      sections.push(
        new Paragraph({
          text: "ASSIGNMENT",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          run: {
            allCaps: true,
            bold: true,
          },
        })
      );

      const pi = reportData.projectInformation;
      sections.push(
        new Paragraph({
          children: [
            new TextRun(`File Number: ${pi.fileNumber || 'N/A'}\n`),
            new TextRun(`Date of Creation: ${pi.dateOfCreation || 'N/A'}\n`),
            new TextRun(`Insured: ${pi.insuredName || 'N/A'}\n`),
            new TextRun(`Property Address: ${pi.insuredAddress || 'N/A'}\n`),
            new TextRun(`Date of Loss: ${pi.dateOfLoss || 'N/A'}\n`),
            new TextRun(`Claim Number: ${pi.claimNumber || 'N/A'}\n`),
            new TextRun(`Client: ${pi.clientCompany || 'N/A'}\n`),
            new TextRun(`Client Contact: ${pi.clientContact || 'N/A'}\n`),
            new TextRun(`Engineer: ${pi.engineerName || 'N/A'}\n`),
            new TextRun(`Technical Reviewer: ${pi.technicalReviewer || 'N/A'}\n`),
            new TextRun(`Site Visit Date: ${pi.siteVisitDate || 'N/A'}`),
          ],
          spacing: { after: 240 },
        })
      );
    }

    // Methodology section
    if (reportData.assignmentScope) {
      sections.push(
        new Paragraph({
          text: "METHODOLOGY",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          run: {
            allCaps: true,
            bold: true,
          },
        })
      );

      const as = reportData.assignmentScope;
      if (as.intervieweesNames) {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: "Interviewees:", bold: true })],
            spacing: { after: 120 },
          })
        );
        sections.push(
          new Paragraph({
            text: await this.processText(as.intervieweesNames, 'interviewees', aiEnhanceText),
            spacing: { after: 200 },
          })
        );
      }

      if (as.providedDocumentsTitles) {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: "Documents Reviewed:", bold: true })],
            spacing: { after: 120 },
          })
        );
        sections.push(
          new Paragraph({
            text: await this.processText(as.providedDocumentsTitles, 'documents', aiEnhanceText),
            spacing: { after: 200 },
          })
        );
      }
    }

    // Building System Description section
    if (reportData.buildingObservations) {
      sections.push(
        new Paragraph({
          text: "BUILDING SYSTEM DESCRIPTION",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          run: {
            allCaps: true,
            bold: true,
          },
        })
      );

      const bo = reportData.buildingObservations;
      if (bo.buildingSystemDescription) {
        sections.push(
          new Paragraph({
            text: await this.processText(bo.buildingSystemDescription, 'building system', aiEnhanceText),
            spacing: { after: 240 },
          })
        );
      }
    }

    // Site Observations section
    if (reportData.buildingObservations) {
      sections.push(
        new Paragraph({
          text: "SITE OBSERVATIONS",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          run: {
            allCaps: true,
            bold: true,
          },
        })
      );

      const bo = reportData.buildingObservations;
      
      if (bo.exteriorObservations) {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: "Exterior Observations:", bold: true })],
            spacing: { after: 120 },
          })
        );
        sections.push(
          new Paragraph({
            text: await this.processText(bo.exteriorObservations, 'exterior observations', aiEnhanceText),
            spacing: { after: 200 },
          })
        );
      }

      if (bo.interiorObservations) {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: "Interior Observations:", bold: true })],
            spacing: { after: 120 },
          })
        );
        sections.push(
          new Paragraph({
            text: await this.processText(bo.interiorObservations, 'interior observations', aiEnhanceText),
            spacing: { after: 200 },
          })
        );
      }

      if (bo.otherSiteObservations) {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: "Other Site Observations:", bold: true })],
            spacing: { after: 120 },
          })
        );
        sections.push(
          new Paragraph({
            text: await this.processText(bo.otherSiteObservations, 'other observations', aiEnhanceText),
            spacing: { after: 200 },
          })
        );
      }
    }

    // Research section
    if (reportData.research) {
      sections.push(
        new Paragraph({
          text: "RESEARCH",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          run: {
            allCaps: true,
            bold: true,
          },
        })
      );

      const r = reportData.research;
      
      if (r.weatherDataSummary) {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: "Weather Data Summary:", bold: true })],
            spacing: { after: 120 },
          })
        );
        sections.push(
          new Paragraph({
            text: await this.processText(r.weatherDataSummary, 'weather data', aiEnhanceText),
            spacing: { after: 200 },
          })
        );
      }

      if (r.corelogicHailSummary) {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: "CoreLogic Hail Summary:", bold: true })],
            spacing: { after: 120 },
          })
        );
        sections.push(
          new Paragraph({
            text: await this.processText(r.corelogicHailSummary, 'hail analysis', aiEnhanceText),
            spacing: { after: 200 },
          })
        );
      }

      if (r.corelogicWindSummary) {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: "CoreLogic Wind Summary:", bold: true })],
            spacing: { after: 120 },
          })
        );
        sections.push(
          new Paragraph({
            text: await this.processText(r.corelogicWindSummary, 'wind analysis', aiEnhanceText),
            spacing: { after: 200 },
          })
        );
      }
    }

    // Discussion & Analysis section
    if (reportData.discussionAnalysis) {
      sections.push(
        new Paragraph({
          text: "DISCUSSION & ANALYSIS",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          run: {
            allCaps: true,
            bold: true,
          },
        })
      );

      const da = reportData.discussionAnalysis;
      
      if (da.siteDiscussionAnalysis) {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: "Site Discussion & Analysis:", bold: true })],
            spacing: { after: 120 },
          })
        );
        sections.push(
          new Paragraph({
            text: await this.processText(da.siteDiscussionAnalysis, 'site analysis', aiEnhanceText),
            spacing: { after: 200 },
          })
        );
      }

      if (da.weatherDiscussionAnalysis) {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: "Weather Discussion & Analysis:", bold: true })],
            spacing: { after: 120 },
          })
        );
        sections.push(
          new Paragraph({
            text: await this.processText(da.weatherDiscussionAnalysis, 'weather analysis', aiEnhanceText),
            spacing: { after: 200 },
          })
        );
      }

      if (da.weatherImpactAnalysis) {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: "Weather Impact Analysis:", bold: true })],
            spacing: { after: 120 },
          })
        );
        sections.push(
          new Paragraph({
            text: await this.processText(da.weatherImpactAnalysis, 'impact analysis', aiEnhanceText),
            spacing: { after: 200 },
          })
        );
      }

      if (da.recommendationsAndDiscussion) {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: "Recommendations & Discussion:", bold: true })],
            spacing: { after: 120 },
          })
        );
        sections.push(
          new Paragraph({
            text: await this.processText(da.recommendationsAndDiscussion, 'recommendations', aiEnhanceText),
            spacing: { after: 200 },
          })
        );
      }
    }

    // Conclusions section
    if (reportData.conclusions) {
      sections.push(
        new Paragraph({
          text: "CONCLUSIONS",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          run: {
            allCaps: true,
            bold: true,
          },
        })
      );

      sections.push(
        new Paragraph({
          text: await this.processText(reportData.conclusions.conclusions, 'conclusions', aiEnhanceText),
          spacing: { after: 240 },
        })
      );
    }

    return sections;
  }

  /**
   * Process text with AI enhancement if enabled
   */
  private async processText(text: string | undefined, fieldType: string, aiEnhanceText?: boolean): Promise<string> {
    if (!text || text.trim().length === 0) {
      return '';
    }

    // Check if text contains bullet points (starts with •, -, *, or numbers)
    const bulletPointPattern = /^[\s]*[•\-\*]|\d+\./gm;
    const hasBulletPoints = bulletPointPattern.test(text);

    if (hasBulletPoints && aiEnhanceText) {
      try {
        // Call AI enhancement API if available
        const response = await fetch('/api/ai/generate-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bulletPoints: text,
            fieldType,
            context: 'Civil engineering property inspection report'
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return data.generatedText || text;
        }
      } catch (error) {
        console.warn(`Failed to enhance text for ${fieldType}, using original:`, error);
      }
    }

    return text;
  }

  /**
   * Process content into paragraphs
   */
  private processContent(content: string): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.trim()) {
        // Check if it's a heading (starts with #)
        const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const text = headingMatch[2];
          paragraphs.push(
            new Paragraph({
              text: text,
              heading: this.getHeadingLevel(level),
              spacing: { before: 240, after: 120 },
            })
          );
        } else {
          // Regular paragraph
          paragraphs.push(
            new Paragraph({
              children: [new TextRun(line)],
              spacing: { after: 200 },
            })
          );
        }
      } else {
        // Empty line for spacing
        paragraphs.push(new Paragraph({ text: "" }));
      }
    }

    return paragraphs;
  }

  /**
   * Get heading level from markdown heading count
   */
  private getHeadingLevel(level: number): HeadingLevel {
    switch (level) {
      case 1: return HeadingLevel.HEADING_1;
      case 2: return HeadingLevel.HEADING_2;
      case 3: return HeadingLevel.HEADING_3;
      case 4: return HeadingLevel.HEADING_4;
      case 5: return HeadingLevel.HEADING_5;
      case 6: return HeadingLevel.HEADING_6;
      default: return HeadingLevel.HEADING_2;
    }
  }

  /**
   * Process images for inline embedding
   */
  private async processInlineImages(
    images: ReportImage[], 
    onProgress?: (progress: number, message: string) => void
  ): Promise<Paragraph[]> {
    const paragraphs: Paragraph[] = [];
    const batchSize = 3; // Process 3 images at a time
    const totalBatches = Math.ceil(images.length / batchSize);

    // Add images section heading
    paragraphs.push(
      new Paragraph({
        text: "Images",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      if (this.abortController?.signal.aborted) {
        throw new Error('Document generation cancelled');
      }

      const startIdx = batchIndex * batchSize;
      const endIdx = Math.min(startIdx + batchSize, images.length);
      const batch = images.slice(startIdx, endIdx);
      
      const progress = 20 + (60 * (batchIndex + 1) / totalBatches);
      onProgress?.(progress, `Processing images ${startIdx + 1}-${endIdx} of ${images.length}...`);

      // Process batch in parallel
      const processedImages = await Promise.all(
        batch.map(async (image, index) => {
          try {
            const imageData = await this.downloadAndProcessImage(image);
            return { image, imageData, index: startIdx + index };
          } catch (error) {
            console.error(`Failed to process image ${image.originalFilename}:`, error);
            return null;
          }
        })
      );

      // Add successfully processed images
      for (const processed of processedImages) {
        if (processed) {
          const { image, imageData, index } = processed;
          
          // Add image caption
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Image ${index + 1}: ${image.originalFilename}`,
                  bold: true,
                })
              ],
              spacing: { before: 240, after: 120 },
            })
          );

          if (image.description) {
            paragraphs.push(
              new Paragraph({
                text: image.description,
                spacing: { after: 120 },
              })
            );
          }

          // Add the image
          if (imageData) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imageData,
                    transformation: {
                      width: 400,
                      height: 300,
                    },
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 240 },
              })
            );
          } else {
            // Placeholder if image couldn't be loaded
            paragraphs.push(
              new Paragraph({
                text: `[Image could not be loaded: ${image.originalFilename}]`,
                spacing: { after: 240 },
              })
            );
          }
        }
      }

      // Small delay between batches to prevent browser freezing
      if (batchIndex < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return paragraphs;
  }

  /**
   * Download and process image for embedding
   */
  private async downloadAndProcessImage(image: ReportImage): Promise<ArrayBuffer | null> {
    try {
      const imageUrl = image.publicUrl || image.googleDriveUrl;
      if (!imageUrl) return null;

      // Download image
      const response = await fetch(imageUrl, {
        signal: this.abortController?.signal,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const blob = await response.blob();

      // Check if image needs processing
      if (blob.size > MAX_IMAGE_SIZE || !blob.type.includes('jpeg')) {
        return await this.optimizeImage(blob);
      }

      return await blob.arrayBuffer();
    } catch (error) {
      console.error('Error downloading image:', error);
      return null;
    }
  }

  /**
   * Optimize image size and format
   */
  private async optimizeImage(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        try {
          // Calculate new dimensions
          let { width, height } = img;
          if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
            const ratio = Math.min(MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx!.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            async (optimizedBlob) => {
              if (optimizedBlob) {
                resolve(await optimizedBlob.arrayBuffer());
              } else {
                reject(new Error('Failed to optimize image'));
              }
            },
            'image/jpeg',
            JPEG_QUALITY
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(blob);
    });
  }

  /**
   * Create image reference list
   */
  private createImageReferences(images: ReportImage[]): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Add heading
    paragraphs.push(
      new Paragraph({
        text: "Referenced Images",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    // Add image list
    images.forEach((image, index) => {
      const referenceText = [`${index + 1}. ${image.originalFilename}`];
      
      if (image.description) {
        referenceText.push(`   Description: ${image.description}`);
      }
      
      if (image.googleDriveUrl) {
        referenceText.push(`   Link: ${image.googleDriveUrl}`);
      }

      paragraphs.push(
        new Paragraph({
          text: referenceText.join('\n'),
          spacing: { after: 120 },
        })
      );
    });

    return paragraphs;
  }

  /**
   * Check if client-side generation is feasible
   */
  async canGenerateClientSide(images: ReportImage[]): Promise<boolean> {
    // Check browser capabilities
    if (!window.FileReader || !window.Blob) {
      return false;
    }

    // Check estimated document size
    const estimatedSize = images.reduce((sum, img) => sum + (img.fileSize || 0), 0);
    if (estimatedSize > 40 * 1024 * 1024) { // 40MB threshold
      return false;
    }

    // Check device memory if available
    if ('deviceMemory' in navigator) {
      const memory = (navigator as any).deviceMemory;
      if (memory < 4) { // Less than 4GB RAM
        return images.length <= 10;
      }
    }

    return true;
  }

  /**
   * Cancel ongoing generation
   */
  cancelGeneration(): void {
    this.abortController?.abort();
  }
}

export const wordDocumentService = new WordDocumentService();