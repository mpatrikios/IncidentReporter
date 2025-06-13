import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
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

class GoogleDocsService {
  private auth: OAuth2Client | null = null;
  private docs: any = null;
  private drive: any = null;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const credentialsPath = path.join(process.cwd(), 'server/config/credentials.json');
      
      if (!fs.existsSync(credentialsPath)) {
        console.error('Google credentials file not found');
        return;
      }

      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      
      this.auth = new google.auth.OAuth2(
        credentials.web.client_id,
        credentials.web.client_secret,
        credentials.web.redirect_uris[0]
      );

      // You'll need to set the access token here
      // For now, this is a placeholder - you'll need to implement OAuth flow
      // this.auth.setCredentials({
      //   access_token: 'your_access_token',
      //   refresh_token: 'your_refresh_token'
      // });

      this.docs = google.docs({ version: 'v1', auth: this.auth });
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      
    } catch (error) {
      console.error('Failed to initialize Google Auth:', error);
    }
  }

  public async generateFromTemplate(reportData: ReportData, reportTitle: string): Promise<string | null> {
    // Read template ID from config
    const templateConfigPath = path.join(process.cwd(), 'server/config/template.json');
    
    if (!fs.existsSync(templateConfigPath)) {
      throw new Error('Template configuration file not found');
    }

    const templateConfig = JSON.parse(fs.readFileSync(templateConfigPath, 'utf8'));
    const templateId = templateConfig.templateId;
    
    if (!templateId || templateId === 'YOUR_GOOGLE_DOCS_TEMPLATE_ID') {
      throw new Error('Template ID not configured. Please set templateId in server/config/template.json');
    }

    return this.fillTemplate(templateId, reportData, reportTitle);
  }

  private async fillTemplate(templateId: string, reportData: ReportData, reportTitle: string): Promise<string | null> {
    if (!this.auth || !this.docs || !this.drive) {
      throw new Error('Google API not properly initialized. Please check credentials and authentication.');
    }

    try {
      // Copy the template to create a new document
      const copyResponse = await this.drive.files.copy({
        fileId: templateId,
        requestBody: {
          name: reportTitle
        }
      });

      const newDocumentId = copyResponse.data.id;
      
      if (!newDocumentId) {
        throw new Error('Failed to copy template');
      }

      // Prepare replacement requests for template placeholders
      const replacements = this.prepareReplacements(reportData);
      
      // Create batch update requests to replace placeholders
      const requests = replacements.map(replacement => ({
        replaceAllText: {
          containsText: {
            text: replacement.placeholder,
            matchCase: false
          },
          replaceText: replacement.value || ''
        }
      }));

      // Execute the batch update
      if (requests.length > 0) {
        await this.docs.documents.batchUpdate({
          documentId: newDocumentId,
          requestBody: {
            requests: requests
          }
        });
      }

      return newDocumentId;

    } catch (error) {
      console.error('Error filling template:', error);
      throw error;
    }
  }

  private prepareReplacements(reportData: ReportData): Array<{placeholder: string, value: string}> {
    const replacements = [];

    // Project Information replacements
    if (reportData.projectInformation) {
      const pi = reportData.projectInformation;
      replacements.push(
        { placeholder: '{{insured_name}}', value: pi.insuredName || '' },
        { placeholder: '{{insured_address}}', value: pi.insuredAddress || '' },
        { placeholder: '{{file_number}}', value: pi.fileNumber || '' },
        { placeholder: '{{claim_number}}', value: pi.claimNumber || '' },
        { placeholder: '{{client_company}}', value: pi.clientCompany || '' },
        { placeholder: '{{client_contact_name}}', value: pi.clientContactName || '' },
        { placeholder: '{{client_email}}', value: pi.clientEmail || '' },
        { placeholder: '{{date_of_loss}}', value: pi.dateOfLoss || '' },
        { placeholder: '{{site_visit_date}}', value: pi.siteVisitDate || '' },
        { placeholder: '{{engineer_name}}', value: pi.engineerName || '' },
        { placeholder: '{{technical_reviewer_name}}', value: pi.technicalReviewerName || '' }
      );
    }

    // Assignment Scope replacements
    if (reportData.assignmentScope) {
      const as = reportData.assignmentScope;
      replacements.push(
        { placeholder: '{{assignment_scope}}', value: as.assignmentScope || '' },
        { placeholder: '{{site_contact}}', value: as.siteContact || '' },
        { placeholder: '{{interviewees}}', value: as.interviewees || '' },
        { placeholder: '{{documents_reviewed}}', value: as.documentsReviewed || '' },
        { placeholder: '{{weather_research_summary}}', value: as.weatherResearchSummary || '' }
      );
    }

    // Building & Site Observations replacements
    if (reportData.buildingObservations) {
      const bo = reportData.buildingObservations;
      replacements.push(
        { placeholder: '{{structure_age}}', value: bo.structureAge || '' },
        { placeholder: '{{square_footage}}', value: bo.squareFootage || '' },
        { placeholder: '{{roof_type}}', value: bo.roofType || '' },
        { placeholder: '{{ventilation_description}}', value: bo.ventilationDescription || '' },
        { placeholder: '{{building_description}}', value: bo.buildingDescription || '' },
        { placeholder: '{{exterior_observations}}', value: bo.exteriorObservations || '' },
        { placeholder: '{{interior_observations}}', value: bo.interiorObservations || '' },
        { placeholder: '{{crawlspace_observations}}', value: bo.crawlspaceObservations || '' },
        { placeholder: '{{site_observations}}', value: bo.siteObservations || '' }
      );
    }

    // Research replacements
    if (reportData.research) {
      const r = reportData.research;
      replacements.push(
        { placeholder: '{{weather_data_summary}}', value: r.weatherDataSummary || '' },
        { placeholder: '{{corelogic_data_summary}}', value: r.corelogicDataSummary || '' }
      );
    }

    // Discussion & Analysis replacements
    if (reportData.discussionAnalysis) {
      replacements.push(
        { placeholder: '{{discussion_and_analysis}}', value: reportData.discussionAnalysis.discussionAndAnalysis || '' }
      );
    }

    // Conclusions replacements
    if (reportData.conclusions) {
      replacements.push(
        { placeholder: '{{conclusions}}', value: reportData.conclusions.conclusions || '' }
      );
    }

    return replacements;
  }

  public async isAuthenticated(): Promise<boolean> {
    if (!this.auth || !this.docs) {
      return false;
    }
    
    // Check if we have valid credentials
    const credentials = this.auth.credentials;
    return !!(credentials && (credentials.access_token || credentials.refresh_token));
  }

  public getAuthUrl(): string {
    if (!this.auth) {
      throw new Error('Auth not initialized');
    }

    const scopes = [
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/drive'
    ];

    return this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });
  }

  public async setAuthTokens(code: string): Promise<void> {
    if (!this.auth) {
      throw new Error('Auth not initialized');
    }

    const { tokens } = await this.auth.getToken(code);
    this.auth.setCredentials(tokens);
  }
}

export const googleDocsService = new GoogleDocsService();