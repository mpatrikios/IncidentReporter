import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertFormStepSchema,
  projectInformationSchema,
  siteAnalysisSchema,
  designSpecificationsSchema,
  calculationsSchema,
  reviewAttachmentsSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get current user (mock session)
  app.get("/api/user", async (req, res) => {
    // For demo purposes, return the first user
    const user = await storage.getUser(1);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });

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
        "Site Analysis", 
        "Design Specifications",
        "Calculations",
        "Review & Attachments",
        "Submit Report"
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

      // Validate step data based on step number
      let validatedData = data;
      switch (stepNumber) {
        case 1:
          validatedData = projectInformationSchema.parse(data);
          break;
        case 2:
          validatedData = siteAnalysisSchema.parse(data);
          break;
        case 3:
          validatedData = designSpecificationsSchema.parse(data);
          break;
        case 4:
          validatedData = calculationsSchema.parse(data);
          break;
        case 5:
          validatedData = reviewAttachmentsSchema.parse(data);
          break;
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

  // Submit report for review
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
            formData.siteAnalysis = step.data;
            break;
          case 3:
            formData.designSpecifications = step.data;
            break;
          case 4:
            formData.calculations = step.data;
            break;
          case 5:
            formData.reviewAttachments = step.data;
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

  // Generate Google Doc (mock implementation)
  app.post("/api/reports/:id/generate-doc", async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const report = await storage.getReport(reportId);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Mock Google Doc generation
      const mockGoogleDocId = `doc_${Date.now()}`;
      
      const updatedReport = await storage.updateReport(reportId, {
        googleDocId: mockGoogleDocId,
      });

      res.json({ 
        message: "Google Doc generated successfully", 
        googleDocId: mockGoogleDocId,
        report: updatedReport 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate Google Doc" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
