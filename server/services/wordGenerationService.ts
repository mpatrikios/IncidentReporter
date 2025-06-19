import officegen from 'officegen';
import { Response } from 'express';
import axios from 'axios';
import sharp from 'sharp';

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
}

class WordGenerationService {
  /**
   * Generate Word document on server-side
   */
  async generateDocument(options: WordGenerationOptions, res: Response): Promise<void> {
    const { title, reportData, images, includePhotosInline, aiEnhanceText } = options;

    try {
      // Create a new Word document
      const docx = officegen('docx');

      // Set document properties
      docx.setDocTitle(title);
      docx.setDocSubject('Engineering Report');
      docx.setDocCreator('Engineering Report Generator');

      // Add title
      const titleObj = docx.createP({ align: 'center' });
      titleObj.addText(title, { bold: true, font_size: 20 });
      titleObj.addLineBreak();
      titleObj.addLineBreak();

      // Process and add report sections
      this.addReportSections(docx, reportData, aiEnhanceText);

      // Handle images
      if (images && images.length > 0) {
        docx.createP().addLineBreak();
        
        if (includePhotosInline) {
          await this.addInlineImages(docx, images);
        } else {
          this.addImageReferences(docx, images);
        }
      }

      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.docx"`);

      // Generate and pipe the document
      docx.generate(res);

    } catch (error) {
      console.error('Server-side Word generation failed:', error);
      throw error;
    }
  }

