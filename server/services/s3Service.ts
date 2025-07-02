/**
 * S3 Service for Image Storage
 * 
 * This service handles all image upload, storage, and management for incident reports.
 * Images are stored in S3 and made accessible via presigned URLs for embedding
 * into generated Google Docs and Word documents.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.bucketName = process.env.S3_BUCKET_NAME!;

    if (!this.bucketName) {
      throw new Error('S3_BUCKET_NAME environment variable is required');
    }
  }

  /**
   * Generate a unique filename for S3 storage
   */
  private generateUniqueFilename(reportId: string, originalFilename: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalFilename);
    const baseName = path.basename(originalFilename, extension);
    
    // Clean the base name for S3 compatibility
    const cleanBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    return `reports/${reportId}/images/${timestamp}_${randomString}_${cleanBaseName}${extension}`;
  }

  /**
   * Upload an image to S3
   */
  async uploadImage(
    reportId: string,
    buffer: Buffer,
    originalFilename: string,
    mimeType: string
  ): Promise<{
    s3Key: string;
    s3Url: string;
    publicUrl: string;
  }> {
    try {
      console.log('S3 Upload - Starting upload:', {
        reportId,
        filename: originalFilename,
        mimeType,
        bufferSize: buffer.length,
        bucket: this.bucketName
      });
      
      const s3Key = this.generateUniqueFilename(reportId, originalFilename);
      
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: buffer,
        ContentType: mimeType,
        // Remove ACL since bucket doesn't allow ACLs
        // Public access should be configured at bucket level
        // Add metadata
        Metadata: {
          reportId: reportId,
          originalFilename: originalFilename,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(uploadCommand);
      console.log('S3 Upload - Successfully uploaded to S3:', s3Key);

      // Generate URLs
      const s3Url = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
      
      // Try to generate a presigned URL as fallback in case bucket isn't publicly accessible
      let publicUrl = s3Url;
      try {
        // Generate a presigned URL valid for 24 hours as fallback
        publicUrl = await this.getPresignedUrl(s3Key, 24 * 60 * 60); // 24 hours
      } catch (error) {
        console.warn('Could not generate presigned URL, using direct S3 URL:', error);
        publicUrl = s3Url;
      }

      console.log('S3 Upload - Returning URLs:', {
        s3Key,
        s3Url,
        publicUrl
      });

      return {
        s3Key,
        s3Url,
        publicUrl,
      };
    } catch (error) {
      console.error('Error uploading image to S3:', error);
      throw new Error(`Failed to upload image to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete an image from S3
   */
  async deleteImage(s3Key: string): Promise<void> {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      await this.s3Client.send(deleteCommand);
    } catch (error) {
      console.error('Error deleting image from S3:', error);
      throw new Error(`Failed to delete image from S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a presigned URL for temporary access (if needed for private files)
   */
  async getPresignedUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get direct public URL for an S3 object
   */
  getPublicUrl(s3Key: string): string {
    return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
  }

  /**
   * List all images for a report (if needed)
   */
  async listReportImages(reportId: string): Promise<string[]> {
    try {
      // This would require ListObjectsV2 command if you need this functionality
      // For now, we'll rely on the database to track images
      return [];
    } catch (error) {
      console.error('Error listing report images:', error);
      throw new Error(`Failed to list report images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if S3 service is properly configured
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to list objects in the bucket with a simple prefix
      const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        MaxKeys: 1,
        Prefix: 'health-check/' // Use a prefix that doesn't exist
      });
      
      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      console.error('S3 health check failed:', error);
      
      // If we get a specific error about bucket not existing or access denied,
      // but not about credentials being invalid, the service might still work
      if (error.name === 'NoSuchBucket') {
        console.error('S3 bucket does not exist:', this.bucketName);
        return false;
      }
      
      if (error.name === 'AccessDenied') {
        console.warn('S3 access denied for list operation, but upload/delete might still work');
        return true; // Optimistically return true since put/delete might work
      }
      
      return false;
    }
  }
}

// Export a singleton instance
export const s3Service = new S3Service();