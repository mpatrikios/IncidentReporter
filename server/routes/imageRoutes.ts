import express from 'express';
import multer from 'multer';
import { requireAuth } from '../auth';
import { storage } from '../storage';
import { googleDriveService } from '../services/googleDriveService';
import { ReportImage, Report, uploadImageSchema } from '@shared/schema';
import { z } from 'zod';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// Get next upload order for a report
async function getNextUploadOrder(reportId: string): Promise<number> {
  const lastImage = await ReportImage.findOne({ reportId })
    .sort({ uploadOrder: -1 })
    .select('uploadOrder');
  
  return lastImage ? lastImage.uploadOrder + 1 : 1;
}

// Upload image endpoint
router.post('/api/reports/:reportId/images', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { reportId } = req.params;
    const imageFile = req.file;
    const userId = req.user._id.toString();

    if (!imageFile) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Validate request body
    const validationResult = uploadImageSchema.safeParse({
      reportId,
      ...req.body
    });

    if (!validationResult.success) {
      return res.status(400).json({ error: 'Invalid request data', details: validationResult.error });
    }

    const { stepNumber, description, category } = validationResult.data;

    // Check if report exists and user has access
    const report = await Report.findOne({ 
      _id: reportId,
      $or: [
        { userId: req.user._id },
        { assignedEngineer: req.user._id }
      ]
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found or access denied' });
    }

    // Upload to Google Drive
    const uploadResult = await googleDriveService.uploadImage(
      userId,
      imageFile.buffer,
      imageFile.originalname,
      imageFile.mimetype,
      reportId,
      report.title
    );

    // Save metadata to database
    const imageRecord = await ReportImage.create({
      reportId: report._id,
      stepNumber,
      filename: uploadResult.filename,
      originalFilename: imageFile.originalname,
      fileSize: imageFile.size,
      mimeType: imageFile.mimetype,
      googleDriveId: uploadResult.googleDriveId,
      googleDriveUrl: uploadResult.webViewUrl,
      publicUrl: uploadResult.publicUrl,
      uploadOrder: await getNextUploadOrder(reportId),
      description,
      category
    });

    res.json({
      id: imageRecord._id.toString(),
      reportId: imageRecord.reportId.toString(),
      stepNumber: imageRecord.stepNumber,
      filename: imageRecord.filename,
      originalFilename: imageRecord.originalFilename,
      fileSize: imageRecord.fileSize,
      mimeType: imageRecord.mimeType,
      googleDriveId: imageRecord.googleDriveId,
      googleDriveUrl: imageRecord.googleDriveUrl,
      publicUrl: imageRecord.publicUrl,
      uploadOrder: imageRecord.uploadOrder,
      description: imageRecord.description,
      category: imageRecord.category,
      createdAt: imageRecord.createdAt.toISOString(),
      updatedAt: imageRecord.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Image upload failed', details: error.message });
  }
});

// Get all images for a report
router.get('/api/reports/:reportId/images', requireAuth, async (req, res) => {
  try {
    const { reportId } = req.params;

    // Check if user has access to report
    const report = await Report.findOne({ 
      _id: reportId,
      $or: [
        { userId: req.user._id },
        { assignedEngineer: req.user._id }
      ]
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found or access denied' });
    }

    // Get all images for the report
    const images = await ReportImage.find({ reportId })
      .sort({ uploadOrder: 1 });

    const imageResponses = images.map(img => ({
      id: img._id.toString(),
      reportId: img.reportId.toString(),
      stepNumber: img.stepNumber,
      filename: img.filename,
      originalFilename: img.originalFilename,
      fileSize: img.fileSize,
      mimeType: img.mimeType,
      googleDriveId: img.googleDriveId,
      googleDriveUrl: img.googleDriveUrl,
      publicUrl: img.publicUrl,
      uploadOrder: img.uploadOrder,
      description: img.description,
      category: img.category,
      createdAt: img.createdAt.toISOString(),
      updatedAt: img.updatedAt.toISOString(),
    }));

    res.json(imageResponses);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Delete an image
router.delete('/api/reports/:reportId/images/:imageId', requireAuth, async (req, res) => {
  try {
    const { reportId, imageId } = req.params;
    const userId = req.user._id.toString();

    // Check if user has access to report
    const report = await Report.findOne({ 
      _id: reportId,
      $or: [
        { userId: req.user._id },
        { assignedEngineer: req.user._id }
      ]
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found or access denied' });
    }

    // Find the image
    const image = await ReportImage.findOne({ _id: imageId, reportId });
    
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete from Google Drive
    try {
      await googleDriveService.deleteImage(userId, image.googleDriveId);
    } catch (error) {
      console.error('Failed to delete from Google Drive:', error);
      // Continue with database deletion even if Drive deletion fails
    }

    // Delete from database
    await ReportImage.deleteOne({ _id: imageId });

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Update image metadata (description, category, order)
router.patch('/api/reports/:reportId/images/:imageId', requireAuth, async (req, res) => {
  try {
    const { reportId, imageId } = req.params;
    const { description, category, uploadOrder } = req.body;

    // Check if user has access to report
    const report = await Report.findOne({ 
      _id: reportId,
      $or: [
        { userId: req.user._id },
        { assignedEngineer: req.user._id }
      ]
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found or access denied' });
    }

    // Update image metadata
    const image = await ReportImage.findOneAndUpdate(
      { _id: imageId, reportId },
      { 
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(uploadOrder !== undefined && { uploadOrder }),
      },
      { new: true }
    );

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json({
      id: image._id.toString(),
      reportId: image.reportId.toString(),
      stepNumber: image.stepNumber,
      filename: image.filename,
      originalFilename: image.originalFilename,
      fileSize: image.fileSize,
      mimeType: image.mimeType,
      googleDriveId: image.googleDriveId,
      googleDriveUrl: image.googleDriveUrl,
      publicUrl: image.publicUrl,
      uploadOrder: image.uploadOrder,
      description: image.description,
      category: image.category,
      createdAt: image.createdAt.toISOString(),
      updatedAt: image.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating image:', error);
    res.status(500).json({ error: 'Failed to update image' });
  }
});

// Get report folder URL
router.get('/api/reports/:reportId/folder-url', requireAuth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user._id.toString();

    // Check if report exists and user has access
    const report = await Report.findOne({ 
      _id: reportId,
      $or: [
        { userId: req.user._id },
        { assignedEngineer: req.user._id }
      ]
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found or access denied' });
    }

    const folderUrl = await googleDriveService.getReportFolderUrl(userId, reportId, report.title);
    
    res.json({ folderUrl });
  } catch (error) {
    console.error('Error getting folder URL:', error);
    res.status(500).json({ error: 'Failed to get folder URL' });
  }
});

export default router;