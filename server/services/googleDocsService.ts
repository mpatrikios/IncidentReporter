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

class GoogleDocsService {
  private credentials: any = null;

  constructor() {
    this.loadCredentials();
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

  public async generateFromTemplate(userId: string, reportData: ReportData, reportTitle: string, aiEnhanceText: boolean = false): Promise<string | null> {
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

    return this.fillTemplate(userId, templateId, reportData, reportTitle, aiEnhanceText);
  }

  private async fillTemplate(userId: string, templateId: string, reportData: ReportData, reportTitle: string, aiEnhanceText: boolean = false): Promise<string | null> {
    const userAuth = await this.createUserAuth(userId);
    if (!userAuth) {
      throw new Error('Failed to create user authentication');
    }

    const { auth, docs, drive } = userAuth;

    try {
      // Debug: Log the user info and template ID
      console.log('DEBUG: Attempting to copy template:', templateId);
      console.log('DEBUG: User ID:', userId);
      
      // Try to get user info first
      const userInfo = await auth.getTokenInfo(auth.credentials.access_token);
      console.log('DEBUG: Authenticated user email:', userInfo.email);
      
      // Copy the template to create a new document in user's Drive
      const copyResponse = await drive.files.copy({
        fileId: templateId,
        requestBody: {
          name: reportTitle,
          // The document will be created in the user's Drive root by default
        }
      });

      const newDocumentId = copyResponse.data.id;
      
      if (!newDocumentId) {
        throw new Error('Failed to copy template');
      }

      // Prepare replacement requests for template placeholders
      const replacements = await this.prepareReplacements(reportData, aiEnhanceText);
      
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
        await docs.documents.batchUpdate({
          documentId: newDocumentId,
          requestBody: {
            requests: requests
          }
        });
      }

      console.log(`✅ Document created in user's Google Drive: ${reportTitle} (ID: ${newDocumentId})`);
      return newDocumentId;

    } catch (error) {
      console.error('Error filling template:', error);
      throw error;
    }
  }

  private async prepareReplacements(reportData: ReportData, aiEnhanceText: boolean = false): Promise<Array<{placeholder: string, value: string}>> {
    const replacements = [];

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

    // Project Information replacements
    if (reportData.projectInformation) {
      const pi = reportData.projectInformation;
      replacements.push(
        { placeholder: '{{file_number}}', value: pi.fileNumber || '' },
        { placeholder: '{{date_of_creation}}', value: pi.dateOfCreation || '' },
        { placeholder: '{{insured_name}}', value: pi.insuredName || '' },
        { placeholder: '{{insured_address}}', value: pi.insuredAddress || '' },
        { placeholder: '{{date_of_loss}}', value: pi.dateOfLoss || '' },
        { placeholder: '{{claim_number}}', value: pi.claimNumber || '' },
        { placeholder: '{{client_company}}', value: pi.clientCompany || '' },
        { placeholder: '{{client_contact}}', value: pi.clientContact || '' },
        { placeholder: '{{engineer_name}}', value: pi.engineerName || '' },
        { placeholder: '{{technical_reviewer}}', value: pi.technicalReviewer || '' },
        { placeholder: '{{received_date}}', value: pi.receivedDate || '' },
        { placeholder: '{{site_visit_date}}', value: pi.siteVisitDate || '' }
      );
    }

    // Assignment Scope (Methodology) replacements
    if (reportData.assignmentScope) {
      const as = reportData.assignmentScope;
      replacements.push(
        { placeholder: '{{interviewees_names}}', value: await processText(as.intervieweesNames, 'intervieweesNames') },
        { placeholder: '{{provided_documents_titles}}', value: await processText(as.providedDocumentsTitles, 'providedDocumentsTitles') }
      );
    }

    // Building & Site Observations replacements
    if (reportData.buildingObservations) {
      const bs = reportData.buildingObservations;
      replacements.push(
        { placeholder: '{{structure_built_date}}', value: bs.structureBuiltDate || '' },
        { placeholder: '{{structure_age}}', value: bs.structureAge || '' },
        { placeholder: '{{building_system_description}}', value: await processText(bs.buildingSystemDescription, 'buildingSystemDescription') },
        { placeholder: '{{front_facing_direction}}', value: bs.frontFacingDirection || '' },
        { placeholder: '{{exterior_observations}}', value: await processText(bs.exteriorObservations, 'exteriorObservations') },
        { placeholder: '{{interior_observations}}', value: await processText(bs.interiorObservations, 'interiorObservations') },
        { placeholder: '{{other_site_observations}}', value: await processText(bs.otherSiteObservations, 'otherSiteObservations') }
      );
    }

    // Research replacements
    if (reportData.research) {
      const r = reportData.research;
      replacements.push(
        { placeholder: '{{weather_data_summary}}', value: await processText(r.weatherDataSummary, 'weatherDataSummary') },
        { placeholder: '{{corelogic_hail_summary}}', value: await processText(r.corelogicHailSummary, 'corelogicHailSummary') },
        { placeholder: '{{corelogic_wind_summary}}', value: await processText(r.corelogicWindSummary, 'corelogicWindSummary') }
      );
    }

    // Discussion & Analysis replacements
    if (reportData.discussionAnalysis) {
      const da = reportData.discussionAnalysis;
      replacements.push(
        { placeholder: '{{site_discussion_analysis}}', value: await processText(da.siteDiscussionAnalysis, 'siteDiscussionAnalysis') },
        { placeholder: '{{weather_discussion_analysis}}', value: await processText(da.weatherDiscussionAnalysis, 'weatherDiscussionAnalysis') },
        { placeholder: '{{weather_impact_analysis}}', value: await processText(da.weatherImpactAnalysis, 'weatherImpactAnalysis') },
        { placeholder: '{{recommendations_and_discussion}}', value: await processText(da.recommendationsAndDiscussion, 'recommendationsAndDiscussion') }
      );
    }

    // Conclusions replacements
    if (reportData.conclusions) {
      replacements.push(
        { placeholder: '{{conclusions}}', value: await processText(reportData.conclusions.conclusions, 'conclusions') }
      );
    }

    return replacements;
  }

  public async isUserAuthenticated(userId: string): Promise<boolean> {
    try {
      const user = await storage.getUserWithTokens(userId);
      return !!(user && user.googleAccessToken);
    } catch (error) {
      return false;
    }
  }
}

export const googleDocsService = new GoogleDocsService();