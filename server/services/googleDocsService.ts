import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { storage } from '../storage';
import { aiTextService } from './aiTextService';
import { ReportImage } from '../../shared/schema';
import fs from 'fs';
import path from 'path';

interface ReportData {
  projectInformation: any;
  assignmentScope: any;
  buildingObservations: any;
  research: any;
  discussionAnalysis: any;
  conclusions: any;
}

interface TemplateStyle {
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  alignment?: 'START' | 'CENTER' | 'END' | 'JUSTIFIED';
  spaceBefore?: number;
  spaceAfter?: number;
  fontFamily?: string;
}

interface TemplateElement {
  type: string;
  content?: string;
  title?: string;
  items?: string[];
  rows?: string[][];
  style?: TemplateStyle;
  pageBreak?: boolean;
}

interface TemplateSection {
  id: string;
  type: string;
  title?: string;
  content: TemplateElement[];
  pageBreak?: boolean;
}

interface ReportTemplate {
  documentSettings: {
    title: string;
    margins: { top: number; bottom: number; left: number; right: number };
    defaultFont: { family: string; size: number };
  };
  sections: TemplateSection[];
  placeholders: { [key: string]: { source: string; default: string } };
}

class GoogleDocsService {
  private credentials: any = null;
  private template: ReportTemplate | null = null;

  constructor() {
    this.loadCredentials();
    this.loadTemplate();
  }

  private async loadCredentials() {
    try {
      const credentialsPath = path.join(process.cwd(), 'server/config/credentials.json');
      
      if (!fs.existsSync(credentialsPath)) {
        console.error('Google credentials file not found');
        return;
      }

      this.credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    } catch (error) {
      console.error('Failed to load Google credentials:', error);
    }
  }

  private async loadTemplate() {
    try {
      const templatePath = path.join(process.cwd(), 'server/config/efi-report-template.json');
      
      if (!fs.existsSync(templatePath)) {
        console.error('EFI report template file not found');
        return;
      }

      this.template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
      console.log('✅ EFI report template loaded successfully');
    } catch (error) {
      console.error('Failed to load EFI report template:', error);
    }
  }

