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
    // Connection will be established when needed
  }

  // User methods
  async getUser(id: string): Promise<IUser | null> {
    try {
      await connectDB();
      return User.findById(id);
    } catch (error) {
      console.log('Database not available for getUser');
      return null;
    }
  }

  async getUserByGoogleId(googleId: string): Promise<IUser | null> {
    try {
      await connectDB();
      return User.findOne({ googleId });
    } catch (error) {
      console.log('Database not available for getUserByGoogleId');
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    try {
      await connectDB();
      return User.findOne({ email });
    } catch (error) {
      console.log('Database not available for getUserByEmail');
      return null;
    }
  }

  async createUser(userData: GoogleUser): Promise<IUser> {
    try {
      await connectDB();
      const user = new User(userData);
      return user.save();
    } catch (error) {
      console.log('Database not available for createUser');
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    try {
      await connectDB();
      return User.findByIdAndUpdate(id, updates, { new: true });
    } catch (error) {
      console.log('Database not available for updateUser');
      return null;
    }
  }

  async getUserWithTokens(id: string): Promise<IUser | null> {
    try {
      await connectDB();
      return User.findById(id).select('+googleAccessToken +googleRefreshToken');
    } catch (error) {
      console.log('Database not available for getUserWithTokens');
      return null;
    }
  }

  // Report methods
  async getReport(id: string): Promise<IReport | null> {
    try {
      await connectDB();
      return Report.findById(id).populate('userId assignedEngineer');
    } catch (error) {
      console.log('Database not available for getReport');
      return null;
    }
  }

  async getReportByProjectId(projectId: string): Promise<IReport | null> {
    try {
      await connectDB();
      return Report.findOne({ projectId }).populate('userId assignedEngineer');
    } catch (error) {
      console.log('Database not available for getReportByProjectId');
      return null;
    }
  }

  async createReport(reportData: CreateReport): Promise<IReport> {
    try {
      await connectDB();
      const report = new Report(reportData);
      return report.save();
    } catch (error) {
      console.log('Database not available for createReport');
      throw error;
    }
  }

  async updateReport(id: string, updates: Partial<IReport>): Promise<IReport | null> {
    try {
      await connectDB();
      return Report.findByIdAndUpdate(id, updates, { new: true }).populate('userId assignedEngineer');
    } catch (error) {
      console.log('Database not available for updateReport');
      return null;
    }
  }

  async deleteReport(id: string): Promise<void> {
    try {
      await connectDB();
      await Report.findByIdAndDelete(id);
      // Also delete associated form steps
      await FormStep.deleteMany({ reportId: id });
    } catch (error) {
      console.log('Database not available for deleteReport');
      throw error;
    }
  }

  async getReportsByUser(userId: string): Promise<IReport[]> {
    try {
      await connectDB();
      return Report.find({ userId }).populate('userId assignedEngineer').sort({ updatedAt: -1 });
    } catch (error) {
      console.log('Database not available for getReportsByUser');
      return [];
    }
  }

  async getReportsForEngineerReview(engineerId: string): Promise<IReport[]> {
    try {
      await connectDB();
      return Report.find({
        assignedEngineer: engineerId, 
        status: "in_review" 
      }).populate('userId assignedEngineer').sort({ updatedAt: -1 });
    } catch (error) {
      console.log('Database not available for getReportsForEngineerReview');
      return [];
    }
  }

  // Form Step methods
  async getFormSteps(reportId: string): Promise<IFormStep[]> {
    try {
      await connectDB();
      return FormStep.find({ reportId }).sort({ stepNumber: 1 });
    } catch (error) {
      console.log('Database not available for getFormSteps');
      return [];
    }
  }

  async createFormStep(stepData: CreateFormStep): Promise<IFormStep> {
    try {
      await connectDB();
      const step = new FormStep(stepData);
      return step.save();
    } catch (error) {
      console.log('Database not available for createFormStep');
      throw error;
    }
  }

  async updateFormStep(id: string, updates: Partial<IFormStep>): Promise<IFormStep | null> {
    try {
      await connectDB();
      return FormStep.findByIdAndUpdate(id, updates, { new: true });
    } catch (error) {
      console.log('Database not available for updateFormStep');
      return null;
    }
  }

  async getFormStep(reportId: string, stepNumber: number): Promise<IFormStep | null> {
    try {
      await connectDB();
      return FormStep.findOne({ reportId, stepNumber });
    } catch (error) {
      console.log('Database not available for getFormStep');
      return null;
    }
  }

  async deleteFormStepsByReportId(reportId: string): Promise<void> {
    try {
      await connectDB();
      await FormStep.deleteMany({ reportId });
    } catch (error) {
      console.log('Database not available for deleteFormStepsByReportId');
      throw error;
    }
  }
}

export const storage = new MongoStorage();