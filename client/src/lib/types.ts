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
    description: "Report details, insured info, loss information, and engineering team",
    icon: "fas fa-file-alt"
  },
  {
    number: 2,
    name: "assignmentScope", 
    title: "Methodology",
    description: "Investigation methodology, interviewees, and document review",
    icon: "fas fa-clipboard-list"
  },
  {
    number: 3,
    name: "buildingAndSite",
    title: "Background & Observations", 
    description: "Building background, system description, and site observations",
    icon: "fas fa-building"
  },
  {
    number: 4,
    name: "research",
    title: "Research",
    description: "Weather conditions, CoreLogic hail and wind verification reports",
    icon: "fas fa-chart-bar"
  },
  {
    number: 5,
    name: "discussionAndAnalysis",
    title: "Discussion & Analysis",
    description: "Site analysis, weather discussion, impact analysis, and recommendations",
    icon: "fas fa-comments"
  },
  {
    number: 6,
    name: "conclusions",
    title: "Conclusions",
    description: "Final engineering conclusions and report completion",
    icon: "fas fa-check-circle"
  }
];

export interface WizardContextType {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  reportId: string | null;
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
