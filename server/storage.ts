import { users, reports, formSteps, type User, type InsertUser, type Report, type InsertReport, type FormStep, type InsertFormStep } from "@shared/schema";

export interface IStorage {
  // Users - Authentication
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validateUser(username: string, password: string): Promise<User | null>;
  
  // Reports
  getReport(id: number): Promise<Report | undefined>;
  getReportByProjectId(projectId: string): Promise<Report | undefined>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: number, updates: Partial<Report>): Promise<Report | undefined>;
  getReportsByUser(userId: number): Promise<Report[]>;
  getReportsForEngineerReview(engineerId: number): Promise<Report[]>;
  
  // Form Steps
  getFormSteps(reportId: number): Promise<FormStep[]>;
  createFormStep(step: InsertFormStep): Promise<FormStep>;
  updateFormStep(id: number, updates: Partial<FormStep>): Promise<FormStep | undefined>;
  getFormStep(reportId: number, stepNumber: number): Promise<FormStep | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private reports: Map<number, Report>;
  private formSteps: Map<number, FormStep>;
  private currentUserId: number;
  private currentReportId: number;
  private currentFormStepId: number;

  constructor() {
    this.users = new Map();
    this.reports = new Map();
    this.formSteps = new Map();
    this.currentUserId = 1;
    this.currentReportId = 1;
    this.currentFormStepId = 1;

    // Create sample users
    this.createUser({
      username: "john.doe",
      password: "password123",
      email: "john.doe@example.com",
      firstName: "John",
      lastName: "Doe",
      fullName: "John Doe",
      title: "P.E.",
      isEngineer: true,
    });

    this.createUser({
      username: "jane.smith",
      password: "password123",
      email: "jane.smith@example.com",
      firstName: "Jane",
      lastName: "Smith",
      fullName: "Jane Smith",
      title: "Engineer",
      isEngineer: false,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      fullName: insertUser.fullName || null,
      title: insertUser.title || null,
      isEngineer: insertUser.isEngineer || false,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (user && user.password === password) {
      return user;
    }
    return null;
  }

  async getReport(id: number): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async getReportByProjectId(projectId: string): Promise<Report | undefined> {
    return Array.from(this.reports.values()).find(report => report.projectId === projectId);
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = this.currentReportId++;
    const now = new Date();
    const report: Report = {
      ...insertReport,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.reports.set(id, report);
    return report;
  }

  async updateReport(id: number, updates: Partial<Report>): Promise<Report | undefined> {
    const report = this.reports.get(id);
    if (!report) return undefined;

    const updatedReport: Report = {
      ...report,
      ...updates,
      updatedAt: new Date(),
    };
    this.reports.set(id, updatedReport);
    return updatedReport;
  }

  async getReportsByUser(userId: number): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(report => report.createdBy === userId);
  }

  async getReportsForEngineerReview(engineerId: number): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(
      report => report.assignedEngineer === engineerId && report.status === "in_review"
    );
  }

  async getFormSteps(reportId: number): Promise<FormStep[]> {
    return Array.from(this.formSteps.values())
      .filter(step => step.reportId === reportId)
      .sort((a, b) => a.stepNumber - b.stepNumber);
  }

  async createFormStep(insertStep: InsertFormStep): Promise<FormStep> {
    const id = this.currentFormStepId++;
    const step: FormStep = { ...insertStep, id };
    this.formSteps.set(id, step);
    return step;
  }

  async updateFormStep(id: number, updates: Partial<FormStep>): Promise<FormStep | undefined> {
    const step = this.formSteps.get(id);
    if (!step) return undefined;

    const updatedStep: FormStep = { ...step, ...updates };
    this.formSteps.set(id, updatedStep);
    return updatedStep;
  }

  async getFormStep(reportId: number, stepNumber: number): Promise<FormStep | undefined> {
    return Array.from(this.formSteps.values()).find(
      step => step.reportId === reportId && step.stepNumber === stepNumber
    );
  }
}

export const storage = new MemStorage();
