import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertFormStepSchema,
  projectInformationSchema,
  assignmentScopeSchema,
  buildingAndSiteSchema,
  researchSchema,
  discussionAndAnalysisSchema,
  conclusionsSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.validateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set user session (simplified - in production use proper session management)
      req.session = req.session || {};
      req.session.userId = user.id;
      req.session.user = user;
      
      // Don't send password in response
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, message: "Login successful" });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    req.session = null;
    res.json({ message: "Logout successful" });
  });

  // Get current user
  app.get("/api/auth/user", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password in response
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Get user reports
  app.get("/api/reports", async (req, res) => {
    try {
      const userId = 1; // Mock user ID
      const reports = await storage.getReportsByUser(userId);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Create new report
  app.post("/api/reports", async (req, res) => {
    try {
      // Generate project ID and set default values
      const projectId = `CE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
      
      // Skip validation and create report directly with required fields
      const reportData = {
        title: req.body.title || "New Civil Engineering Report",
        reportType: req.body.reportType || "structural", 
        status: req.body.status || "draft",
        projectId,
        createdBy: 1, // Mock user ID
        assignedEngineer: req.body.assignedEngineer || null,
        formData: req.body.formData || null,
        googleDocId: req.body.googleDocId || null,
        pdfUrl: req.body.pdfUrl || null,
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
      const reportId = parseInt(req.params.id);
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
      const reportId = parseInt(req.params.id);
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
      const reportId = parseInt(req.params.id);
      const steps = await storage.getFormSteps(reportId);
      res.json(steps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch form steps" });
    }
  });

  // Update form step
  app.patch("/api/reports/:reportId/steps/:stepNumber", async (req, res) => {
    try {
      const reportId = parseInt(req.params.reportId);
      const stepNumber = parseInt(req.params.stepNumber);
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

  // Save completed report
  app.post("/api/reports/:id/save", async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
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
      const reportId = parseInt(req.params.id);
      
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
        assignedEngineer: 1, // Assign to sample engineer
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
  app.post("/api/reports/:id/generate-doc", async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      
      const report = await storage.getReport(reportId);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Import the Google Docs service
      const { googleDocsService } = await import('./services/googleDocsService.js');
      
      // Check if authenticated
      const isAuthenticated = await googleDocsService.isAuthenticated();
      if (!isAuthenticated) {
        return res.status(401).json({ 
          message: "Google API not authenticated", 
          authUrl: googleDocsService.getAuthUrl() 
        });
      }

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

      // Generate report title
      const reportTitle = `Civil Engineering Report - ${formData?.projectInformation?.insuredName || 'Report'} - ${new Date().toLocaleDateString()}`;

      // Generate from configured template
      const googleDocId = await googleDocsService.generateFromTemplate(reportData, reportTitle);
      
      if (!googleDocId) {
        throw new Error('Failed to generate document');
      }

      const updatedReport = await storage.updateReport(reportId, {
        googleDocId: googleDocId,
      });

      res.json({ 
        message: "Google Doc generated successfully", 
        googleDocId: googleDocId,
        documentUrl: `https://docs.google.com/document/d/${googleDocId}/edit`,
        report: updatedReport 
      });
    } catch (error) {
      console.error('Error generating Google Doc:', error);
      res.status(500).json({ 
        message: "Failed to generate Google Doc", 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Google OAuth endpoints
  app.get("/auth/google", async (req, res) => {
    try {
      const { googleDocsService } = await import('./services/googleDocsService.js');
      const authUrl = googleDocsService.getAuthUrl();
      res.redirect(authUrl);
    } catch (error) {
      res.status(500).json({ message: "Failed to initialize Google auth" });
    }
  });

  app.get("/auth/google/callback", async (req, res) => {
    try {
      const { code } = req.query;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ message: "Authorization code not provided" });
      }

      const { googleDocsService } = await import('./services/googleDocsService.js');
      await googleDocsService.setAuthTokens(code);
      
      // Redirect back to the application with success
      res.redirect("/?auth=success");
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect("/?auth=error");
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
      const reportId = parseInt(req.params.id);
      
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

  const httpServer = createServer(app);
  return httpServer;
}
