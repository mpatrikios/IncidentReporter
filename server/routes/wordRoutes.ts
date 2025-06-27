import express from 'express';
import { requireAuth } from '../auth';
import { wordGenerationService } from '../services/wordGenerationService';
import { z } from 'zod';

const router = express.Router();

// Schema for Word generation request
const generateWordSchema = z.object({
  title: z.string().min(1),
  reportData: z.object({
    projectInformation: z.any().optional(),
    assignmentScope: z.any().optional(),
    buildingObservations: z.any().optional(),
    research: z.any().optional(),
    discussionAnalysis: z.any().optional(),
    conclusions: z.any().optional(),
  }),
  images: z.array(z.object({
    originalFilename: z.string(),
    s3Url: z.string().optional(),
    publicUrl: z.string().optional(),
    fileSize: z.number(),
    description: z.string().optional(),
  })).default([]),
  aiEnhanceText: z.boolean().default(false),
});

// Generate Word document endpoint (server-side fallback)
router.post('/api/reports/generate-word', requireAuth, async (req, res) => {
  try {
    // Validate request body
    const validationResult = generateWordSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: validationResult.error 
      });
    }

    const { title, reportData, images, aiEnhanceText } = validationResult.data;

    // Check if server-side generation is appropriate
    const shouldUseServer = wordGenerationService.shouldUseServerSide(images);
    
    if (!shouldUseServer) {
      return res.status(400).json({ 
        error: 'This document should be generated client-side',
        fallback: false 
      });
    }

    // Generate and stream the document
    await wordGenerationService.generateDocument({
      title,
      reportData,
      images,
      aiEnhanceText
    }, res);

  } catch (error) {
    console.error('Word generation error:', error);
    
    // Don't send response if headers already sent (document streaming started)
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to generate Word document',
        details: error.message 
      });
    }
  }
});

// Check if server-side generation is needed
router.post('/api/reports/check-word-generation', requireAuth, async (req, res) => {
  try {
    const { images, estimatedSize } = req.body;
    
    const shouldUseServer = wordGenerationService.shouldUseServerSide(
      images || [], 
      estimatedSize
    );
    
    res.json({ 
      useServerSide: shouldUseServer,
      reason: shouldUseServer 
        ? 'Document too large or complex for client-side generation'
        : 'Document can be generated client-side'
    });
    
  } catch (error) {
    console.error('Generation check error:', error);
    res.status(500).json({ error: 'Failed to check generation method' });
  }
});

export default router;