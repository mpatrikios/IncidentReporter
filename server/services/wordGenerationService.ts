import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
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
    const zipSignature = templateBuffer.slice(0, 4);
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

    // VALIDATION - Ensure all required fields have valid, non-empty values
    const requiredFields = [
      'insured_name', 'claim_number', 'file_number', 'date_of_creation', 'insured_address',
      'date_of_loss', 'client_company', 'engineer_name', 'technical_reviewer', 'received_date',
      'site_visit_date', 'interviewees_names', 'provided_documents_titles', 'structure_built_date',
      'structure_age', 'building_system_description', 'front_facing_direction', 'exterior_observations',
      'interior_observations', 'other_site_observations', 'weather_data_summary', 'corelogic_hail_summary',
      'corelogic_wind_summary', 'site_discussion_analysis', 'weather_discussion_analysis',
      'weather_impact_analysis', 'recommendations_and_discussion', 'conclusions'
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
      'conclusions': 'Conclusions to be provided.'
    };

    const missingFields = requiredFields.filter(field => !templateData[field] || templateData[field].trim() === '');
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
    const templateSignature = templateBuffer.slice(0, 4);
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
      
      // Create docxtemplater instance with enhanced error handling and custom delimiters
      console.log('⚙️ Creating docxtemplater instance with custom delimiters...');
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        errorLogging: true,
        // 🎯 FIX: Custom delimiters to prevent duplicate tag errors
        delimiters: { start: '{{', end: '}}' },
        nullGetter: function(part: any) {
          console.warn(`⚠️ Missing placeholder: ${part.value}`);
          return `[MISSING: ${part.value}]`;
        },
        // Enhanced error handling
        parser: function(tag: string) {
          return {
            get: function(scope: any) {
              if (tag === '.') {
                return scope;
              }
              return scope[tag];
            }
          };
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
      
      // Check for undefined/null values
      const problematicKeys = Object.keys(templateData).filter(key => 
        templateData[key] === undefined || templateData[key] === null
      );
      if (problematicKeys.length > 0) {
        console.warn('⚠️ Found null/undefined values:', problematicKeys);
      }
      
      // Set data and render with enhanced error catching
      console.log('📊 Setting template data...');
      doc.setData(templateData);
      
      // 🧨 DIAGNOSTIC 4: Enhanced render with try/catch and detailed template error logging
      console.log('🖼️ Rendering template with error catching...');
      try {
        doc.render();
        console.log('✅ Template rendered successfully');
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
      const outputSignature = buffer.slice(0, 4);
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
      return buffer;
      
    } catch (error: any) {
      console.error('❌ Template filling failed:', error);
      console.error('🔍 Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
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