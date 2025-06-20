/**
 * Migration: Remove Google Drive index and field from ReportImage collection
 * 
 * This migration:
 * 1. Drops the unique index on googleDriveId
 * 2. Removes the googleDriveId field from existing documents
 * 3. Removes the googleDriveUrl field from existing documents
 * 
 * Run this migration after switching from Google Drive to S3 for image storage.
 */

import mongoose from 'mongoose';

export async function dropGoogleDriveIndex() {
  try {
    console.log('Starting Google Drive index migration...');

    // Get the collection
    const collection = mongoose.connection.db.collection('reportimages');

    // 1. Drop the unique index on googleDriveId if it exists
    try {
      await collection.dropIndex('googleDriveId_1');
      console.log('✅ Dropped googleDriveId unique index');
    } catch (error: any) {
      if (error.code === 27 || error.message.includes('index not found')) {
        console.log('ℹ️ googleDriveId index not found (already dropped)');
      } else {
        console.error('❌ Error dropping googleDriveId index:', error);
        throw error;
      }
    }

    // 2. Remove googleDriveId and googleDriveUrl fields from existing documents
    const result = await collection.updateMany(
      {}, 
      { 
        $unset: { 
          googleDriveId: "", 
          googleDriveUrl: "" 
        } 
      }
    );

    console.log(`✅ Removed Google Drive fields from ${result.modifiedCount} documents`);

    // 3. Check if we have any documents without s3Key (old documents)
    const documentsWithoutS3 = await collection.countDocuments({ s3Key: { $exists: false } });
    
    if (documentsWithoutS3 > 0) {
      console.log(`⚠️ Warning: Found ${documentsWithoutS3} image documents without S3 keys`);
      console.log('   These are likely old Google Drive images that may need manual migration');
      
      // For old documents without S3 data, we could either:
      // - Delete them (if they're test data)
      // - Set placeholder S3 values
      // For now, just log the warning
    }

    console.log('✅ Google Drive index migration completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Note: Auto-run functionality removed for ES modules compatibility
// This migration is run automatically during server startup