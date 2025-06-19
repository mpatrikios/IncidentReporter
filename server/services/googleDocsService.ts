import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { storage } from '../storage';
import { aiTextService } from './aiTextService';
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
  alignment?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
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
  public async createProfessionalReport(userId: string, reportData: ReportData, reportTitle: string, aiEnhanceText: boolean = false): Promise<string | null> {
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

      // Process template data and build document
      const processedData = await this.processTemplateData(reportData, aiEnhanceText);
      const requests = await this.buildDocumentFromTemplate(processedData);

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
  private async processTemplateData(reportData: ReportData, aiEnhanceText: boolean): Promise<{ [key: string]: string }> {
    if (!this.template) {
      throw new Error('Template not loaded');
    }

    const processedData: { [key: string]: string } = {};

    // Helper function to process text and generate paragraphs from bullet points if needed
    const processText = async (text: string | undefined, fieldType: string): Promise<string> => {
      if (!text || text.trim().length === 0) {
        return '';
      }

      // Check if text contains bullet points (starts with •, -, *, or numbers)
      const bulletPointPattern = /^[\s]*[•\-\*]|\d+\./gm;
      const hasBulletPoints = bulletPointPattern.test(text);

      if (hasBulletPoints && aiEnhanceText && aiTextService.isConfigured()) {
        try {
          console.log(`Generating paragraph for ${fieldType} from bullet points`);
          const generatedText = await aiTextService.generateParagraph({
            bulletPoints: text,
            fieldType,
            context: 'Civil engineering property inspection report'
          });
          return generatedText;
        } catch (error) {
          console.warn(`Failed to generate paragraph for ${fieldType}, using original text:`, error);
          return text;
        }
      }

      return text;
    };

    // Process each placeholder
    for (const [placeholderKey, placeholderConfig] of Object.entries(this.template.placeholders)) {
      let value = placeholderConfig.default;

      if (placeholderConfig.source === 'dynamic') {
        // Handle dynamic values
        if (placeholderKey === 'current_date' || placeholderConfig.default === '{{generated_date}}') {
          value = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
      } else {
        // Extract value from report data using dot notation
        const sourcePath = placeholderConfig.source.split('.');
        let sourceValue = reportData as any;
        
        for (const pathSegment of sourcePath) {
          sourceValue = sourceValue?.[pathSegment];
        }

        if (sourceValue && typeof sourceValue === 'string' && sourceValue.trim()) {
          // Process text through AI if needed
          value = await processText(sourceValue, placeholderKey);
        }
      }

      processedData[placeholderKey] = value || placeholderConfig.default;
    }

    return processedData;
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
          alignment: 'LEFT',
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
  public async generateFromTemplate(userId: string, reportData: ReportData, reportTitle: string, aiEnhanceText: boolean = false): Promise<string | null> {
    return this.createProfessionalReport(userId, reportData, reportTitle, aiEnhanceText);
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