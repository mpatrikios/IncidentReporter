import express from 'express';
import multer from 'multer';
import { requireAuth } from '../auth';
import { storage } from '../storage';
import { s3Service } from '../services/s3Service';
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

    // Parse and validate request body (FormData comes as strings)
    const validationData = {
      reportId,
      stepNumber: req.body.stepNumber ? parseInt(req.body.stepNumber, 10) : undefined,
      description: req.body.description,
      category: req.body.category,
    };

    const validationResult = uploadImageSchema.safeParse(validationData);

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

    // Upload to S3
    const uploadResult = await s3Service.uploadImage(
      reportId,
      imageFile.buffer,
      imageFile.originalname,
      imageFile.mimetype
    );

    // Save metadata to database
    const imageRecord = await ReportImage.create({
      reportId: report._id,
      stepNumber,
      filename: imageFile.originalname, // Keep original filename for display
      originalFilename: imageFile.originalname,
      fileSize: imageFile.size,
      mimeType: imageFile.mimetype,
      s3Key: uploadResult.s3Key,
      s3Url: uploadResult.s3Url,
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
      s3Key: imageRecord.s3Key,
      s3Url: imageRecord.s3Url,
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
      s3Key: img.s3Key,
      s3Url: img.s3Url,
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

    // Delete from S3
    try {
      await s3Service.deleteImage(image.s3Key);
    } catch (error) {
      console.error('Failed to delete from S3:', error);
      // Continue with database deletion even if S3 deletion fails
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
      s3Key: image.s3Key,
      s3Url: image.s3Url,
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

// S3 health check endpoint
router.get('/api/s3/health', requireAuth, async (req, res) => {
  try {
    const isHealthy = await s3Service.healthCheck();
    
    if (isHealthy) {
      res.json({ status: 'healthy', message: 'S3 service is configured and accessible' });
    } else {
      res.status(500).json({ status: 'unhealthy', message: 'S3 service is not accessible' });
    }
  } catch (error) {
    console.error('S3 health check error:', error);
    res.status(500).json({ status: 'error', message: 'S3 health check failed' });
  }
});

export default router;