  /**
   * Add engineering report sections to document
   */
  private addReportSections(docx: any, reportData: ReportData, aiEnhanceText?: boolean): void {
    // Assignment section
    if (reportData.projectInformation) {
      const assignmentTitle = docx.createP();
      assignmentTitle.addText('ASSIGNMENT', { bold: true, font_size: 14 });
      assignmentTitle.addLineBreak();

      const pi = reportData.projectInformation;
      const assignmentInfo = docx.createP();
      assignmentInfo.addText(`File Number: ${pi.fileNumber || 'N/A'}\n`);
      assignmentInfo.addText(`Date of Creation: ${pi.dateOfCreation || 'N/A'}\n`);
      assignmentInfo.addText(`Insured: ${pi.insuredName || 'N/A'}\n`);
      assignmentInfo.addText(`Property Address: ${pi.insuredAddress || 'N/A'}\n`);
      assignmentInfo.addText(`Date of Loss: ${pi.dateOfLoss || 'N/A'}\n`);
      assignmentInfo.addText(`Claim Number: ${pi.claimNumber || 'N/A'}\n`);
      assignmentInfo.addText(`Client: ${pi.clientCompany || 'N/A'}\n`);
      assignmentInfo.addText(`Client Contact: ${pi.clientContact || 'N/A'}\n`);
      assignmentInfo.addText(`Engineer: ${pi.engineerName || 'N/A'}\n`);
      assignmentInfo.addText(`Technical Reviewer: ${pi.technicalReviewer || 'N/A'}\n`);
      assignmentInfo.addText(`Site Visit Date: ${pi.siteVisitDate || 'N/A'}`);
      assignmentInfo.addLineBreak();
    }

    // Methodology section
    if (reportData.assignmentScope) {
      const methodologyTitle = docx.createP();
      methodologyTitle.addText('METHODOLOGY', { bold: true, font_size: 14 });
      methodologyTitle.addLineBreak();

      const as = reportData.assignmentScope;
      
      if (as.intervieweesNames) {
        const intervieweesTitle = docx.createP();
        intervieweesTitle.addText('Interviewees:', { bold: true });
        
        const interviewees = docx.createP();
        interviewees.addText(as.intervieweesNames);
        interviewees.addLineBreak();
      }

      if (as.providedDocumentsTitles) {
        const docsTitle = docx.createP();
        docsTitle.addText('Documents Reviewed:', { bold: true });
        
        const docs = docx.createP();
        docs.addText(as.providedDocumentsTitles);
        docs.addLineBreak();
      }
    }

    // Building System Description section
    if (reportData.buildingObservations?.buildingSystemDescription) {
      const buildingTitle = docx.createP();
      buildingTitle.addText('BUILDING SYSTEM DESCRIPTION', { bold: true, font_size: 14 });
      buildingTitle.addLineBreak();

      const buildingDesc = docx.createP();
      buildingDesc.addText(reportData.buildingObservations.buildingSystemDescription);
      buildingDesc.addLineBreak();
    }

    // Site Observations section
    if (reportData.buildingObservations) {
      const observationsTitle = docx.createP();
      observationsTitle.addText('SITE OBSERVATIONS', { bold: true, font_size: 14 });
      observationsTitle.addLineBreak();

      const bo = reportData.buildingObservations;

      if (bo.exteriorObservations) {
        const exteriorTitle = docx.createP();
        exteriorTitle.addText('Exterior Observations:', { bold: true });
        
        const exterior = docx.createP();
        exterior.addText(bo.exteriorObservations);
        exterior.addLineBreak();
      }

      if (bo.interiorObservations) {
        const interiorTitle = docx.createP();
        interiorTitle.addText('Interior Observations:', { bold: true });
        
        const interior = docx.createP();
        interior.addText(bo.interiorObservations);
        interior.addLineBreak();
      }

      if (bo.otherSiteObservations) {
        const otherTitle = docx.createP();
        otherTitle.addText('Other Site Observations:', { bold: true });
        
        const other = docx.createP();
        other.addText(bo.otherSiteObservations);
        other.addLineBreak();
      }
    }

    // Research section
    if (reportData.research) {
      const researchTitle = docx.createP();
      researchTitle.addText('RESEARCH', { bold: true, font_size: 14 });
      researchTitle.addLineBreak();

      const r = reportData.research;

      if (r.weatherDataSummary) {
        const weatherTitle = docx.createP();
        weatherTitle.addText('Weather Data Summary:', { bold: true });
        
        const weather = docx.createP();
        weather.addText(r.weatherDataSummary);
        weather.addLineBreak();
      }

      if (r.corelogicHailSummary) {
        const hailTitle = docx.createP();
        hailTitle.addText('CoreLogic Hail Summary:', { bold: true });
        
        const hail = docx.createP();
        hail.addText(r.corelogicHailSummary);
        hail.addLineBreak();
      }

      if (r.corelogicWindSummary) {
        const windTitle = docx.createP();
        windTitle.addText('CoreLogic Wind Summary:', { bold: true });
        
        const wind = docx.createP();
        wind.addText(r.corelogicWindSummary);
        wind.addLineBreak();
      }
    }

    // Discussion & Analysis section
    if (reportData.discussionAnalysis) {
      const discussionTitle = docx.createP();
      discussionTitle.addText('DISCUSSION & ANALYSIS', { bold: true, font_size: 14 });
      discussionTitle.addLineBreak();

      const da = reportData.discussionAnalysis;

      if (da.siteDiscussionAnalysis) {
        const siteTitle = docx.createP();
        siteTitle.addText('Site Discussion & Analysis:', { bold: true });
        
        const site = docx.createP();
        site.addText(da.siteDiscussionAnalysis);
        site.addLineBreak();
      }

      if (da.weatherDiscussionAnalysis) {
        const weatherAnalysisTitle = docx.createP();
        weatherAnalysisTitle.addText('Weather Discussion & Analysis:', { bold: true });
        
        const weatherAnalysis = docx.createP();
        weatherAnalysis.addText(da.weatherDiscussionAnalysis);
        weatherAnalysis.addLineBreak();
      }

      if (da.weatherImpactAnalysis) {
        const impactTitle = docx.createP();
        impactTitle.addText('Weather Impact Analysis:', { bold: true });
        
        const impact = docx.createP();
        impact.addText(da.weatherImpactAnalysis);
        impact.addLineBreak();
      }

      if (da.recommendationsAndDiscussion) {
        const recsTitle = docx.createP();
        recsTitle.addText('Recommendations & Discussion:', { bold: true });
        
        const recs = docx.createP();
        recs.addText(da.recommendationsAndDiscussion);
        recs.addLineBreak();
      }
    }

    // Conclusions section
    if (reportData.conclusions?.conclusions) {
      const conclusionsTitle = docx.createP();
      conclusionsTitle.addText('CONCLUSIONS', { bold: true, font_size: 14 });
      conclusionsTitle.addLineBreak();

      const conclusions = docx.createP();
      conclusions.addText(reportData.conclusions.conclusions);
      conclusions.addLineBreak();
    }
  }

