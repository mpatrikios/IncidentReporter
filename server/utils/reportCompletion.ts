import { IFormStep } from '@shared/schema';

export interface CompletionCriteria {
  step: number;
  name: string;
  required: boolean;
  fields: Array<{
    fieldName: string;
    required: boolean;
    minLength?: number;
  }>;
}

// Define completion criteria for each step
export const COMPLETION_CRITERIA: CompletionCriteria[] = [
  {
    step: 1,
    name: "Project Information",
    required: true,
    fields: [
      { fieldName: "fileNumber", required: true },
      { fieldName: "insuredName", required: true },
      { fieldName: "clientCompany", required: true },
      { fieldName: "dateOfLoss", required: true },
      { fieldName: "engineerName", required: true },
      { fieldName: "city", required: true },
      { fieldName: "state", required: true },
    ]
  },
  {
    step: 2,
    name: "Assignment Scope",
    required: true,
    fields: [
      { fieldName: "intervieweesNames", required: true, minLength: 10 },
      { fieldName: "providedDocumentsTitles", required: true, minLength: 5 },
    ]
  },
  {
    step: 3,
    name: "Building & Site Observations",
    required: true,
    fields: [
      { fieldName: "buildingSystemDescription", required: true, minLength: 20 },
      { fieldName: "exteriorObservations", required: true, minLength: 20 },
      { fieldName: "interiorObservations", required: true, minLength: 20 },
    ]
  },
  {
    step: 4,
    name: "Research",
    required: true,
    fields: [
      { fieldName: "weatherDataSummary", required: true, minLength: 10 },
      { fieldName: "corelogicHailSummary", required: true, minLength: 10 },
      { fieldName: "corelogicWindSummary", required: true, minLength: 10 },
    ]
  },
  {
    step: 5,
    name: "Discussion & Analysis",
    required: true,
    fields: [
      { fieldName: "siteDiscussionAnalysis", required: true, minLength: 50 },
      { fieldName: "weatherDiscussionAnalysis", required: true, minLength: 50 },
    ]
  },
  {
    step: 6,
    name: "Conclusions",
    required: true,
    fields: [
      { fieldName: "conclusions", required: true, minLength: 50 },
    ]
  }
];

export interface StepCompletionStatus {
  stepNumber: number;
  stepName: string;
  isComplete: boolean;
  isRequired: boolean;
  missingFields: string[];
  completionPercentage: number;
}

export interface ReportCompletionStatus {
  isComplete: boolean;
  overallPercentage: number;
  requiredStepsComplete: number;
  totalRequiredSteps: number;
  steps: StepCompletionStatus[];
  missingRequiredSteps: string[];
}

/**
 * Check if a field meets the completion criteria
 */
function isFieldComplete(value: any, criteria: { fieldName: string; required: boolean; minLength?: number }): boolean {
  if (!criteria.required) return true;
  
  if (value === undefined || value === null || value === '') {
    return false;
  }
  
  if (criteria.minLength && typeof value === 'string' && value.trim().length < criteria.minLength) {
    return false;
  }
  
  return true;
}

/**
 * Check completion status for a single step
 */
export function checkStepCompletion(stepData: any, stepCriteria: CompletionCriteria): StepCompletionStatus {
  const missingFields: string[] = [];
  let completeFields = 0;
  
  for (const fieldCriteria of stepCriteria.fields) {
    const fieldValue = stepData?.[fieldCriteria.fieldName];
    const isComplete = isFieldComplete(fieldValue, fieldCriteria);
    
    if (isComplete) {
      completeFields++;
    } else if (fieldCriteria.required) {
      missingFields.push(fieldCriteria.fieldName);
    }
  }
  
  const completionPercentage = stepCriteria.fields.length > 0 
    ? (completeFields / stepCriteria.fields.length) * 100 
    : 100;
    
  const isComplete = missingFields.length === 0 && completionPercentage >= 100;
  
  return {
    stepNumber: stepCriteria.step,
    stepName: stepCriteria.name,
    isComplete,
    isRequired: stepCriteria.required,
    missingFields,
    completionPercentage: Math.round(completionPercentage)
  };
}

/**
 * Check overall report completion status
 */
export function checkReportCompletion(formSteps: IFormStep[]): ReportCompletionStatus {
  const stepStatuses: StepCompletionStatus[] = [];
  const missingRequiredSteps: string[] = [];
  let requiredStepsComplete = 0;
  
  // Create a map of step data for easy lookup
  const stepDataMap = new Map<number, any>();
  formSteps.forEach(step => {
    stepDataMap.set(step.stepNumber, step.data);
  });
  
  // Check each step against its criteria
  for (const criteria of COMPLETION_CRITERIA) {
    const stepData = stepDataMap.get(criteria.step);
    const stepStatus = checkStepCompletion(stepData, criteria);
    stepStatuses.push(stepStatus);
    
    if (criteria.required) {
      if (stepStatus.isComplete) {
        requiredStepsComplete++;
      } else {
        missingRequiredSteps.push(criteria.name);
      }
    }
  }
  
  const totalRequiredSteps = COMPLETION_CRITERIA.filter(c => c.required).length;
  const overallPercentage = totalRequiredSteps > 0 
    ? (requiredStepsComplete / totalRequiredSteps) * 100 
    : 100;
  
  const isComplete = requiredStepsComplete === totalRequiredSteps;
  
  return {
    isComplete,
    overallPercentage: Math.round(overallPercentage),
    requiredStepsComplete,
    totalRequiredSteps,
    steps: stepStatuses,
    missingRequiredSteps
  };
}

/**
 * Determine appropriate report status based on completion
 */
export function determineReportStatus(completionStatus: ReportCompletionStatus): string {
  if (completionStatus.isComplete) {
    return "completed";
  } else if (completionStatus.overallPercentage >= 50) {
    return "in_progress";
  } else {
    return "draft";
  }
}