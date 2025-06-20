import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { storage } from '../storage';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

/**
 * Google Drive Service for Document Generation
 * 
 * This service handles Google Docs creation and management for generated reports.
 * Image storage is handled separately by S3Service - this service only manages
 * document generation, folder creation, and document storage in Google Drive.
 */

interface FolderStructure {
  reportFolderId: string;
  imagesFolderId: string;
}

class GoogleDriveService {
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

  private async createUserAuth(userId: string): Promise<{ auth: OAuth2Client; drive: any } | null> {
    if (!this.credentials) {
      throw new Error('Google credentials not loaded');
    }

    const user = await storage.getUserWithTokens(userId);
    
    if (!user || !user.googleAccessToken) {
      throw new Error('User not found or missing Google access token');
    }

    const auth = new google.auth.OAuth2(
      this.credentials.web.client_id,
      this.credentials.web.client_secret,
      this.credentials.web.redirect_uris[0]
    );

    auth.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    const drive = google.drive({ version: 'v3', auth });

    return { auth, drive };
  }

  // Find or create a folder in Google Drive
  private async findOrCreateFolder(userId: string, folderName: string, parentId?: string): Promise<string> {
    const userAuth = await this.createUserAuth(userId);
    if (!userAuth) throw new Error('Failed to create user authentication');

    const { drive } = userAuth;

    // Search for existing folder
    const query = parentId 
      ? `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
      : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    // Create new folder
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId && { parents: [parentId] })
    };

    const folder = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id'
    });

    return folder.data.id!;
  }

  // Create organized folder structure for a report
  public async createReportFolders(userId: string, reportId: string, reportTitle: string): Promise<FolderStructure> {
    // Create main reports folder if it doesn't exist
    const reportsFolderId = await this.findOrCreateFolder(userId, 'Engineering Reports');
    
    // Create specific report folder
    const reportFolderName = `${reportTitle} (${reportId})`;
    const reportFolderId = await this.findOrCreateFolder(userId, reportFolderName, reportsFolderId);
    
    // Create images subfolder
    const imagesFolderId = await this.findOrCreateFolder(userId, 'Images', reportFolderId);

    return {
      reportFolderId,
      imagesFolderId
    };
  }

  // Upload image to Google Drive
  // Image storage methods removed - using S3 for image storage
  // Google Drive is now only used for document generation and storage

  // Get report folder URL
  public async getReportFolderUrl(userId: string, reportId: string, reportTitle: string): Promise<string> {
    const folders = await this.createReportFolders(userId, reportId, reportTitle);
    return `https://drive.google.com/drive/folders/${folders.reportFolderId}`;
  }
}

export const googleDriveService = new GoogleDriveService();