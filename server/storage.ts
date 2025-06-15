import { User, Report, FormStep, type IUser, type IReport, type IFormStep, type GoogleUser, type CreateReport, type CreateFormStep } from "@shared/schema";
import { connectDB } from "./db";
import mongoose from "mongoose";

export interface IStorage {
  // Users - Authentication
  getUser(id: string): Promise<IUser | null>;
  getUserByGoogleId(googleId: string): Promise<IUser | null>;
  getUserByEmail(email: string): Promise<IUser | null>;
  createUser(user: GoogleUser): Promise<IUser>;
  updateUser(id: string, updates: Partial<IUser>): Promise<IUser | null>;
  getUserWithTokens(id: string): Promise<IUser | null>;
  
  // Reports
  getReport(id: string): Promise<IReport | null>;
  getReportByProjectId(projectId: string): Promise<IReport | null>;
  createReport(report: CreateReport): Promise<IReport>;
  updateReport(id: string, updates: Partial<IReport>): Promise<IReport | null>;
  deleteReport(id: string): Promise<void>;
  getReportsByUser(userId: string): Promise<IReport[]>;
  getReportsForEngineerReview(engineerId: string): Promise<IReport[]>;
  
  // Form Steps
  getFormSteps(reportId: string): Promise<IFormStep[]>;
  createFormStep(step: CreateFormStep): Promise<IFormStep>;
  updateFormStep(id: string, updates: Partial<IFormStep>): Promise<IFormStep | null>;
  getFormStep(reportId: string, stepNumber: number): Promise<IFormStep | null>;
  deleteFormStepsByReportId(reportId: string): Promise<void>;
}

export class MongoStorage implements IStorage {
  constructor() {
    // Initialize MongoDB connection
    connectDB();
  }

  // User methods
  async getUser(id: string): Promise<IUser | null> {
    await connectDB();
    return User.findById(id);
  }

  async getUserByGoogleId(googleId: string): Promise<IUser | null> {
    await connectDB();
    return User.findOne({ googleId });
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    await connectDB();
    return User.findOne({ email });
  }

  async createUser(userData: GoogleUser): Promise<IUser> {
    await connectDB();
    const user = new User(userData);
    return user.save();
  }

  async updateUser(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    await connectDB();
    return User.findByIdAndUpdate(id, updates, { new: true });
  }

  async getUserWithTokens(id: string): Promise<IUser | null> {
    await connectDB();
    return User.findById(id).select('+googleAccessToken +googleRefreshToken');
  }

  // Report methods
  async getReport(id: string): Promise<IReport | null> {
    await connectDB();
    return Report.findById(id).populate('userId assignedEngineer');
  }

  async getReportByProjectId(projectId: string): Promise<IReport | null> {
    await connectDB();
    return Report.findOne({ projectId }).populate('userId assignedEngineer');
  }

  async createReport(reportData: CreateReport): Promise<IReport> {
    await connectDB();
    const report = new Report(reportData);
    return report.save();
  }

  async updateReport(id: string, updates: Partial<IReport>): Promise<IReport | null> {
    await connectDB();
    return Report.findByIdAndUpdate(id, updates, { new: true }).populate('userId assignedEngineer');
  }

  async deleteReport(id: string): Promise<void> {
    await connectDB();
    await Report.findByIdAndDelete(id);
    // Also delete associated form steps
    await FormStep.deleteMany({ reportId: id });
  }

  async getReportsByUser(userId: string): Promise<IReport[]> {
    await connectDB();
    return Report.find({ userId }).populate('userId assignedEngineer').sort({ updatedAt: -1 });
  }

  async getReportsForEngineerReview(engineerId: string): Promise<IReport[]> {
    await connectDB();
    return Report.find({ 
      assignedEngineer: engineerId, 
      status: "in_review" 
    }).populate('userId assignedEngineer').sort({ updatedAt: -1 });
  }

  // Form Step methods
  async getFormSteps(reportId: string): Promise<IFormStep[]> {
    await connectDB();
    return FormStep.find({ reportId }).sort({ stepNumber: 1 });
  }

  async createFormStep(stepData: CreateFormStep): Promise<IFormStep> {
    await connectDB();
    const step = new FormStep(stepData);
    return step.save();
  }

  async updateFormStep(id: string, updates: Partial<IFormStep>): Promise<IFormStep | null> {
    await connectDB();
    return FormStep.findByIdAndUpdate(id, updates, { new: true });
  }

  async getFormStep(reportId: string, stepNumber: number): Promise<IFormStep | null> {
    await connectDB();
    return FormStep.findOne({ reportId, stepNumber });
  }

  async deleteFormStepsByReportId(reportId: string): Promise<void> {
    await connectDB();
    await FormStep.deleteMany({ reportId });
  }
}

export const storage = new MongoStorage();
