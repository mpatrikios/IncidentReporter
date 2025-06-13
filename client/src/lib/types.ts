export interface FormStepConfig {
  number: number;
  name: string;
  title: string;
  description: string;
  icon: string;
}

export const FORM_STEPS: FormStepConfig[] = [
  {
    number: 1,
    name: "projectInformation",
    title: "Project Information",
    description: "Insured details, file numbers, and client contact information",
    icon: "fas fa-clipboard-list"
  },
  {
    number: 2,
    name: "assignmentScope", 
    title: "Assignment Scope",
    description: "Assignment details, site contacts, and document review",
    icon: "fas fa-tasks"
  },
  {
    number: 3,
    name: "buildingAndSite",
    title: "Building & Site Observations", 
    description: "Building description and detailed site observations",
    icon: "fas fa-building"
  },
  {
    number: 4,
    name: "research",
    title: "Research",
    description: "Weather data and CoreLogic research findings",
    icon: "fas fa-search"
  },
  {
    number: 5,
    name: "discussionAndAnalysis",
    title: "Discussion & Analysis",
    description: "Technical analysis and engineering discussion",
    icon: "fas fa-comments"
  },
  {
    number: 6,
    name: "conclusions",
    title: "Conclusions",
    description: "Final conclusions and report completion",
    icon: "fas fa-check-circle"
  }
];

export interface WizardContextType {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  reportId: number | null;
  formData: any;
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateFormData: (stepName: string, data: any) => void;
  saveStep: (stepNumber: number, data: any, isCompleted?: boolean) => Promise<void>;
}

export interface StepRef<T = any> {
  save: () => Promise<void>;
  getValues: () => T;
}
