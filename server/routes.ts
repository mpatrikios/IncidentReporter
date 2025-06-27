import type { Express } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { requireAuth } from "./auth";
import { storage } from "./storage";
import fs from "fs";
import path from "path";
import { 
  createFormStepSchema,
  projectInformationSchema,
  assignmentScopeSchema,
  buildingAndSiteSchema,
  researchSchema,
  discussionAndAnalysisSchema,
  conclusionsSchema
} from "@shared/schema";
import { z } from "zod";
import mongoose from "mongoose";
import { noaaService } from "./services/noaaService";
import { aiTextService } from "./services/aiTextService";
import imageRoutes from "./routes/imageRoutes";
import wordRoutes from "./routes/wordRoutes";

// Utility function to validate ObjectId
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // OAuth configuration checks
  let isGoogleOAuthConfigured = false;
  let isMicrosoftOAuthConfigured = false;
  
  try {
    const credentialsPath = path.join(process.cwd(), 'server/config/credentials.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    // Check Google OAuth config (support both old and new format)
    isGoogleOAuthConfigured = !!(
      (credentials?.google?.web?.client_id && credentials?.google?.web?.client_secret) ||
      (credentials?.web?.client_id && credentials?.web?.client_secret)
    );
    
    // Check Microsoft OAuth config
    isMicrosoftOAuthConfigured = !!(credentials?.microsoft?.client_id && credentials?.microsoft?.client_secret);
  } catch (error) {
    // Fallback to environment variables
    isGoogleOAuthConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    isMicrosoftOAuthConfigured = !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET);
  }
  
  if (isGoogleOAuthConfigured) {
    app.get('/auth/google',
      (req, res, next) => {
        // Store the return URL in session if provided
        const returnTo = req.query.returnTo as string;
        if (returnTo) {
          (req.session as any).returnTo = returnTo;
        }
        next();
      },
      passport.authenticate('google', { 
        scope: [
          'profile', 
          'email', 
          'https://www.googleapis.com/auth/docs',
          'https://www.googleapis.com/auth/drive.file'
        ] 
      })
    );

    app.get('/auth/google/callback',
      passport.authenticate('google', { 
        failureRedirect: '/login?error=verification_failed&message=User%20not%20verified.%20Only%20verified%20paying%20users%20can%20access%20this%20application.'
      }),
      (req, res) => {
        // Check if there's a return URL in session
        const returnTo = (req.session as any).returnTo;
        if (returnTo) {
          delete (req.session as any).returnTo; // Clear the return URL
          res.redirect(returnTo);
        } else {
          // Default redirect to dashboard
          res.redirect('/dashboard');
        }
      }
    );
  } else {
    // Provide fallback routes when Google OAuth is not configured
    app.get('/auth/google', (req, res) => {
      res.status(501).json({ message: "Google OAuth not configured" });
    });

    app.get('/auth/google/callback', (req, res) => {
      res.status(501).json({ message: "Google OAuth not configured" });
    });
  }

  // Microsoft OAuth routes - only register if Microsoft OAuth is configured
  if (isMicrosoftOAuthConfigured) {
    app.get('/auth/microsoft',
      (req, res, next) => {
        // Store the return URL in session if provided
        const returnTo = req.query.returnTo as string;
        if (returnTo) {
          (req.session as any).returnTo = returnTo;
        }
        next();
      },
      passport.authenticate('microsoft', {
        scope: ['user.read']
      })
    );

    app.get('/auth/microsoft/callback',
      passport.authenticate('microsoft', { 
        failureRedirect: '/login?error=verification_failed&message=User%20not%20verified.%20Only%20verified%20paying%20users%20can%20access%20this%20application.'
      }),
      (req, res) => {
        // Check if there's a return URL in session
        const returnTo = (req.session as any).returnTo;
        if (returnTo) {
          delete (req.session as any).returnTo; // Clear the return URL
          res.redirect(returnTo);
        } else {
          // Default redirect to dashboard
          res.redirect('/dashboard');
        }
      }
    );
  } else {
    // Provide fallback routes when Microsoft OAuth is not configured
    app.get('/auth/microsoft', (req, res) => {
      res.status(501).json({ message: "Microsoft OAuth not configured" });
    });

    app.get('/auth/microsoft/callback', (req, res) => {
      res.status(501).json({ message: "Microsoft OAuth not configured" });
    });
  }

  // Authentication routes
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      req.session?.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Session cleanup failed" });
        }
        res.json({ message: "Logout successful" });
      });
    });
  });

  // Get current user
  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Check Google authentication status
  app.get("/api/auth/google-status", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.json({
          hasGoogleAuth: false,
          tokenExpired: true,
          needsReauth: true,
          authUrl: '/auth/google',
          message: 'User not authenticated'
        });
      }

      const userId = (req.user as any)._id.toString();
      const user = await storage.getUserWithTokens(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const hasGoogleAuth = !!(user.googleAccessToken && user.googleRefreshToken);
      const tokenExpired = user.tokenExpiresAt ? new Date() > user.tokenExpiresAt : true;

      res.json({
        hasGoogleAuth,
        tokenExpired,
        needsReauth: !hasGoogleAuth || tokenExpired,
        authUrl: hasGoogleAuth ? null : '/auth/google'
      });
    } catch (error) {
      console.error('Error checking Google auth status:', error);
      res.status(500).json({ message: "Failed to check Google authentication status" });
    }
  });

  // Get user reports
  app.get("/api/reports", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any)._id.toString();
      const reports = await storage.getReportsByUser(userId);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Create new report
  app.post("/api/reports", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any)._id.toString();
      
      // Generate project ID and set default values
      const projectId = `CE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
      
      // Skip validation and create report directly with required fields
      const reportData = {
        title: req.body.title || "New Civil Engineering Report",
        reportType: req.body.reportType || "structural", 
        status: req.body.status || "draft",
        projectId,
        userId: userId,
        assignedEngineer: req.body.assignedEngineer || undefined,
        formData: req.body.formData || undefined,
        googleDocId: req.body.googleDocId || undefined,
        pdfUrl: req.body.pdfUrl || undefined,
      };
      
      const report = await storage.createReport(reportData);

      // Initialize form steps
      const stepNames = [
        "Project Information",
        "Assignment Scope", 
        "Building & Site Observations",
        "Research",
        "Discussion & Analysis",
        "Conclusions"
      ];

      for (let i = 0; i < stepNames.length; i++) {
        await storage.createFormStep({
          reportId: report.id,
          stepNumber: i + 1,
          stepName: stepNames[i],
          isCompleted: false,
          data: null,
        });
      }

      res.json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create report" });
      }
    }
  });

  // Get specific report
  app.get("/api/reports/:id", async (req, res) => {
    try {
      const reportId = req.params.id;
      const report = await storage.getReport(reportId);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  // Update report
  app.patch("/api/reports/:id", async (req, res) => {
    try {
      const reportId = req.params.id;
      const updates = req.body;
      
      const report = await storage.updateReport(reportId, updates);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to update report" });
    }
  });

  // Get form steps for a report
  app.get("/api/reports/:id/steps", async (req, res) => {
    try {
      const reportId = req.params.id;
      const steps = await storage.getFormSteps(reportId);
      res.json(steps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch form steps" });
    }
  });

  // Update form step
  app.patch("/api/reports/:reportId/steps/:stepNumber", async (req, res) => {
    try {
      const reportId = req.params.reportId;
      const stepNumber = parseInt(req.params.stepNumber);
      
      if (!isValidObjectId(reportId)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }
      const { data, isCompleted } = req.body;

      // For auto-save (when isCompleted is false), use partial validation
      // For manual save (when isCompleted is true), use strict validation
      let validatedData = data;
      
      if (isCompleted) {
        // Strict validation for completed steps
        switch (stepNumber) {
          case 1:
            validatedData = projectInformationSchema.parse(data);
            break;
          case 2:
            validatedData = assignmentScopeSchema.parse(data);
            break;
          case 3:
            validatedData = buildingAndSiteSchema.parse(data);
            break;
          case 4:
            validatedData = researchSchema.parse(data);
            break;
          case 5:
            validatedData = discussionAndAnalysisSchema.parse(data);
            break;
          case 6:
            validatedData = conclusionsSchema.parse(data);
            break;
        }
      } else {
        // Lenient validation for auto-save - just use the data as-is
        // This allows partial/incomplete data to be saved
        validatedData = data;
      }

      const step = await storage.getFormStep(reportId, stepNumber);
      if (!step) {
        return res.status(404).json({ message: "Form step not found" });
      }

      const updatedStep = await storage.updateFormStep(step.id, {
        data: validatedData,
        isCompleted: isCompleted ?? step.isCompleted,
      });

      res.json(updatedStep);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update form step" });
      }
    }
  });

  // AI Text Generation endpoint
  app.post("/api/ai/generate-text", requireAuth, async (req, res) => {
    try {
      const { bulletPoints, fieldType, context } = req.body;

      if (!bulletPoints || typeof bulletPoints !== 'string') {
        return res.status(400).json({ message: "Bullet points are required" });
      }

      if (!fieldType || typeof fieldType !== 'string') {
        return res.status(400).json({ message: "Field type is required" });
      }

      if (!aiTextService.isConfigured()) {
        return res.status(503).json({ 
          message: "AI text generation is not configured. Please contact administrator." 
        });
      }

      const generatedText = await aiTextService.generateParagraph({
        bulletPoints,
        fieldType,
        context
      });

      res.json({ generatedText });
    } catch (error) {
      console.error('AI text generation error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate text" 
      });
    }
  });

  // Save completed report
  app.post("/api/reports/:id/save", async (req, res) => {
    try {
      const reportId = req.params.id;
      const { title } = req.body;
      
      if (!title || !title.trim()) {
        return res.status(400).json({ message: "Report title is required" });
      }

      // Get all form steps to compile complete form data
      const steps = await storage.getFormSteps(reportId);
      const formData: any = {};
      
      steps.forEach(step => {
        switch (step.stepNumber) {
          case 1:
            formData.projectInformation = step.data;
            break;
          case 2:
            formData.assignmentScope = step.data;
            break;
          case 3:
            formData.buildingAndSite = step.data;
            break;
          case 4:
            formData.research = step.data;
            break;
          case 5:
            formData.discussionAndAnalysis = step.data;
            break;
          case 6:
            formData.conclusions = step.data;
            break;
        }
      });

      // Update report status and form data
      const report = await storage.updateReport(reportId, {
        title: title.trim(),
        status: "completed",
        formData: formData,
      });

      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      res.json({ message: "Report saved successfully", report });
    } catch (error) {
      res.status(500).json({ message: "Failed to save report" });
    }
  });

  // Submit report for review (kept for backward compatibility)
  app.post("/api/reports/:id/submit", async (req, res) => {
    try {
      const reportId = req.params.id;
      
      // Get all form steps to compile complete form data
      const steps = await storage.getFormSteps(reportId);
      const formData: any = {};
      
      steps.forEach(step => {
        switch (step.stepNumber) {
          case 1:
            formData.projectInformation = step.data;
            break;
          case 2:
            formData.assignmentScope = step.data;
            break;
          case 3:
            formData.buildingAndSite = step.data;
            break;
          case 4:
            formData.research = step.data;
            break;
          case 5:
            formData.discussionAndAnalysis = step.data;
            break;
          case 6:
            formData.conclusions = step.data;
            break;
        }
      });

      // Update report status and form data
      const report = await storage.updateReport(reportId, {
        status: "in_review",
        formData: formData,
        assignedEngineer: new mongoose.Types.ObjectId(), // Assign to sample engineer
      });

      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // In a real application, this would:
      // 1. Generate Google Doc from template
      // 2. Send email notification to engineer
      // 3. Create PDF version

      res.json({ message: "Report submitted for review", report });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit report" });
    }
  });

  // Generate Google Doc from template
  // Progress tracking endpoint
  app.get("/api/reports/:id/generation-progress", requireAuth, (req, res) => {
    const reportId = req.params.id;
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Store the response object for this report generation
    const progressKey = `progress_${reportId}`;
    if (!global.progressStreams) {
      global.progressStreams = new Map();
    }
    global.progressStreams.set(progressKey, res);

    // Send initial progress
    res.write(`data: ${JSON.stringify({ progress: 0, message: 'Starting generation...' })}\n\n`);

    // Clean up on client disconnect
    req.on('close', () => {
      global.progressStreams.delete(progressKey);
    });
  });

  app.post("/api/reports/:id/generate-doc", requireAuth, async (req, res) => {
    try {
      const reportId = req.params.id;
      const userId = (req.user as any)._id.toString();
      const { aiEnhanceText, includePhotosInline } = req.body;
      
      // Helper function to send progress updates
      const sendProgress = (progress: number, message: string) => {
        const progressKey = `progress_${reportId}`;
        if (global.progressStreams && global.progressStreams.has(progressKey)) {
          const stream = global.progressStreams.get(progressKey);
          stream.write(`data: ${JSON.stringify({ progress, message })}\n\n`);
        }
      };
      
      console.log('DEBUG: Generate doc request for report:', reportId, 'user:', userId);
      
      sendProgress(10, 'Validating request...');
      
      if (!isValidObjectId(reportId)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }
      
      sendProgress(20, 'Loading report data...');
      
      const report = await storage.getReport(reportId);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      console.log('DEBUG: Report found, checking user authentication...');

      sendProgress(30, 'Initializing Google Docs service...');
      
      // Import the Google Docs service
      const { googleDocsService } = await import('./services/googleDocsService.js');

      // Access report data from formData field or compile from steps
      const formData = report.formData as any;
      let reportData;
      
      if (!formData || Object.keys(formData).length === 0) {
        // Compile data from individual steps
        const steps = await storage.getFormSteps(reportId);
        const compiledData: any = {};
        
        steps.forEach(step => {
          switch (step.stepNumber) {
            case 1:
              compiledData.projectInformation = step.data;
              break;
            case 2:
              compiledData.assignmentScope = step.data;
              break;
            case 3:
              compiledData.buildingObservations = step.data;
              break;
            case 4:
              compiledData.research = step.data;
              break;
            case 5:
              compiledData.discussionAnalysis = step.data;
              break;
            case 6:
              compiledData.conclusions = step.data;
              break;
          }
        });
        
        reportData = compiledData;
      } else {
        reportData = {
          projectInformation: formData?.projectInformation,
          assignmentScope: formData?.assignmentScope,
          buildingObservations: formData?.buildingAndSite,
          research: formData?.research,
          discussionAnalysis: formData?.discussionAndAnalysis,
          conclusions: formData?.conclusions
        };
      }

      sendProgress(40, 'Preparing report content...');
      
      // Generate report title
      const reportTitle = report.title || `Civil Engineering Report - ${reportData?.projectInformation?.insuredName || 'Unnamed'} - ${new Date().toLocaleDateString()}`;

      sendProgress(50, aiEnhanceText ? 'Generating document with AI enhancement...' : 'Generating document...');
      
      // Generate professional report using the new method
      const googleDocId = await googleDocsService.createProfessionalReport(userId, reportData, reportTitle, reportId, aiEnhanceText, sendProgress);
      
      if (!googleDocId) {
        throw new Error('Failed to generate document');
      }

      sendProgress(95, 'Saving document information...');
      
      const updatedReport = await storage.updateReport(reportId, {
        googleDocId: googleDocId,
      });

      sendProgress(100, 'Document generation complete!');
      
      // Clean up the progress stream
      const progressKey = `progress_${reportId}`;
      if (global.progressStreams && global.progressStreams.has(progressKey)) {
        const stream = global.progressStreams.get(progressKey);
        stream.write(`data: ${JSON.stringify({ progress: 100, message: 'Complete!', completed: true })}\n\n`);
        stream.end();
        global.progressStreams.delete(progressKey);
      }

      res.json({ 
        message: "Google Doc generated successfully", 
        googleDocId: googleDocId,
        documentUrl: `https://docs.google.com/document/d/${googleDocId}/edit`,
        report: updatedReport 
      });
    } catch (error) {
      console.error('Error generating Google Doc:', error);
      
      let statusCode = 500;
      let errorMessage = "Failed to generate Google Doc";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Set appropriate status codes for specific errors
        if (error.message.includes('not authenticated') || error.message.includes('access token')) {
          statusCode = 401;
          errorMessage = "Google authentication required. Please re-authenticate with Google.";
        } else if (error.message.includes('Template access denied') || error.message.includes('403')) {
          statusCode = 403;
          errorMessage = "Template access denied. Please ensure the template is shared properly.";
        } else if (error.message.includes('Template document not found') || error.message.includes('404')) {
          statusCode = 404;
          errorMessage = "Template document not found. Please check the template configuration.";
        }
      }
      
      // Ensure we always return JSON, never HTML
      res.status(statusCode).json({ 
        message: errorMessage,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    }
  });


  // Check Google authentication status
  app.get("/api/google/auth-status", async (req, res) => {
    try {
      const { googleDocsService } = await import('./services/googleDocsService.js');
      const isAuthenticated = await googleDocsService.isAuthenticated();
      
      res.json({ 
        authenticated: isAuthenticated,
        authUrl: isAuthenticated ? null : googleDocsService.getAuthUrl()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check auth status" });
    }
  });

  // Delete report
  app.delete("/api/reports/:id", async (req, res) => {
    try {
      const reportId = req.params.id;
      
      if (!isValidObjectId(reportId)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }
      
      // Check if report exists
      const report = await storage.getReport(reportId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Delete associated form steps first
      await storage.deleteFormStepsByReportId(reportId);
      
      // Delete the report
      await storage.deleteReport(reportId);
      
      res.json({ message: "Report deleted successfully" });
    } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({ message: "Failed to delete report" });
    }
  });

  // NOAA Storm Data API endpoint
  app.post("/api/storm-data", requireAuth, async (req, res) => {
    try {
      const { latitude, longitude, date, radiusKm } = req.body;

      if (!latitude || !longitude || !date) {
        return res.status(400).json({ 
          message: "Latitude, longitude, and date are required" 
        });
      }

      const stormData = await noaaService.getStormEvents({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        date: date,
        radiusKm: radiusKm || 50
      });

      res.json(stormData);
    } catch (error) {
      console.error('Error fetching storm data:', error);
      res.status(500).json({ 
        message: "Failed to fetch storm data",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get weather stations for a location
  app.get("/api/weather-stations", requireAuth, async (req, res) => {
    try {
      const { latitude, longitude } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({ 
          message: "Latitude and longitude are required" 
        });
      }

      const stations = await noaaService.getWeatherStations(
        parseFloat(latitude as string),
        parseFloat(longitude as string)
      );

      res.json(stations);
    } catch (error) {
      console.error('Error fetching weather stations:', error);
      res.status(500).json({ 
        message: "Failed to fetch weather stations",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Register image routes
  app.use(imageRoutes);
  
  // Register Word generation routes
  app.use(wordRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