  private async createUserAuth(userId: string): Promise<{ auth: OAuth2Client; docs: any; drive: any } | null> {
    if (!this.credentials) {
      throw new Error('Google credentials not loaded');
    }

    // Get user with tokens
    const user = await storage.getUserWithTokens(userId);
    if (!user || !user.googleAccessToken) {
      throw new Error('User not found or missing Google access token');
    }

    const auth = new google.auth.OAuth2(
      this.credentials.web.client_id,
      this.credentials.web.client_secret,
      this.credentials.web.redirect_uris[0]
    );

    // Set user's tokens
    auth.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    const docs = google.docs({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    return { auth, docs, drive };
  }

  /**
   * Creates a professional engineering report using the JSON template
   */
  public async createProfessionalReport(userId: string, reportData: ReportData, reportTitle: string, reportId: string, aiEnhanceText: boolean = false, onProgress?: (progress: number, message: string) => void): Promise<string | null> {
    console.log('=== STARTING DOCUMENT GENERATION ===');
    console.log('DEBUG: createProfessionalReport called with:');
    console.log('  - userId:', userId);
    console.log('  - reportTitle:', reportTitle);
    console.log('  - reportId:', reportId);
    console.log('  - aiEnhanceText:', aiEnhanceText);
    
    if (!this.template) {
      throw new Error('EFI report template not loaded');
    }

    const userAuth = await this.createUserAuth(userId);
    if (!userAuth) {
      throw new Error('Failed to create user authentication');
    }

    const { docs } = userAuth;

    try {
      console.log('DEBUG: Creating document with template:', this.template.documentSettings.title);

      onProgress?.(55, 'Authenticating with Google Docs...');

      // Create a new document
      const createResponse = await docs.documents.create({
        requestBody: {
          title: reportTitle
        }
      });

      const documentId = createResponse.data.documentId;
      
      if (!documentId) {
        throw new Error('Failed to create document');
      }

      onProgress?.(65, 'Document created, processing content...');

      // Process template data and build document
      const processedData = await this.processTemplateData(reportData, reportId, aiEnhanceText, onProgress);
      
      onProgress?.(85, 'Building document structure...');
      const requests = await this.buildDocumentFromTemplate(processedData);

      onProgress?.(90, 'Applying formatting and finalizing...');
      // Execute all formatting requests in batches
      await this.executeBatchRequests(docs, documentId, requests);

      console.log(`✅ Professional engineering report created: ${documentId}`);
      return documentId;

    } catch (error) {
      console.error('Error creating professional report:', error);
      throw error;
    }
  }

  /**
   * Process template data and replace placeholders
   */
  private async processTemplateData(reportData: ReportData, reportId: string, aiEnhanceText: boolean, onProgress?: (progress: number, message: string) => void): Promise<{ [key: string]: string }> {
    if (!this.template) {
      throw new Error('Template not loaded');
    }

    const processedData: { [key: string]: string } = {};

    // Process photos once and cache the results
    console.log('=== STARTING PHOTO PROCESSING ===');
    console.log('DEBUG: About to call processPhotoReferences with reportId:', reportId);
    const photoReferences = await this.processPhotoReferences(reportId, reportData);
    console.log('DEBUG: Photo processing completed. Found references for:', Object.keys(photoReferences));
    console.log('DEBUG: Photo references content:', JSON.stringify(photoReferences, null, 2));
    console.log('=== PHOTO PROCESSING COMPLETE ===');

    // Helper function to process text and generate paragraphs from bullet points if needed
    const processText = async (text: string | undefined, fieldType: string): Promise<string> => {
      if (!text || text.trim().length === 0) {
        return '';
      }

      // Check if text contains bullet points (starts with •, -, *, or numbers)
      const bulletPointPattern = /^[\s]*[•\-\*]|\d+\./gm;
      const hasBulletPoints = bulletPointPattern.test(text);
      console.log(`DEBUG AI: Text for ${fieldType} has bullet points: ${hasBulletPoints}`);

      if (hasBulletPoints && aiEnhanceText && aiTextService.isConfigured()) {
        try {
          console.log(`DEBUG AI: Generating paragraph for ${fieldType} from bullet points`);
          console.log(`DEBUG AI: Original text:`, text.substring(0, 200));
          const generatedText = await aiTextService.generateParagraph({
            bulletPoints: text,
            fieldType,
            context: 'Civil engineering property inspection report'
          });
          console.log(`DEBUG AI: Generated text for ${fieldType}:`, generatedText.substring(0, 200));
          return generatedText;
        } catch (error) {
          console.warn(`Failed to generate paragraph for ${fieldType}, using original text:`, error);
          return text;
        }
      }

      return text;
    };

    console.log(`DEBUG AI: Processing template with aiEnhanceText=${aiEnhanceText}, isConfigured=${aiTextService.isConfigured()}`);
    
    const placeholderEntries = Object.entries(this.template.placeholders);
    const totalPlaceholders = placeholderEntries.length;
    let processedCount = 0;
    
    // Process each placeholder
    for (const [placeholderKey, placeholderConfig] of placeholderEntries) {
      let value = placeholderConfig.default;

      if (placeholderConfig.source === 'dynamic') {
        // Handle dynamic values
        if (placeholderKey === 'current_date' || placeholderConfig.default === '{{generated_date}}') {
          value = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } else if (placeholderKey === 'site_photographs_appendix') {
          console.log('=== PROCESSING SITE_PHOTOGRAPHS_APPENDIX PLACEHOLDER ===');
          console.log('DEBUG: photoReferences keys available:', Object.keys(photoReferences));
          console.log('DEBUG: photoReferences.site_photographs_appendix:', photoReferences.site_photographs_appendix);
          console.log('DEBUG: placeholderConfig.default:', placeholderConfig.default);
          
          // Use cached photo references for appendix
          value = photoReferences.site_photographs_appendix || placeholderConfig.default;
          console.log('DEBUG: Final value for site_photographs_appendix:', value);
          
          // TEMPORARY TEST: Override with test content to verify pipeline works
          if (photoReferences.site_photographs_appendix) {
            value = 'PHOTO PROCESSING WORKING!\n\n' + photoReferences.site_photographs_appendix;
            console.log('DEBUG: Overriding with test content - WORKING case');
          } else {
            value = 'PHOTO PROCESSING NOT WORKING - No photos found or processed';
            console.log('DEBUG: Overriding with test content - NOT WORKING case');
          }
          console.log('=== SITE_PHOTOGRAPHS_APPENDIX PROCESSING COMPLETE ===');
        }
      } else {
        // Extract value from report data using dot notation
        const sourcePath = placeholderConfig.source.split('.');
        let sourceValue = reportData as any;
        
        for (const pathSegment of sourcePath) {
          sourceValue = sourceValue?.[pathSegment];
        }

        if (sourceValue && typeof sourceValue === 'string' && sourceValue.trim()) {
          // Check if this field will be AI processed
          const bulletPointPattern = /^[\s]*[•\-\*]|\d+\./gm;
          const hasBulletPoints = bulletPointPattern.test(sourceValue);
          
          if (hasBulletPoints && aiEnhanceText && aiTextService.isConfigured()) {
            onProgress?.(68 + (processedCount / totalPlaceholders) * 15, `AI enhancing ${placeholderKey.replace(/_/g, ' ')}...`);
          }
          
          // Process text through AI if needed
          let processedText = await processText(sourceValue, placeholderKey);
          
          // Add photo references for observation fields
          if (placeholderKey === 'building_system_description' || 
              placeholderKey === 'exterior_observations' || 
              placeholderKey === 'interior_observations') {
            if (photoReferences[placeholderKey]) {
              // Use the version with photo references
              processedText = photoReferences[placeholderKey];
            }
          }
          
          value = processedText;
        }
      }

      processedData[placeholderKey] = value || placeholderConfig.default;
      processedCount++;
      
      // Update progress
      if (processedCount % 5 === 0 || processedCount === totalPlaceholders) {
        const progressPercent = 68 + (processedCount / totalPlaceholders) * 15;
        onProgress?.(progressPercent, `Processing content... (${processedCount}/${totalPlaceholders})`);
      }
    }

    return processedData;
  }

  /**
   * Process photos and generate photo references for sections
   */
  private async processPhotoReferences(reportId: string, reportData: ReportData): Promise<{ [key: string]: string }> {
    try {
      console.log('DEBUG: processPhotoReferences called with reportId:', reportId, 'type:', typeof reportId);
      
      // Get all photos for this report, sorted by upload order
      const allPhotos = await ReportImage.find({ reportId }).sort({ uploadOrder: 1 });
      console.log('DEBUG: Found', allPhotos.length, 'photos for report', reportId);
      
      if (allPhotos.length > 0) {
        console.log('DEBUG: First photo:', {
          id: allPhotos[0]._id,
          originalFilename: allPhotos[0].originalFilename,
          category: allPhotos[0].category,
          uploadOrder: allPhotos[0].uploadOrder
        });
      }
      
      if (allPhotos.length === 0) {
        console.log('DEBUG: No photos found, returning empty object');
        return {};
      }

      // Create photo number mapping
      const photoReferences: { [key: string]: string } = {};
      let photoNumber = 1;
      
      // Group photos by category for section-specific references
      const photosByCategory = {
        building: [] as Array<any>,
        exterior: [] as Array<any>,
        interior: [] as Array<any>,
        documents: [] as Array<any>,
        other: [] as Array<any>
      };

      // Assign sequential numbers and group by category
      const photosWithNumbers = allPhotos.map(photo => ({
        ...photo.toObject(),
        photoNumber: photoNumber++
      }));

      photosWithNumbers.forEach(photo => {
        const category = photo.category || 'other';
        if (photosByCategory[category as keyof typeof photosByCategory]) {
          photosByCategory[category as keyof typeof photosByCategory].push(photo);
        } else {
          photosByCategory.other.push(photo);
        }
      });

      // Generate photo references for each category
      const generatePhotoRef = (photos: Array<any>): string => {
        if (photos.length === 0) return '';
        
        if (photos.length === 1) {
          return ` (Photo ${photos[0].photoNumber})`;
        } else {
          const numbers = photos.map(p => p.photoNumber).sort((a, b) => a - b);
          return ` (Photos ${numbers[0]}-${numbers[numbers.length - 1]})`;
        }
      };

      // Add photo references to existing observation text
      if (photosByCategory.building.length > 0) {
        const buildingText = reportData.buildingObservations?.buildingSystemDescription || '';
        photoReferences.building_system_description = buildingText + generatePhotoRef(photosByCategory.building);
      }

      if (photosByCategory.exterior.length > 0) {
        const exteriorText = reportData.buildingObservations?.exteriorObservations || '';
        photoReferences.exterior_observations = exteriorText + generatePhotoRef(photosByCategory.exterior);
      }

      if (photosByCategory.interior.length > 0) {
        const interiorText = reportData.buildingObservations?.interiorObservations || '';
        photoReferences.interior_observations = interiorText + generatePhotoRef(photosByCategory.interior);
      }

      // Generate appendix content with numbered photos
      const appendixPhotos = photosWithNumbers.map(photo => 
        `Photo ${photo.photoNumber}: ${photo.description || photo.originalFilename}`
      ).join('\n');

      photoReferences.site_photographs_appendix = appendixPhotos;
      console.log('DEBUG: Generated appendix content:', appendixPhotos);
      console.log('DEBUG: appendixPhotos length:', appendixPhotos.length);
      console.log('DEBUG: Returning photo references with keys:', Object.keys(photoReferences));
      console.log('DEBUG: Full photoReferences object:', JSON.stringify(photoReferences, null, 2));

      return photoReferences;
    } catch (error) {
      console.error('Error processing photo references:', error);
      return {};
    }
  }

  /**
   * Build document requests from template
   */
  private async buildDocumentFromTemplate(processedData: { [key: string]: string }): Promise<any[]> {
    if (!this.template) {
      throw new Error('Template not loaded');
    }

    const requests: any[] = [];
    let currentIndex = 1;

    // Helper function to insert text with formatting
    const insertText = (text: string, style?: TemplateStyle) => {
      // Replace placeholders in text
      let processedText = text;
      for (const [key, value] of Object.entries(processedData)) {
        processedText = processedText.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }

      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: processedText
        }
      });

      // Apply formatting if specified
      if (style && processedText.length > 0) {
        const endIndex = currentIndex + processedText.length;

        // Text style
        if (style.bold || style.italic || style.underline || style.fontSize || style.fontFamily) {
          requests.push({
            updateTextStyle: {
              range: { startIndex: currentIndex, endIndex: endIndex },
              textStyle: {
                bold: style.bold,
                italic: style.italic,
                underline: style.underline,
                fontSize: style.fontSize ? { magnitude: style.fontSize, unit: 'PT' } : undefined,
                weightedFontFamily: style.fontFamily ? { fontFamily: style.fontFamily } : undefined
              },
              fields: 'bold,italic,underline,fontSize,weightedFontFamily'
            }
          });
        }

        // Paragraph style
        if (style.alignment || style.spaceBefore || style.spaceAfter) {
          requests.push({
            updateParagraphStyle: {
              range: { startIndex: currentIndex, endIndex: endIndex },
              paragraphStyle: {
                alignment: style.alignment,
                spaceAbove: style.spaceBefore ? { magnitude: style.spaceBefore, unit: 'PT' } : undefined,
                spaceBelow: style.spaceAfter ? { magnitude: style.spaceAfter, unit: 'PT' } : undefined
              },
              fields: 'alignment,spaceAbove,spaceBelow'
            }
          });
        }
      }

      currentIndex += processedText.length;
    };

