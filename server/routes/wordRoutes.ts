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
  includePhotosInline: z.boolean().default(false),
  aiEnhanceText: z.boolean().default(false),
  templateId: z.string().optional().default('MJSolutionsTemplate'),
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

    const { title, reportData, images, includePhotosInline, aiEnhanceText, templateId } = validationResult.data;

    // TEMPORARY: Always allow server-side generation to use the template
    // TODO: Update client-side generation to also use the template
    // const shouldUseServer = wordGenerationService.shouldUseServerSide(images);
    // 
    // if (!shouldUseServer) {
    //   return res.status(400).json({ 
    //     error: 'This document should be generated client-side',
    //     fallback: false 
    //   });
    // }

    // Generate and stream the document
    await wordGenerationService.generateDocument({
      title,
      reportData,
      images,
      includePhotosInline,
      aiEnhanceText,
      templateId
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

// List available templates
router.get('/api/reports/word-templates', requireAuth, async (req, res) => {
  try {
    const templates = wordGenerationService.getAvailableTemplates();
    res.json({ templates });
  } catch (error) {
    console.error('Error listing templates:', error);
    res.status(500).json({ error: 'Failed to list templates' });
  }
});

// Debug endpoint to test template validation
router.post('/api/reports/debug-template', requireAuth, async (req, res) => {
  try {
    const { templateId = 'MJSolutionsTemplate' } = req.body;
    
    console.log(`🔍 DEBUG: Testing template validation for: ${templateId}`);
    
    // Test template validation
    const result = await (wordGenerationService as any).debugTemplateValidation(templateId);
    
    res.json({
      success: true,
      templateId,
      ...result
    });
    
  } catch (error) {
    console.error('Template debug error:', error);
    res.status(500).json({ 
      error: 'Template validation failed',
      details: error.message 
    });
  }
});

// Enhanced debug endpoint to test Word generation with sample data
router.post('/api/reports/debug-word-generation', requireAuth, async (req, res) => {
  try {
    console.log('🚨 DEBUG: Starting enhanced Word generation test...');
    
    // Create sample data that matches all required fields
    const sampleReportData = {
      projectInformation: {
        fileNumber: 'DEBUG-001',
        dateOfCreation: new Date().toLocaleDateString(),
        insuredName: 'Test Insured',
        insuredAddress: '123 Test Street, Test City, TS 12345',
        dateOfLoss: '2024-01-15',
        claimNumber: 'CLM-123456',
        clientCompany: 'Test Insurance Co.',
        clientContact: 'John Smith',
        clientEmail: 'john@test.com',
        clientPhone: '555-1234',
        engineerName: 'Test Engineer',
        technicalReviewer: 'Test Reviewer',
        receivedDate: '2024-01-10',
        siteVisitDate: '2024-01-20',
        licenseNumber: 'PE-12345'
      },
      assignmentScope: {
        intervieweesNames: 'Test Person 1, Test Person 2',
        providedDocumentsTitles: 'Insurance Policy, Photos, Previous Reports'
      },
      buildingAndSite: {
        structureBuiltDate: '1995',
        structureAge: '29 years',
        buildingSystemDescription: 'Two-story residential home with wood frame construction.',
        frontFacingDirection: 'North',
        exteriorObservations: 'Exterior shows signs of weather damage to roof shingles.',
        interiorObservations: 'Interior has water stains on ceiling in living room.',
        otherSiteObservations: 'Property well-maintained overall with minor storm damage.'
      },
      research: {
        weatherDataSummary: 'Severe thunderstorm with 70 mph winds and golf-ball sized hail occurred on date of loss.',
        corelogicHailSummary: 'CoreLogic confirms hail event with 1.75 inch diameter stones.',
        corelogicWindSummary: 'Wind speeds reached 72 mph sustained with gusts to 85 mph.'
      },
      discussionAndAnalysis: {
        siteDiscussionAnalysis: 'Site inspection confirms damage consistent with reported storm event.',
        weatherDiscussionAnalysis: 'Weather data supports timeline and severity of reported incident.',
        weatherImpactAnalysis: 'Storm conditions were sufficient to cause observed damage patterns.',
        recommendationsAndDiscussion: 'Recommend replacement of damaged roofing materials and interior repairs.'
      },
      conclusions: {
        conclusions: 'Based on site inspection and weather analysis, damage is consistent with reported storm event.'
      }
    };

    const sampleOptions = {
      title: 'DEBUG_Test_Report',
      reportData: sampleReportData,
      images: [],
      includePhotosInline: false,
      aiEnhanceText: false,
      templateId: 'MJSolutionsTemplate'
    };

    console.log('🧪 DEBUG: Sample data prepared, starting generation...');

    // Generate document with enhanced logging
    await wordGenerationService.generateDocument(sampleOptions, res);

  } catch (error) {
    console.error('🚨 DEBUG: Word generation test failed:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Debug Word generation failed',
        details: error.message,
        stack: error.stack
      });
    }
  }
});

export default router;