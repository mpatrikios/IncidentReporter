import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  title: text("title"), // P.E., Engineer, etc.
  isEngineer: boolean("is_engineer").default(false),
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

// Form data schemas
export const projectInformationSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  projectLocation: z.string().min(1, "Project location is required"),
  clientName: z.string().min(1, "Client name is required"),
  projectDescription: z.string().min(1, "Project description is required"),
  projectManager: z.string().min(1, "Project manager is required"),
  startDate: z.string().min(1, "Start date is required"),
  expectedCompletionDate: z.string().min(1, "Expected completion date is required"),
});

export const siteAnalysisSchema = z.object({
  siteArea: z.number().min(0, "Site area must be positive"),
  soilType: z.string().min(1, "Soil type is required"),
  groundwaterLevel: z.number().optional(),
  existingStructures: z.string().optional(),
  accessibilityNotes: z.string().optional(),
  environmentalFactors: z.array(z.string()).optional(),
});

export const designSpecificationsSchema = z.object({
  designType: z.enum(["structural", "transportation", "water", "geotechnical"]),
  deadLoad: z.number().min(0, "Dead load must be positive").optional(),
  liveLoad: z.number().min(0, "Live load must be positive").optional(),
  material: z.string().optional(),
  concreteStrength: z.string().optional(),
  rebarGrade: z.string().optional(),
  slump: z.number().optional(),
  designCodes: z.array(z.string()).optional(),
  seismicCategory: z.string().optional(),
  windSpeed: z.number().optional(),
  additionalNotes: z.string().optional(),
});

export const calculationsSchema = z.object({
  calculationType: z.array(z.string()),
  loadCalculations: z.string().optional(),
  structuralAnalysis: z.string().optional(),
  safetyFactors: z.number().optional(),
  codeCompliance: z.string().optional(),
});

export const reviewAttachmentsSchema = z.object({
  drawings: z.array(z.string()).optional(),
  specifications: z.array(z.string()).optional(),
  calculations: z.array(z.string()).optional(),
  photos: z.array(z.string()).optional(),
  additionalDocuments: z.array(z.string()).optional(),
});

export const completeFormDataSchema = z.object({
  projectInformation: projectInformationSchema,
  siteAnalysis: siteAnalysisSchema,
  designSpecifications: designSpecificationsSchema,
  calculations: calculationsSchema,
  reviewAttachments: reviewAttachmentsSchema,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
export type SiteAnalysis = z.infer<typeof siteAnalysisSchema>;
export type DesignSpecifications = z.infer<typeof designSpecificationsSchema>;
export type Calculations = z.infer<typeof calculationsSchema>;
export type ReviewAttachments = z.infer<typeof reviewAttachmentsSchema>;
export type CompleteFormData = z.infer<typeof completeFormDataSchema>;
