import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User storage table with authentication fields
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  fullName: text("full_name"),
  title: text("title"), // P.E., Engineer, etc.
  isEngineer: boolean("is_engineer").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  projectId: text("project_id").notNull().unique(),
  title: text("title").notNull(),
  reportType: text("report_type").notNull(), // structural, transportation, water, geotechnical
  status: text("status").notNull().default("draft"), // draft, in_review, approved, completed
  createdBy: integer("created_by").notNull(),
  assignedEngineer: integer("assigned_engineer"),
  formData: jsonb("form_data"),
  googleDocId: text("google_doc_id"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const formSteps = pgTable("form_steps", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull(),
  stepNumber: integer("step_number").notNull(),
  stepName: text("step_name").notNull(),
  isCompleted: boolean("is_completed").default(false),
  data: jsonb("data"),
});

// Form data schemas based on Civil Engineering Report template
export const projectInformationSchema = z.object({
  insuredName: z.string().min(1, "Insured name is required"),
  insuredAddress: z.string().min(1, "Insured address is required"),
  fileNumber: z.string().min(1, "File number is required"),
  claimNumber: z.string().min(1, "Claim number is required"),
  clientCompany: z.string().min(1, "Client company is required"),
  clientContactName: z.string().min(1, "Client contact name is required"),
  clientEmail: z.string().email("Valid email is required"),
  dateOfLoss: z.string().min(1, "Date of loss is required"),
  siteVisitDate: z.string().min(1, "Site visit date is required"),
  engineerName: z.string().min(1, "Engineer name is required"),
  technicalReviewerName: z.string().optional(),
});

export const assignmentScopeSchema = z.object({
  assignmentScope: z.string().min(1, "Assignment scope is required"),
  siteContact: z.string().optional(),
  interviewees: z.string().optional(),
  documentsReviewed: z.string().optional(),
  weatherResearchSummary: z.string().optional(),
});

export const buildingAndSiteSchema = z.object({
  structureAge: z.string().optional(),
  squareFootage: z.string().optional(),
  roofType: z.string().optional(),
  ventilationDescription: z.string().optional(),
  buildingDescription: z.string().min(1, "Building description is required"),
  exteriorObservations: z.string().optional(),
  interiorObservations: z.string().optional(),
  crawlspaceObservations: z.string().optional(),
  siteObservations: z.string().optional(),
});

export const researchSchema = z.object({
  weatherDataSummary: z.string().optional(),
  corelogicDataSummary: z.string().optional(),
});

export const discussionAndAnalysisSchema = z.object({
  discussionAndAnalysis: z.string().min(1, "Discussion and analysis is required"),
});

export const conclusionsSchema = z.object({
  conclusions: z.string().min(1, "Conclusions are required"),
});

export const completeFormDataSchema = z.object({
  projectInformation: projectInformationSchema,
  assignmentScope: assignmentScopeSchema,
  buildingAndSite: buildingAndSiteSchema,
  research: researchSchema,
  discussionAndAnalysis: discussionAndAnalysisSchema,
  conclusions: conclusionsSchema,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// Create a more flexible schema for report creation
export const insertReportSchema = z.object({
  title: z.string().optional(),
  reportType: z.string().optional(), 
  status: z.string().optional(),
  projectId: z.string().optional(),
  createdBy: z.number().optional(),
  assignedEngineer: z.number().nullable().optional(),
  formData: z.any().optional(),
  googleDocId: z.string().nullable().optional(),
  pdfUrl: z.string().nullable().optional(),
});

export const insertFormStepSchema = createInsertSchema(formSteps).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertFormStep = z.infer<typeof insertFormStepSchema>;
export type FormStep = typeof formSteps.$inferSelect;

export type ProjectInformation = z.infer<typeof projectInformationSchema>;
export type AssignmentScope = z.infer<typeof assignmentScopeSchema>;
export type BuildingAndSite = z.infer<typeof buildingAndSiteSchema>;
export type Research = z.infer<typeof researchSchema>;
export type DiscussionAndAnalysis = z.infer<typeof discussionAndAnalysisSchema>;
export type Conclusions = z.infer<typeof conclusionsSchema>;
export type CompleteFormData = z.infer<typeof completeFormDataSchema>;

// Legacy types for backward compatibility
export type SiteAnalysis = AssignmentScope;
export type DesignSpecifications = BuildingAndSite;
export type Calculations = Research;
export type ReviewAttachments = Conclusions;
