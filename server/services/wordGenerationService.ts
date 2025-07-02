import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import ImageModule from 'docxtemplater-image-module-free';
import axios from 'axios';
import sharp from 'sharp';
import { CustomImageModule, ImagePlaceholder } from '../modules/customImageModule';
import { aiTextService } from './aiTextService';

interface ReportImage {
  originalFilename: string;
  s3Url?: string;
  publicUrl?: string;
  fileSize: number;
  description?: string;
}

interface ReportData {
  projectInformation?: {
    fileNumber?: string;
    dateOfCreation?: string;
    insuredName?: string;
    insuredAddress?: string;
    dateOfLoss?: string;
    claimNumber?: string;
    clientCompany?: string;
    clientContact?: string;
    clientEmail?: string;
    clientPhone?: string;
    engineerName?: string;
    technicalReviewer?: string;
    receivedDate?: string;
    siteVisitDate?: string;
    licenseNumber?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
  };
  assignmentScope?: {
    intervieweesNames?: string;
    providedDocumentsTitles?: string;
    additionalMethodologyNotes?: string;
  };
  buildingAndSite?: {
    structureBuiltDate?: string;
    structureAge?: string;
    buildingSystemDescription?: string;
    frontFacingDirection?: string;
    exteriorObservations?: string;
    interiorObservations?: string;
    otherSiteObservations?: string;
  };
  // Legacy field name support
  buildingObservations?: {
    structureBuiltDate?: string;
    structureAge?: string;
    buildingSystemDescription?: string;
    frontFacingDirection?: string;
    exteriorObservations?: string;
    interiorObservations?: string;
    otherSiteObservations?: string;
  };
  research?: {
    weatherDataSummary?: string;
    corelogicHailSummary?: string;
    corelogicWindSummary?: string;
  };
  discussionAndAnalysis?: {
    siteDiscussionAnalysis?: string;
    weatherDiscussionAnalysis?: string;
    weatherImpactAnalysis?: string;
    recommendationsAndDiscussion?: string;
  };
  // Legacy field name support
  discussionAnalysis?: {
    siteDiscussionAnalysis?: string;
    weatherDiscussionAnalysis?: string;
    weatherImpactAnalysis?: string;
    recommendationsAndDiscussion?: string;
  };
  conclusions?: {
    conclusions?: string;
  };
}

interface WordGenerationOptions {
  title: string;
  reportData: ReportData;
  images: ReportImage[];
  includePhotosInline?: boolean;
  aiEnhanceText?: boolean;
  templateId?: string;
}

class WordGenerationService {
  constructor() {
    console.log('📄 WordGenerationService initialized - using direct template approach');
  }

