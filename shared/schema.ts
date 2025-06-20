import mongoose, { Document, Schema } from "mongoose";
import { z } from "zod";

// User Interface and Schema
export interface IUser extends Document {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  givenName?: string;
  familyName?: string;
  title?: string; // P.E., Engineer, etc.
  company?: string;
  isEngineer: boolean;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  tokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  googleId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  picture: { type: String },
  givenName: { type: String },
  familyName: { type: String },
  title: { type: String }, // P.E., Engineer, etc.
  company: { type: String },
  isEngineer: { type: Boolean, default: false },
  googleAccessToken: { type: String, select: false }, // Don't include in queries by default for security
  googleRefreshToken: { type: String, select: false }, // Don't include in queries by default for security
  tokenExpiresAt: { type: Date },
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

export const User = mongoose.model<IUser>('User', userSchema);

// Report Interface and Schema
export interface IReport extends Document {
  projectId: string;
  title: string;
  reportType: string; // structural, transportation, water, geotechnical
  status: string; // draft, in_review, approved, completed
  userId: mongoose.Types.ObjectId;
  assignedEngineer?: mongoose.Types.ObjectId;
  formData?: any;
  googleDocId?: string;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>({
  projectId: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  reportType: { type: String, required: true }, // structural, transportation, water, geotechnical
  status: { type: String, required: true, default: "draft", index: true }, // draft, in_review, approved, completed
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assignedEngineer: { type: Schema.Types.ObjectId, ref: 'User' },
  formData: { type: Schema.Types.Mixed },
  googleDocId: { type: String },
  pdfUrl: { type: String },
}, {
  timestamps: true
});

export const Report = mongoose.model<IReport>('Report', reportSchema);

// Form Step Interface and Schema
export interface IFormStep extends Document {
  reportId: mongoose.Types.ObjectId;
  stepNumber: number;
  stepName: string;
  isCompleted: boolean;
  data?: any;
  createdAt: Date;
  updatedAt: Date;
}

const formStepSchema = new Schema<IFormStep>({
  reportId: { type: Schema.Types.ObjectId, ref: 'Report', required: true, index: true },
  stepNumber: { type: Number, required: true },
  stepName: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
  data: { type: Schema.Types.Mixed },
}, {
  timestamps: true
});

// Compound index for efficient queries
formStepSchema.index({ reportId: 1, stepNumber: 1 }, { unique: true });

export const FormStep = mongoose.model<IFormStep>('FormStep', formStepSchema);

// Report Image Interface and Schema
export interface IReportImage extends Document {
  reportId: mongoose.Types.ObjectId;
  stepNumber?: number; // Which step this image belongs to (optional)
  filename: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  s3Url: string;
  publicUrl: string;
  uploadOrder: number;
  description?: string;
  category?: string; // building, exterior, interior, documents, etc.
  createdAt: Date;
  updatedAt: Date;
}

const reportImageSchema = new Schema<IReportImage>({
  reportId: { type: Schema.Types.ObjectId, ref: 'Report', required: true, index: true },
  stepNumber: { type: Number },
  filename: { type: String, required: true },
  originalFilename: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  s3Key: { type: String, required: true, unique: true },
  s3Url: { type: String, required: true },
  publicUrl: { type: String, required: true },
  uploadOrder: { type: Number, required: true },
  description: { type: String },
  category: { type: String },
}, {
  timestamps: true
});

// Compound index for efficient queries
reportImageSchema.index({ reportId: 1, uploadOrder: 1 });
reportImageSchema.index({ reportId: 1, category: 1 });

export const ReportImage = mongoose.model<IReportImage>('ReportImage', reportImageSchema);

// Form data schemas based on Civil Engineering Report template
export const projectInformationSchema = z.object({
  fileNumber: z.string().min(1, "EFI Global file number is required"),
  dateOfCreation: z.string().min(1, "Date of creation is required"),
  insuredName: z.string().min(1, "Insured name is required"),
  insuredAddress: z.string().min(1, "Insured address is required"),
  dateOfLoss: z.string().min(1, "Date of loss is required"),
  claimNumber: z.string().min(1, "Claim number is required"),
  clientCompany: z.string().min(1, "Client company is required"),
  clientContact: z.string().min(1, "Client contact name is required"),
  engineerName: z.string().min(1, "Engineer name is required"),
  technicalReviewer: z.string().min(1, "Technical reviewer is required"),
  receivedDate: z.string().min(1, "Assignment received date is required"),
  siteVisitDate: z.string().min(1, "Site visit date is required"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

export const assignmentScopeSchema = z.object({
  intervieweesNames: z.string().optional(),
  providedDocumentsTitles: z.string().optional(),
  additionalMethodologyNotes: z.string().optional(),
});

export const buildingAndSiteSchema = z.object({
  structureBuiltDate: z.string().min(1, "Structure built date is required"),
  structureAge: z.string().min(1, "Structure age is required"),
  buildingSystemDescription: z.string().min(1, "Building system description is required"),
  frontFacingDirection: z.string().min(1, "Front facing direction is required"),
  exteriorObservations: z.string().min(1, "Exterior observations are required"),
  interiorObservations: z.string().min(1, "Interior observations are required"),
  otherSiteObservations: z.string().optional(),
});

export const researchSchema = z.object({
  weatherDataSummary: z.string().min(1, "Weather data summary is required"),
  corelogicHailSummary: z.string().min(1, "CoreLogic hail summary is required"),
  corelogicWindSummary: z.string().min(1, "CoreLogic wind summary is required"),
});

export const discussionAndAnalysisSchema = z.object({
  siteDiscussionAnalysis: z.string().min(1, "Site discussion and analysis is required"),
  weatherDiscussionAnalysis: z.string().min(1, "Weather discussion and analysis is required"),
  weatherImpactAnalysis: z.string().min(1, "Weather impact analysis is required"),
  recommendationsAndDiscussion: z.string().optional(),
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

// Zod schemas for validation
export const googleUserSchema = z.object({
  googleId: z.string(),
  email: z.string().email(),
  name: z.string(),
  picture: z.string().url().optional(),
  givenName: z.string().optional(),
  familyName: z.string().optional(),
  title: z.string().optional(),
  company: z.string().optional(),
  isEngineer: z.boolean().default(false),
  googleAccessToken: z.string().optional(),
  googleRefreshToken: z.string().optional(),
  tokenExpiresAt: z.date().optional(),
});

export const createReportSchema = z.object({
  title: z.string().optional(),
  reportType: z.string().optional(), 
  status: z.string().optional(),
  projectId: z.string().optional(),
  userId: z.string().optional(),
  assignedEngineer: z.string().nullable().optional(),
  formData: z.any().optional(),
  googleDocId: z.string().nullable().optional(),
  pdfUrl: z.string().nullable().optional(),
});

export const createFormStepSchema = z.object({
  reportId: z.string(),
  stepNumber: z.number(),
  stepName: z.string(),
  isCompleted: z.boolean().optional(),
  data: z.any().optional(),
});

export const uploadImageSchema = z.object({
  reportId: z.string(),
  stepNumber: z.number().optional(),
  description: z.string().optional(),
  category: z.enum(['building', 'exterior', 'interior', 'documents', 'other']).optional(),
});

export const imageResponseSchema = z.object({
  id: z.string(),
  reportId: z.string(),
  stepNumber: z.number().optional(),
  filename: z.string(),
  originalFilename: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  s3Key: z.string(),
  s3Url: z.string(),
  publicUrl: z.string(),
  uploadOrder: z.number(),
  description: z.string().optional(),
  category: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Type exports
export type GoogleUser = z.infer<typeof googleUserSchema>;
export type CreateReport = z.infer<typeof createReportSchema>;
export type CreateFormStep = z.infer<typeof createFormStepSchema>;
export type UploadImage = z.infer<typeof uploadImageSchema>;
export type ImageResponse = z.infer<typeof imageResponseSchema>;

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

// Legacy schema exports for backward compatibility
export const siteAnalysisSchema = assignmentScopeSchema;
export const designSpecificationsSchema = buildingAndSiteSchema;
export const calculationsSchema = researchSchema;
export const reviewAttachmentsSchema = conclusionsSchema;