    // Helper function to insert page break
    const insertPageBreak = () => {
      requests.push({
        insertPageBreak: {
          location: { index: currentIndex }
        }
      });
      currentIndex += 1;
    };

    // Helper function to create table
    const insertTable = (rows: string[][], style?: TemplateStyle) => {
      requests.push({
        insertTable: {
          location: { index: currentIndex },
          rows: rows.length,
          columns: rows[0]?.length || 2
        }
      });

      // Insert table content
      let tableIndex = currentIndex + 3; // Tables start after initial structure
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        for (let colIndex = 0; colIndex < rows[rowIndex].length; colIndex++) {
          let cellText = rows[rowIndex][colIndex];
          
          // Replace placeholders in cell text
          for (const [key, value] of Object.entries(processedData)) {
            cellText = cellText.replace(new RegExp(`{{${key}}}`, 'g'), value);
          }

          requests.push({
            insertText: {
              location: { index: tableIndex },
              text: cellText
            }
          });

          tableIndex += cellText.length + 2; // Account for cell separators
        }
      }

      currentIndex = tableIndex;

      if (style?.spaceAfter) {
        insertText('\n'.repeat(Math.ceil(style.spaceAfter / 12)));
      }
    };

    // Process each section
    for (const section of this.template.sections) {
      // Add page break if specified
      if (section.pageBreak) {
        insertPageBreak();
      }

      // Add section title
      if (section.title) {
        insertText(section.title + '\n', {
          fontSize: 14,
          bold: true,
          alignment: 'START',
          spaceAfter: 12
        });
      }

      // Process section content
      for (const element of section.content) {
        switch (element.type) {
          case 'text':
            if (element.content) {
              insertText(element.content + '\n', element.style);
            }
            break;

          case 'list':
            if (element.items) {
              for (const item of element.items) {
                insertText('• ' + item + '\n', element.style);
              }
            }
            break;

          case 'table':
          case 'signature_table':
            if (element.rows) {
              insertTable(element.rows, element.style);
            }
            break;

          case 'subsection':
            if (element.title) {
              insertText(element.title + '\n', {
                fontSize: 12,
                bold: true,
                spaceAfter: 6
              });
            }
            if (element.content) {
              // Process subsection content recursively
              for (const subElement of element.content as TemplateElement[]) {
                if (subElement.type === 'text' && subElement.content) {
                  insertText(subElement.content + '\n', subElement.style);
                }
              }
            }
            break;
        }
      }
    }

    return requests;
  }

  /**
   * Execute batch requests efficiently
   */
  private async executeBatchRequests(docs: any, documentId: string, requests: any[]): Promise<void> {
    const batchSize = 100; // Google Docs API batch limit
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      
      try {
        await docs.documents.batchUpdate({
          documentId: documentId,
          requestBody: {
            requests: batch
          }
        });
      } catch (error) {
        console.error(`Error executing batch ${i / batchSize + 1}:`, error);
        throw error;
      }
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  public async generateFromTemplate(userId: string, reportData: ReportData, reportTitle: string, reportId: string, aiEnhanceText: boolean = false): Promise<string | null> {
    return this.createProfessionalReport(userId, reportData, reportTitle, reportId, aiEnhanceText);
  }

  public async isUserAuthenticated(userId: string): Promise<boolean> {
    try {
      const user = await storage.getUserWithTokens(userId);
      return !!(user && user.googleAccessToken);
    } catch (error) {
      return false;
    }
  }

  public getAuthUrl(): string {
    if (!this.credentials) {
      throw new Error('Google credentials not loaded');
    }

    const auth = new google.auth.OAuth2(
      this.credentials.web.client_id,
      this.credentials.web.client_secret,
      this.credentials.web.redirect_uris[0]
    );

    return auth.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive.file'
      ]
    });
  }

  public async setAuthTokens(code: string): Promise<void> {
    throw new Error('OAuth callback flow not properly implemented. Use passport-based authentication instead.');
  }

  public async isAuthenticated(): Promise<boolean> {
    throw new Error('Global authentication check not supported. Use isUserAuthenticated(userId) instead.');
  }
}

export const googleDocsService = new GoogleDocsService();