  /**
   * Generate Word document using direct template approach
   */
  async generateDocument(options: WordGenerationOptions, res: Response): Promise<void> {
    const { title, reportData, images, includePhotosInline, aiEnhanceText, templateId = 'MJSolutionsTemplate' } = options;

    try {
      console.log(`🚀 Starting Word generation with template: ${templateId}`);
      console.log(`📸 Images: ${images?.length || 0}`);
      console.log(`🔧 Include photos inline: ${includePhotosInline}`);
      
      // Debug image data
      if (images && images.length > 0) {
        console.log('🔍 Image data:');
        images.forEach((img, i) => {
          console.log(`  Image ${i + 1}:`, {
            filename: img.originalFilename,
            hasPublicUrl: !!img.publicUrl,
            hasS3Url: !!img.s3Url,
            fileSize: img.fileSize
          });
        });
      } else {
        console.log('🔍 No images provided for Word generation');
      }
      
      // Load template file
      const templateBuffer = this.loadTemplate(templateId);
      
      // Create direct data mapping from form data
      console.log('📋 Creating direct data mapping...');
      const templateData = await this.createDirectDataMapping(reportData, images, includePhotosInline, aiEnhanceText);
      
      // Generate document using docxtemplater
      console.log('🔧 Filling template with docxtemplater...');
      const documentBuffer = await this.fillTemplate(templateBuffer, templateData);
      
      // 🧨 DIAGNOSTIC 6: Enhanced response headers and buffer transmission
      console.log('🔍 DIAGNOSTIC: Response preparation');
      console.log('📤 Setting response headers...');
      
      // Generate safe filename
      const safeTitle = title.replace(/[^a-z0-9\s\-_]/gi, '').replace(/\s+/g, '_');
      const filename = `${safeTitle}_${new Date().toISOString().split('T')[0]}.docx`;
      console.log(`📁 Generated filename: ${filename}`);
      
      // Set proper response headers with enhanced validation
      const headers = {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': documentBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
      console.log('🏷️ Response headers:', headers);
      
      // Apply headers
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      // Validate buffer before sending
      console.log(`📏 Final buffer validation: ${documentBuffer.length} bytes`);
      
      if (documentBuffer.length === 0) {
        throw new Error('Cannot send empty document buffer');
      }
      
      // Check if buffer is accidentally encoded as string
      if (typeof documentBuffer === 'string') {
        console.error('❌ Buffer is accidentally a string instead of Buffer');
        throw new Error('Document buffer has wrong type (string instead of Buffer)');
      }
      
      // Send the document buffer (Node.js automatically handles binary)
      console.log(`📨 Sending document buffer...`);
      res.end(documentBuffer);
      
      console.log(`✅ Document sent successfully: ${documentBuffer.length} bytes`);
      
      console.log(`✅ Word document generated successfully using template: ${templateId}`);
      
    } catch (error: any) {
      console.error('❌ Word generation failed:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Document generation failed', details: error.message });
      }
      throw error;
    }
  }

  /**
   * Load Word template file
   */
  private loadTemplate(templateId: string): Buffer {
    const templatePath = path.join(process.cwd(), 'server/templates', `${templateId}.docx`);
    
    console.log(`📂 Loading template: ${templateId}`);
    console.log(`📁 Template path: ${templatePath}`);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }
    
    // Read file with binary encoding
    const templateBuffer = fs.readFileSync(templatePath, null);
    console.log(`✅ Template loaded: ${templateId} (${templateBuffer.length} bytes)`);
    
    // Validate it's a proper Word document
    this.validateTemplate(templateBuffer, templatePath);
    
    return templateBuffer;
  }

  /**
   * Validate template is a proper Word document
   */
  private validateTemplate(templateBuffer: Buffer, templatePath: string): void {
    // Check ZIP signature (Word docs are ZIP files)
    const zipSignature = Buffer.from(templateBuffer.subarray(0, 4));
    const expectedSignature = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
    
    if (!zipSignature.equals(expectedSignature)) {
      throw new Error(`Invalid Word document format: ${templatePath}`);
    }
    
    // Test ZIP structure
    try {
      const zip = new PizZip(templateBuffer);
      const documentXml = zip.file('word/document.xml');
      
      if (!documentXml) {
        throw new Error(`Invalid Word document structure: ${templatePath}`);
      }
      
      // Extract and log placeholders for debugging
      const content = documentXml.asText();
      const placeholders = content.match(/\{\{[^}]+\}\}/g) || [];
      console.log(`🏷️ Template contains ${placeholders.length} placeholders:`, placeholders.slice(0, 10));
      
    } catch (error: any) {
      throw new Error(`Template validation failed: ${error.message}`);
    }
    
    console.log('✅ Template validation successful');
  }

  /**
   * Create comprehensive data mapping ensuring ALL required template fields are covered
   */
  private async createDirectDataMapping(
    reportData: ReportData, 
    images: ReportImage[], 
    includePhotosInline?: boolean, 
    aiEnhanceText?: boolean
  ): Promise<any> {
    console.log('🗺️ Creating comprehensive data mapping with safe defaults...');
    console.log('📊 Input reportData structure:', {
      hasProjectInfo: !!reportData.projectInformation,
      hasAssignmentScope: !!reportData.assignmentScope,
      hasBuildingAndSite: !!reportData.buildingAndSite,
      hasBuildingObservations: !!reportData.buildingObservations,
      hasResearch: !!reportData.research,
      hasDiscussionAndAnalysis: !!reportData.discussionAndAnalysis,
      hasDiscussionAnalysis: !!reportData.discussionAnalysis,
      hasConclusions: !!reportData.conclusions
    });
    
    const templateData: any = {};
    
    // Helper function to safely get nested values with appropriate defaults
    const safeGet = (obj: any, path: string, defaultValue: string = 'To be determined'): string => {
      const keys = path.split('.');
      let current = obj;
      for (const key of keys) {
        if (current && current[key] !== undefined && current[key] !== null && current[key] !== '') {
          current = current[key];
        } else {
          return defaultValue;
        }
      }
      return current || defaultValue;
    };

    // PROJECT INFORMATION - All required fields with contextually appropriate defaults
    const pi = reportData.projectInformation || {};
    templateData.insured_name = this.sanitizeText(safeGet(pi, 'insuredName', '[Insured Name]'));
    templateData.claim_number = this.sanitizeText(safeGet(pi, 'claimNumber', '[Claim Number]'));
    templateData.file_number = this.sanitizeText(safeGet(pi, 'fileNumber', '[File Number]'));
    
    // Auto-generate dateOfCreation if missing (not collected by form)
    templateData.date_of_creation = this.sanitizeText(
      safeGet(pi, 'dateOfCreation', new Date().toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      }))
    );
    
    templateData.insured_address = this.sanitizeText(safeGet(pi, 'insuredAddress', '[Property Address]'));
    templateData.date_of_loss = this.sanitizeText(safeGet(pi, 'dateOfLoss', '[Date of Loss]'));
    templateData.client_company = this.sanitizeText(safeGet(pi, 'clientCompany', '[Client Company]'));
    templateData.engineer_name = this.sanitizeText(safeGet(pi, 'engineerName', '[Engineer Name]'));
    
    // Auto-generate technicalReviewer if missing (not collected by form)
    templateData.technical_reviewer = this.sanitizeText(
      safeGet(pi, 'technicalReviewer', 'To be assigned')
    );
    
    // Auto-generate receivedDate if missing (not collected by form)
    templateData.received_date = this.sanitizeText(
      safeGet(pi, 'receivedDate', 'To be determined')
    );
    
    templateData.site_visit_date = this.sanitizeText(safeGet(pi, 'siteVisitDate', '[Site Visit Date]'));
    
    // Additional project info fields
    templateData.client_contact = this.sanitizeText(safeGet(pi, 'clientContact', '[Client Contact]'));
    templateData.client_email = this.sanitizeText(safeGet(pi, 'clientEmail', '[Client Email]'));
    templateData.client_phone = this.sanitizeText(safeGet(pi, 'clientPhone', '[Client Phone]'));
    templateData.license_number = this.sanitizeText(safeGet(pi, 'licenseNumber', '[License Number]'));

    // ASSIGNMENT SCOPE - Handle missing data gracefully
    const as = reportData.assignmentScope || {};
    templateData.interviewees_names = this.sanitizeText(safeGet(as, 'intervieweesNames', 'No interviews conducted'));
    templateData.provided_documents_titles = this.sanitizeText(safeGet(as, 'providedDocumentsTitles', 'No documents provided'));

    // BUILDING & SITE OBSERVATIONS - Support both field names (buildingAndSite and buildingObservations)
    const bs = reportData.buildingAndSite || reportData.buildingObservations || {};
    
    // Auto-generate missing fields not collected by form
    templateData.structure_built_date = this.sanitizeText(
      safeGet(bs, 'structureBuiltDate', 'To be determined')
    );
    templateData.structure_age = this.sanitizeText(
      safeGet(bs, 'structureAge', 'To be determined')
    );
    templateData.front_facing_direction = this.sanitizeText(
      safeGet(bs, 'frontFacingDirection', 'To be determined')
    );
    
    // Process text fields with AI enhancement
    templateData.building_system_description = await this.processText(
      bs.buildingSystemDescription, 'building_system_description', aiEnhanceText
    );
    templateData.exterior_observations = await this.processText(
      bs.exteriorObservations, 'exterior_observations', aiEnhanceText
    );
    templateData.interior_observations = await this.processText(
      bs.interiorObservations, 'interior_observations', aiEnhanceText
    );
    // Handle otherSiteObservations - not collected by form, so provide default
    templateData.other_site_observations = await this.processText(
      bs.otherSiteObservations || 'No additional site observations documented.', 
      'other_site_observations', 
      aiEnhanceText
    );

    // RESEARCH - Weather and CoreLogic data
    const research = reportData.research || {};
    templateData.weather_data_summary = await this.processText(
      research.weatherDataSummary, 'weather_data_summary', aiEnhanceText
    );
    templateData.corelogic_hail_summary = await this.processText(
      research.corelogicHailSummary, 'corelogic_hail_summary', aiEnhanceText
    );
    templateData.corelogic_wind_summary = await this.processText(
      research.corelogicWindSummary, 'corelogic_wind_summary', aiEnhanceText
    );

    // DISCUSSION & ANALYSIS - Support both field names (discussionAndAnalysis and discussionAnalysis)
    const da = reportData.discussionAndAnalysis || reportData.discussionAnalysis || {};
    templateData.site_discussion_analysis = await this.processText(
      da.siteDiscussionAnalysis, 'site_discussion_analysis', aiEnhanceText
    );
    templateData.weather_discussion_analysis = await this.processText(
      da.weatherDiscussionAnalysis, 'weather_discussion_analysis', aiEnhanceText
    );
    templateData.weather_impact_analysis = await this.processText(
      da.weatherImpactAnalysis, 'weather_impact_analysis', aiEnhanceText
    );
    templateData.recommendations_and_discussion = await this.processText(
      da.recommendationsAndDiscussion, 'recommendations_and_discussion', aiEnhanceText
    );

    // CONCLUSIONS
    const conclusions = reportData.conclusions || {};
    templateData.conclusions = await this.processText(
      conclusions.conclusions, 'conclusions', aiEnhanceText
    );

    // DYNAMIC FIELDS
    templateData.current_date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // COMPANY INFORMATION DEFAULTS
    templateData.company_name = 'ENGINEERING CONSULTANTS';
    templateData.company_address = '7975 Stage Hills Boulevard, Suite 1\nMemphis, TN 38133\nTel:901-377-9984';
    templateData.company_file_prefix = 'Company';

    // AERIAL VIEW - Now handled via download button in UI
    templateData.aerial_view_image = '';
    templateData.aerial_view_caption = '';
    templateData.aerial_view_description = '';
    templateData.aerial_view_coordinates = '';

    // IMAGE PLACEHOLDERS - Add if inline photos are requested
    if (includePhotosInline && images && images.length > 0) {
      console.log(`📸 Adding ${images.length} image placeholders...`);
      for (let i = 0; i < Math.min(images.length, 20); i++) { // Limit to 20 images
        const imageIndex = i + 1;
        templateData[`photo_${imageIndex}`] = `[Photo ${imageIndex}: ${images[i].originalFilename}]`;
        templateData[`photo_${imageIndex}_caption`] = `Photo ${imageIndex}: ${images[i].originalFilename}`;
        templateData[`photo_${imageIndex}_description`] = this.sanitizeText(images[i].description || '');
      }
    }

    // APPENDICES - Add image list for appendices section
    if (images && images.length > 0) {
      console.log(`📎 Creating appendices with ${images.length} images...`);
      
      // Create formatted list of images for appendix (text only)
      let appendixPhotosList = '';
      
      for (let i = 0; i < images.length; i++) {
        const imageIndex = i + 1;
        const image = images[i];
        
        // Simple list for table of contents style listing
        appendixPhotosList += `\nPhoto ${imageIndex}: ${image.originalFilename}`;
        if (image.description) {
          appendixPhotosList += ` - ${this.sanitizeText(image.description)}`;
        }
      }
      
      // Process images for embedding - Use static placeholders up to 20 images
      console.log(`📸 Processing images for photograph embedding - static placeholders (up to 20)...`);
      const photographBuffers = await this.preparePhotographsForTemplate(images);
      
      // Prepare image placeholders for our custom image module
      const imagePlaceholders: ImagePlaceholder[] = [];
      const MAX_IMAGES = 20;
      
      for (let i = 1; i <= MAX_IMAGES; i++) {
        if (i <= photographBuffers.length) {
          // Image exists - prepare for custom image module
          const photo = photographBuffers[i - 1];
          const imageUrl = photo.originalUrl; // S3 URL
          
          imagePlaceholders.push({
            tag: `photo_${i}`,
            imageUrl: imageUrl,
            buffer: photo.image // Already processed buffer
          });
          
          // Set placeholder in template data (will be replaced by custom module)
          templateData[`photo_${i}`] = `{{photo_${i}}}`; // Placeholder for custom module
          console.log(`✅ Prepared photo_${i} for custom image module`);
        } else {
          // No image - empty string
          templateData[`photo_${i}`] = '';
          console.log(`🔄 Set photo_${i} as empty`);
        }
      }
      
      console.log(`📸 Prepared ${imagePlaceholders.length} images for custom image module`);
      
      // Store image placeholders for later processing
      (templateData as any)._imagePlaceholders = imagePlaceholders;
      
      // Add helper fields for conditional sections
      templateData.hasPhotographs = photographBuffers.length > 0;
      templateData.photographCount = photographBuffers.length;
      
      console.log(`✅ Created static placeholders for ${photographBuffers.length} images (supports up to 20)`);
      
      // Debug: Log the actual photo placeholders created
      for (let i = 1; i <= Math.min(photographBuffers.length, 5); i++) {
        console.log(`📸 photo_${i}: ${templateData[`photo_${i}`] ? `Buffer(${templateData[`photo_${i}`].length})` : 'null'}`);
        console.log(`📝 photo_${i}_exists: ${templateData[`photo_${i}_exists`]}`);
        console.log(`📋 photo_${i}_caption: "${templateData[`photo_${i}_caption`]}"`);
      }

      // Note: Individual static placeholders are already created above
      // No need for additional processing since we have photo_1, photo_2, etc.
      console.log(`📸 Static placeholder creation complete`);
      
      // Add any remaining individual placeholder text for compatibility
      for (let i = 0; i < Math.min(images.length, 20); i++) {
        const imageIndex = i + 1;
        const image = images[i];
        
        // Add text-based placeholders for any template that might need them
        templateData[`image_${imageIndex}_text`] = `[Photo ${imageIndex}: ${image.originalFilename}]`;
        templateData[`image_${imageIndex}_description_text`] = this.sanitizeText(image.description || '');
      }
      
      templateData.appendix_photos_list = appendixPhotosList.trim();
      templateData.appendix_photos_count = images.length.toString();
      templateData.has_appendix_photos = 'true';
    } else {
      templateData.appendix_photos_list = 'No photos included.';
      templateData.appendix_photos_count = '0';
      templateData.has_appendix_photos = 'false';
    }

    // VALIDATION - Ensure all required fields have valid, non-empty values
    const requiredFields = [
      'insured_name', 'claim_number', 'file_number', 'date_of_creation', 'insured_address',
      'date_of_loss', 'client_company', 'engineer_name', 'technical_reviewer', 'received_date',
      'site_visit_date', 'interviewees_names', 'provided_documents_titles', 'structure_built_date',
      'structure_age', 'building_system_description', 'front_facing_direction', 'exterior_observations',
      'interior_observations', 'other_site_observations', 'weather_data_summary', 'corelogic_hail_summary',
      'corelogic_wind_summary', 'site_discussion_analysis', 'weather_discussion_analysis',
      'weather_impact_analysis', 'recommendations_and_discussion', 'conclusions',
      'appendix_photos_list', 'appendix_photos_count', 'has_appendix_photos',
      'photographs', 'hasPhotographs', 'photographCount'
    ];

    // Define field-specific defaults for better context
    const fieldDefaults: Record<string, string> = {
      'insured_name': '[Insured Name]',
      'claim_number': '[Claim Number]',
      'file_number': '[File Number]',
      'insured_address': '[Property Address]',
      'date_of_loss': '[Date of Loss]',
      'client_company': '[Client Company]',
      'engineer_name': '[Engineer Name]',
      'technical_reviewer': '[Technical Reviewer]',
      'received_date': '[Date Received]',
      'site_visit_date': '[Site Visit Date]',
      'interviewees_names': 'No interviews conducted.',
      'provided_documents_titles': 'No documents provided.',
      'structure_built_date': '[Year Built]',
      'structure_age': '[Structure Age]',
      'front_facing_direction': '[Front Facing Direction]',
      'building_system_description': 'Building system description to be provided.',
      'exterior_observations': 'Exterior observations to be documented.',
      'interior_observations': 'Interior observations to be documented.',
      'other_site_observations': 'Additional site observations to be documented.',
      'weather_data_summary': 'Weather data analysis to be provided.',
      'corelogic_hail_summary': 'Hail data analysis to be provided.',
      'corelogic_wind_summary': 'Wind data analysis to be provided.',
      'site_discussion_analysis': 'Site analysis and discussion to be provided.',
      'weather_discussion_analysis': 'Weather analysis and discussion to be provided.',
      'weather_impact_analysis': 'Weather impact analysis to be provided.',
      'recommendations_and_discussion': 'Recommendations and discussion to be provided.',
      'conclusions': 'Conclusions to be provided.',
      'appendix_photos_list': 'No photos included.',
      'appendix_photos_count': '0',
      'has_appendix_photos': 'false',
      'photographs': [],
      'hasPhotographs': false,
      'photographCount': '0'
    };

    const missingFields = requiredFields.filter(field => {
      const value = templateData[field];
      // Skip validation for array fields like photographs
      if (Array.isArray(value)) {
        return false;
      }
      // Skip validation for boolean fields
      if (typeof value === 'boolean') {
        return false;
      }
      // For string fields, check if empty or just whitespace
      if (typeof value === 'string') {
        return !value || value.trim() === '';
      }
      // For other types, just check if falsy
      return !value;
    });
    if (missingFields.length > 0) {
      console.warn('⚠️ Missing or empty required fields:', missingFields);
      // Fill missing fields with contextually appropriate defaults
      missingFields.forEach(field => {
        templateData[field] = fieldDefaults[field] || 'To be determined.';
      });
    }

    console.log(`✅ Comprehensive data mapping complete: ${Object.keys(templateData).length} fields`);
    console.log('📋 Required fields covered:', requiredFields.length);
    console.log('🔍 Sample mappings:');
    requiredFields.slice(0, 5).forEach(field => {
      console.log(`  ${field}: "${templateData[field]?.substring(0, 50)}..."`);
    });
    
    return templateData;
  }

  /**
   * Process text with AI enhancement if enabled
   */
  private async processText(text: string | undefined, fieldType: string, aiEnhanceText?: boolean): Promise<string> {
    if (!text || text.trim().length === 0) {
      return 'To be determined.';
    }
    
    // Clean and sanitize first
    let processedText = this.sanitizeText(text);
    
    // Apply AI enhancement if enabled and text contains bullet points
    if (aiEnhanceText && aiTextService.isConfigured()) {
      const hasBulletPoints = /^[\s]*[•\-\*]|^\d+\./gm.test(processedText);
      
      if (hasBulletPoints) {
        try {
          console.log(`🤖 AI enhancing text for ${fieldType}...`);
          const enhancedText = await aiTextService.generateParagraph({
            bulletPoints: processedText,
            fieldType,
            context: 'Civil engineering property inspection report'
          });
          processedText = this.sanitizeText(enhancedText);
          console.log(`✅ AI enhancement complete for ${fieldType}`);
        } catch (error: any) {
          console.warn(`⚠️ AI enhancement failed for ${fieldType}, using original text:`, error.message);
        }
      }
    }
    
    return processedText;
  }

  /**
   * Create a 1x1 transparent PNG buffer for missing image placeholders
   */
  private getTransparentImageBuffer(): Buffer {
    return Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P4z8DwHwAFgwJ/lR9AwQAAAABJRU5ErkJggg==',
      'base64'
    );
  }

  /**
   * Download and process images from S3 for embedding in Word document
   */
  private async preparePhotographsForTemplate(images: ReportImage[]): Promise<any[]> {
    console.log(`📸 Starting photograph preparation for ${images.length} images...`);
    
    if (!images || images.length === 0) {
      console.log('No images to prepare');
      return [];
    }

    const processedPhotographs = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      console.log(`Processing photograph ${i + 1}/${images.length}: ${image.originalFilename}`);

      try {
        const imageUrl = image.publicUrl || image.s3Url;
        if (!imageUrl) {
          console.warn(`❌ No URL available for image ${i + 1}: ${image.originalFilename}`);
          continue;
        }

        // Download image using axios with proper timeout
        console.log(`📥 Downloading image: ${imageUrl.substring(0, 100)}...`);
        const response = await axios({
          method: 'GET',
          url: imageUrl,
          responseType: 'arraybuffer',
          timeout: 30000, // 30 second timeout
          headers: {
            'User-Agent': 'IncidentReporter DocxTemplater'
          }
        });

        console.log(`✅ Downloaded image ${i + 1}: ${response.data.byteLength} bytes`);

        // Process image with sharp for optimal sizing
        const imageBuffer = Buffer.from(response.data);
        const processedBuffer = await this.resizeImageForDocument(imageBuffer);
        
        console.log(`🖼️ Processed image ${i + 1}: ${processedBuffer.length} bytes`);

        // Add to photographs array for template
        processedPhotographs.push({
          image: processedBuffer, // This is what docxtemplater-image-module-free expects
          caption: image.description || image.originalFilename || `Photo ${i + 1}`,
          filename: image.originalFilename,
          originalUrl: imageUrl
        });

      } catch (error) {
        console.error(`❌ Failed to process image ${i + 1}:`, error.message);
        
        // Add placeholder for failed images
        processedPhotographs.push({
          image: null,
          caption: `${image.originalFilename || `Photo ${i + 1}`} - [Image failed to load: ${error.message}]`,
          filename: image.originalFilename,
          error: true
        });
      }
    }

    console.log(`🎯 Processed ${processedPhotographs.length} photographs (${processedPhotographs.filter(p => !p.error).length} successful)`);
    return processedPhotographs;
  }

  /**
   * Resize image maintaining aspect ratio for document embedding
   */
  private async resizeImageForDocument(imageBuffer: Buffer): Promise<Buffer> {
    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      
      console.log(`Original dimensions: ${metadata.width}x${metadata.height}`);

      // Calculate optimal dimensions (max 500px width, 400px height)
      const maxWidth = 500;
      const maxHeight = 400;
      
      let newWidth = metadata.width || maxWidth;
      let newHeight = metadata.height || maxHeight;
      
      if (newWidth > maxWidth || newHeight > maxHeight) {
        const aspectRatio = newWidth / newHeight;
        
        if (newWidth > maxWidth) {
          newWidth = maxWidth;
          newHeight = newWidth / aspectRatio;
        }
        
        if (newHeight > maxHeight) {
          newHeight = maxHeight;
          newWidth = newHeight * aspectRatio;
        }
      }

      newWidth = Math.round(newWidth);
      newHeight = Math.round(newHeight);
      
      console.log(`Resizing to: ${newWidth}x${newHeight}`);

      const resizedBuffer = await image
        .resize(newWidth, newHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      return resizedBuffer;
    } catch (error) {
      console.error('Error resizing image:', error);
      // Return original buffer if resize fails
      return imageBuffer;
    }
  }

  /**
   * Sanitize text for Word document with safe defaults
   */
  private sanitizeText(text: any, defaultValue: string = 'To be determined'): string {
    // Handle null, undefined, or empty values
    if (text === null || text === undefined || text === '') {
      return defaultValue;
    }
    
    const sanitized = String(text)
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/[\uFEFF\uFFFE\uFFFF]/g, '') // Remove BOM and special Unicode
      .replace(/&/g, '&amp;') // XML escape
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      .trim();
    
    // Return default if sanitization resulted in empty string
    return sanitized || defaultValue;
  }

  /**
   * Fill template with data using docxtemplater - Enhanced with comprehensive diagnostics
   */
  private async fillTemplate(templateBuffer: Buffer, templateData: any): Promise<Buffer> {
    console.log('🔧 Filling template with docxtemplater...');
    
    // 🧨 DIAGNOSTIC 1: Validate input template buffer
    console.log('🔍 DIAGNOSTIC: Input template validation');
    console.log(`📏 Template buffer size: ${templateBuffer.length} bytes`);
    
    if (templateBuffer.length === 0) {
      throw new Error('Template buffer is empty');
    }
    
    // Check template ZIP signature
    const templateSignature = Buffer.from(templateBuffer.subarray(0, 4));
    const expectedZipSignature = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
    if (!templateSignature.equals(expectedZipSignature)) {
      console.error('❌ Invalid template ZIP signature:', templateSignature);
      throw new Error('Template file is not a valid ZIP/DOCX file');
    }
    console.log('✅ Template ZIP signature valid');
    
    try {
      // Create ZIP from template
      console.log('📁 Creating ZIP from template...');
      const zip = new PizZip(templateBuffer);
      
      // 🧨 DIAGNOSTIC 2: Validate template structure
      console.log('🔍 DIAGNOSTIC: Template structure validation');
      const zipEntries = Object.keys(zip.files);
      console.log(`📂 ZIP entries found: ${zipEntries.length}`);
      
      // Check for essential DOCX files
      const requiredFiles = ['[Content_Types].xml', 'word/document.xml'];
      const missingFiles = requiredFiles.filter(file => !zipEntries.includes(file));
      if (missingFiles.length > 0) {
        console.error('❌ Missing required DOCX files:', missingFiles);
        throw new Error(`Template missing required files: ${missingFiles.join(', ')}`);
      }
      console.log('✅ Essential DOCX files present');
      
      // Use our custom image module instead of the paid version
      console.log(`🔧 Initializing custom image module for free image embedding...`);
      const customImageModule = new CustomImageModule();
      customImageModule.setDocxZip(zip);

      // Create docxtemplater instance WITHOUT third-party image module
      console.log('⚙️ Creating docxtemplater instance with custom image processing...');
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        errorLogging: true,
        delimiters: { start: '{{', end: '}}' },
        // No third-party image modules - we'll handle images ourselves
        nullGetter: function(part: any, scope: any, context: any) {
          console.log(`❓ nullGetter called for: ${part.value}`);
          
          // If placeholder is undefined, just don't show it at all
          console.log(`🚫 Hiding undefined placeholder: ${part.value}`);
          return '';
        }
      });
      
      // 🧨 DIAGNOSTIC 3: Validate template data
      console.log('🔍 DIAGNOSTIC: Template data validation');
      console.log(`📊 Template data keys: ${Object.keys(templateData).length}`);
      console.log('🏷️ First 10 template variables:');
      Object.keys(templateData).slice(0, 10).forEach(key => {
        const value = templateData[key];
        const preview = typeof value === 'string' 
          ? value.substring(0, 50) + (value.length > 50 ? '...' : '')
          : String(value);
        console.log(`  ${key}: "${preview}"`);
      });
      
      // Check for undefined/null values and image buffers
      const problematicKeys = Object.keys(templateData).filter(key => 
        templateData[key] === undefined || templateData[key] === null
      );
      if (problematicKeys.length > 0) {
        console.warn('⚠️ Found null/undefined values:', problematicKeys);
      }
      
      // Add specific logging for photographs array
      if (templateData.photographs && Array.isArray(templateData.photographs)) {
        console.log(`📸 Photographs array structure:`);
        console.log(`  Length: ${templateData.photographs.length}`);
        templateData.photographs.forEach((photo: any, index: number) => {
          console.log(`  Photo ${index + 1}:`, {
            hasImage: photo.image ? `Buffer(${photo.image.length})` : 'null',
            caption: photo.caption?.substring(0, 30) || 'null',
            filename: photo.filename || 'null'
          });
        });
      } else {
        console.log(`❌ No photographs array found in template data`);
      }
      
      
      // Set data and render with enhanced error catching (using correct API for v3.65.1)
      console.log('📊 Setting template data and rendering...');
      
      // 🧨 DIAGNOSTIC 4: Enhanced render with try/catch and detailed template error logging
      console.log('🖼️ Rendering template with error catching...');
      try {
        // For docxtemplater v3.65.1, use render() with data passed directly
        console.log('🔧 Starting template render process...');
        
        doc.render(templateData);
        console.log('✅ Template rendered successfully');

        // Process images with our custom image module
        const imagePlaceholders = (templateData as any)._imagePlaceholders as ImagePlaceholder[];
        if (imagePlaceholders && imagePlaceholders.length > 0) {
          console.log(`🖼️ Processing ${imagePlaceholders.length} images with custom image module...`);
          
          // Get the rendered document XML
          const documentXml = zip.file('word/document.xml')?.asText() || '';
          
          // Process image placeholders
          const processedXml = await customImageModule.processImagePlaceholders(documentXml, imagePlaceholders);
          
          // Update the document XML in the zip
          zip.file('word/document.xml', processedXml);
          
          console.log('✅ Custom image processing completed');
        }
      } catch (renderError: any) {
        console.error('❌ Docxtemplater render error:', renderError);
        console.error('🔍 Error details:', {
          message: renderError.message,
          properties: renderError.properties || {},
          stack: renderError.stack
        });
        
        // 🎯 STEP 1: Log All Template Errors with detailed breakdown
        console.error('🚨 DETAILED TEMPLATE ERROR ANALYSIS:');
        if (renderError.properties && renderError.properties.errors) {
          console.error(`📋 Found ${renderError.properties.errors.length} template errors:`);
          renderError.properties.errors.forEach((e: any, i: number) => {
            const tag = e.properties?.tag || e.properties?.xtag || 'unknown';
            const explanation = e.properties?.explanation || e.message || 'No explanation';
            const file = e.properties?.file || 'unknown file';
            const context = e.properties?.context || 'no context';
            const offset = e.properties?.offset || 'unknown position';
            
            console.error(`[${i + 1}] Tag: "${tag}" | File: ${file} | Explanation: ${explanation}`);
            console.error(`    Context: "${context}" | Offset: ${offset}`);
            if (e.properties?.scope) {
              console.error(`    Scope: ${JSON.stringify(e.properties.scope)}`);
            }
          });
        }
        
        // Enhanced error reporting for single errors
        if (renderError.properties && !renderError.properties.errors) {
          const { id, explanation, scope, tag, xtag, file, context, offset } = renderError.properties;
          console.error(`🚨 Single Render Error Details:
            - Error ID: ${id}
            - Tag: ${tag || xtag || 'unknown'}
            - File: ${file || 'unknown'}
            - Explanation: ${explanation}
            - Context: ${context || 'no context'}
            - Offset: ${offset || 'unknown'}
            - Scope: ${JSON.stringify(scope, null, 2)}`);
        }
        
        throw new Error(`Template render failed: ${renderError.message}`);
      }
      
      // Generate output buffer with validation
      console.log('📦 Generating output document...');
      const outputZip = doc.getZip();
      
      // 🧨 DIAGNOSTIC 5: Enhanced buffer generation and validation
      console.log('🔍 DIAGNOSTIC: Output buffer generation');
      const buffer = Buffer.from(outputZip.generate({ 
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      }));
      
      console.log(`📏 Generated buffer size: ${buffer.length} bytes`);
      
      // Validate output buffer
      if (buffer.length === 0) {
        throw new Error('Generated document buffer is empty');
      }
      
      if (buffer.length < 1000) {
        console.warn(`⚠️ Generated buffer seems unusually small: ${buffer.length} bytes`);
      }
      
      // Check output ZIP signature
      const outputSignature = Buffer.from(buffer.subarray(0, 4));
      if (!outputSignature.equals(expectedZipSignature)) {
        console.error('❌ Generated document has invalid ZIP signature:', outputSignature);
        console.error('📋 Expected:', expectedZipSignature);
        console.error('📋 Actual:', outputSignature);
        throw new Error('Generated document has invalid ZIP format');
      }
      console.log('✅ Output document ZIP signature valid');
      
      // 🧨 BONUS DIAGNOSTIC: Test if buffer can be unzipped
      try {
        const testZip = new PizZip(buffer);
        const testEntries = Object.keys(testZip.files);
        console.log(`✅ Generated document can be unzipped (${testEntries.length} entries)`);
        
        // Verify essential files are present
        const outputMissingFiles = requiredFiles.filter(file => !testEntries.includes(file));
        if (outputMissingFiles.length > 0) {
          console.error('❌ Generated document missing required files:', outputMissingFiles);
          throw new Error(`Output document missing files: ${outputMissingFiles.join(', ')}`);
        }
        console.log('✅ Generated document structure valid');
        
      } catch (unzipError: any) {
        console.error('❌ Generated document cannot be unzipped:', unzipError.message);
        throw new Error(`Generated document is corrupted: ${unzipError.message}`);
      }
      
      console.log(`✅ Document generation complete: ${buffer.length} bytes`);
      
      // Cleanup custom image module
      customImageModule.cleanup();
      console.log('🧹 Custom image module cleaned up');
      
      return buffer;
      
    } catch (error: any) {
      console.error('❌ Template filling failed:', error);
      console.error('🔍 Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Cleanup on error too
      if (customImageModule) {
        customImageModule.cleanup();
      }
      
      throw new Error(`Document generation failed: ${error.message}`);
    }
  }

  /**
   * Check if server-side generation is needed
   */
  shouldUseServerSide(images: ReportImage[], documentSize?: number): boolean {
    // Use server-side if document is large or has many images
    if (documentSize && documentSize > 40 * 1024 * 1024) return true;
    if (images.length > 20) return true;
    
    const totalImageSize = images.reduce((sum, img) => sum + (img.fileSize || 0), 0);
    if (totalImageSize > 30 * 1024 * 1024) return true;
    
    return false;
  }

  /**
   * List available templates
   */
  getAvailableTemplates(): string[] {
    try {
      const templatesDir = path.join(process.cwd(), 'server/templates');
      if (!fs.existsSync(templatesDir)) {
        return ['MJSolutionsTemplate'];
      }

      const files = fs.readdirSync(templatesDir);
      const templates = files
        .filter(file => file.endsWith('.docx'))
        .map(file => file.replace('.docx', ''));
      
      return templates.length > 0 ? templates : ['MJSolutionsTemplate'];
    } catch (error: any) {
      console.error('Error listing templates:', error);
      return ['MJSolutionsTemplate'];
    }
  }

  /**
   * Debug template validation method
   */
  async debugTemplateValidation(templateId: string): Promise<any> {
    try {
      console.log(`🔍 DEBUG: Validating template ${templateId}`);
      
      const templateBuffer = this.loadTemplate(templateId);
      
      // Extract placeholders from template
      const zip = new PizZip(templateBuffer);
      const documentXml = zip.file('word/document.xml');
      const content = documentXml?.asText() || '';
      const placeholders = content.match(/\{\{[^}]+\}\}/g) || [];
      
      // Create sample data
      const sampleData = await this.createDirectDataMapping({
        projectInformation: { fileNumber: 'TEST-001', insuredName: 'Test User' },
        assignmentScope: {},
        buildingObservations: {},
        research: {},
        discussionAnalysis: {},
        conclusions: {}
      }, [], false, false);
      
      return {
        templateSize: templateBuffer.length,
        placeholdersFound: placeholders,
        placeholderCount: placeholders.length,
        sampleDataGenerated: Object.keys(sampleData),
        sampleDataCount: Object.keys(sampleData).length
      };
      
    } catch (error: any) {
      throw new Error(`Template validation failed: ${error.message}`);
    }
  }
}

export const wordGenerationService = new WordGenerationService();