  /**
   * Add content to document
   */
  private addContent(docx: any, content: string): void {
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        // Check if it's a heading
        const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
        if (headingMatch) {
          const text = headingMatch[2];
          const p = docx.createP();
          p.addText(text, { bold: true, font_size: 16 });
          p.addLineBreak();
        } else {
          // Regular paragraph
          const p = docx.createP();
          p.addText(line);
        }
      } else {
        // Empty line
        docx.createP().addLineBreak();
      }
    }
  }

  /**
   * Add inline images to document
   */
  private async addInlineImages(docx: any, images: ReportImage[]): Promise<void> {
    // Add images section
    const imagesTitle = docx.createP();
    imagesTitle.addText('Images', { bold: true, font_size: 18 });
    imagesTitle.addLineBreak();

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      try {
        // Add image caption
        const caption = docx.createP();
        caption.addText(`Image ${i + 1}: ${image.originalFilename}`, { bold: true });
        
        if (image.description) {
          caption.addLineBreak();
          caption.addText(image.description);
        }
        caption.addLineBreak();

        // Download and add image
        const imageUrl = image.publicUrl || image.googleDriveUrl;
        if (imageUrl) {
          const imageData = await this.downloadImage(imageUrl);
          if (imageData) {
            const processedImage = await this.processImageForWord(imageData);
            
            const imagePara = docx.createP({ align: 'center' });
            imagePara.addImage(processedImage, { 
              cx: 400, 
              cy: 300 
            });
            imagePara.addLineBreak();
          }
        }
      } catch (error) {
        console.error(`Failed to add image ${image.originalFilename}:`, error);
        
        // Add placeholder text
        const errorPara = docx.createP();
        errorPara.addText(`[Image could not be loaded: ${image.originalFilename}]`);
        errorPara.addLineBreak();
      }
    }
  }

  /**
   * Add image references to document
   */
  private addImageReferences(docx: any, images: ReportImage[]): void {
    // Add references section
    const refsTitle = docx.createP();
    refsTitle.addText('Referenced Images', { bold: true, font_size: 18 });
    refsTitle.addLineBreak();

    images.forEach((image, index) => {
      const ref = docx.createP();
      ref.addText(`${index + 1}. ${image.originalFilename}`, { bold: true });
      
      if (image.description) {
        ref.addLineBreak();
        ref.addText(`   Description: ${image.description}`);
      }
      
      if (image.googleDriveUrl) {
        ref.addLineBreak();
        ref.addText(`   Link: ${image.googleDriveUrl}`);
      }
      
      ref.addLineBreak();
    });
  }

  /**
   * Download image from URL
   */
  private async downloadImage(url: string): Promise<Buffer | null> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout
        maxContentLength: 10 * 1024 * 1024, // 10MB max
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error downloading image:', error);
      return null;
    }
  }

  /**
   * Process image for Word document (resize if needed)
   */
  private async processImageForWord(imageBuffer: Buffer): Promise<Buffer> {
    try {
      // Use sharp to process the image
      const metadata = await sharp(imageBuffer).metadata();
      
      // Check if resizing is needed
      if (metadata.width && metadata.height && 
          (metadata.width > 800 || metadata.height > 600)) {
        
        return await sharp(imageBuffer)
          .resize(800, 600, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 85 })
          .toBuffer();
      }

      // Convert to JPEG if not already
      if (metadata.format !== 'jpeg') {
        return await sharp(imageBuffer)
          .jpeg({ quality: 85 })
          .toBuffer();
      }

      return imageBuffer;
    } catch (error) {
      console.error('Error processing image:', error);
      return imageBuffer; // Return original if processing fails
    }
  }

  /**
   * Check if server-side generation is needed
   */
  shouldUseServerSide(images: ReportImage[], documentSize?: number): boolean {
    // Use server-side if document is very large
    if (documentSize && documentSize > 40 * 1024 * 1024) {
      return true;
    }

    // Use server-side if many images
    if (images.length > 20) {
      return true;
    }

    // Use server-side if total image size is large
    const totalImageSize = images.reduce((sum, img) => sum + (img.fileSize || 0), 0);
    if (totalImageSize > 30 * 1024 * 1024) {
      return true;
    }

    return false;
  }
}

export const wordGenerationService = new WordGenerationService();