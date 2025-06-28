import express from 'express';
import { requireAuth } from '../auth';
import { aerialImageService } from '../services/aerialImageService';
import { z } from 'zod';

const router = express.Router();

// Schema for aerial image request
const aerialImageSchema = z.object({
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  zoom: z.number().min(1).max(21).default(18),
  size: z.string().default('640x640'),
  mapType: z.enum(['satellite', 'hybrid', 'roadmap']).default('satellite'),
}).refine(data => data.address || (data.latitude && data.longitude), {
  message: "Either address or both latitude and longitude must be provided"
});

// Get aerial image for a location
router.post('/api/aerial/image', requireAuth, async (req, res) => {
  try {
    console.log('🛰️ Aerial image request received');
    
    // Validate request body
    const validationResult = aerialImageSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: validationResult.error 
      });
    }

    // Check if service is configured
    if (!aerialImageService.isConfigured()) {
      return res.status(503).json({ 
        error: 'Aerial imagery service not configured',
        message: 'Google Maps API key not found'
      });
    }

    const options = validationResult.data;
    console.log('📍 Fetching aerial image with options:', { 
      ...options, 
      address: options.address ? `${options.address.substring(0, 50)}...` : undefined 
    });

    // Get the aerial image
    const imageBuffer = await aerialImageService.getAerialImage(options);
    
    if (!imageBuffer) {
      return res.status(404).json({ 
        error: 'Could not retrieve aerial image',
        message: 'Failed to fetch satellite imagery for the provided location'
      });
    }

    // Set proper headers for image response
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', imageBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Send the image
    res.end(imageBuffer);
    
    console.log(`✅ Aerial image sent: ${imageBuffer.length} bytes`);

  } catch (error: any) {
    console.error('❌ Aerial image error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to retrieve aerial image',
        details: error.message 
      });
    }
  }
});

// Get multiple aerial images (different views/zoom levels)
router.post('/api/aerial/multiple', requireAuth, async (req, res) => {
  try {
    console.log('🛰️ Multiple aerial images request received');
    
    // Validate request body
    const validationResult = aerialImageSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: validationResult.error 
      });
    }

    // Check if service is configured
    if (!aerialImageService.isConfigured()) {
      return res.status(503).json({ 
        error: 'Aerial imagery service not configured',
        message: 'Google Maps API key not found'
      });
    }

    const options = validationResult.data;
    console.log('📍 Fetching multiple aerial images');

    // Get multiple aerial images
    const images = await aerialImageService.getMultipleAerialImages(options);
    
    // Convert buffers to base64 for JSON response
    const response = {
      standard: images.standard ? `data:image/jpeg;base64,${images.standard.toString('base64')}` : null,
      hybrid: images.hybrid ? `data:image/jpeg;base64,${images.hybrid.toString('base64')}` : null,
      overview: images.overview ? `data:image/jpeg;base64,${images.overview.toString('base64')}` : null,
      detail: images.detail ? `data:image/jpeg;base64,${images.detail.toString('base64')}` : null,
    };

    // Count successful images
    const successCount = Object.values(response).filter(img => img !== null).length;
    
    if (successCount === 0) {
      return res.status(404).json({ 
        error: 'Could not retrieve any aerial images',
        message: 'Failed to fetch satellite imagery for the provided location'
      });
    }

    res.json({
      success: true,
      images: response,
      count: successCount
    });
    
    console.log(`✅ Multiple aerial images sent: ${successCount}/4 successful`);

  } catch (error: any) {
    console.error('❌ Multiple aerial images error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve aerial images',
      details: error.message 
    });
  }
});


// Get aerial image from project information
router.post('/api/aerial/from-project', requireAuth, async (req, res) => {
  try {
    console.log('🏠 Aerial image from project info request received');
    
    const { projectInformation } = req.body;
    
    if (!projectInformation) {
      return res.status(400).json({ 
        error: 'Project information is required' 
      });
    }

    // Check if service is configured
    if (!aerialImageService.isConfigured()) {
      return res.status(503).json({ 
        error: 'Aerial imagery service not configured',
        message: 'Google Maps API key not found'
      });
    }

    console.log('📍 Getting aerial image from project information');
    
    // Get aerial image using project information
    const imageBuffer = await aerialImageService.getAerialImageFromProjectInfo(projectInformation);
    
    if (!imageBuffer) {
      return res.status(404).json({ 
        error: 'Could not retrieve aerial image',
        message: 'Failed to fetch satellite imagery for the property address'
      });
    }

    // Set proper headers for image response
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', imageBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Send the image
    res.end(imageBuffer);
    
    console.log(`✅ Project aerial image sent: ${imageBuffer.length} bytes`);

  } catch (error: any) {
    console.error('❌ Project aerial image error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to retrieve aerial image',
        details: error.message 
      });
    }
  }
});

// Health check endpoint
router.get('/api/aerial/health', requireAuth, async (req, res) => {
  try {
    const isConfigured = aerialImageService.isConfigured();
    
    res.json({
      status: isConfigured ? 'ready' : 'not_configured',
      configured: isConfigured,
      message: isConfigured 
        ? 'Aerial imagery service is ready' 
        : 'Google Maps API key not configured'
    });
  } catch (error: any) {
    res.status(500).json({ 
      status: 'error',
      error: error.message 
    });
  }
});

// Cleanup endpoint (for maintenance)
router.post('/api/aerial/cleanup', requireAuth, async (req, res) => {
  try {
    aerialImageService.cleanupTempFiles();
    res.json({ 
      success: true, 
      message: 'Temporary files cleaned up' 
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Cleanup failed',
      details: error.message 
    });
  }
});

export default router;