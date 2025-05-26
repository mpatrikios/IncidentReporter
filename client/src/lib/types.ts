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
    description: "Basic project details and client information",
    icon: "fas fa-clipboard-list"
  },
  {
    number: 2,
    name: "siteAnalysis", 
    title: "Site Analysis",
    description: "Site conditions and environmental factors",
    icon: "fas fa-map-marked-alt"
  },
  {
    number: 3,
    name: "designSpecifications",
    title: "Design Specifications", 
    description: "Technical requirements and design parameters",
    icon: "fas fa-drafting-compass"
  },
  {
    number: 4,
    name: "calculations",
    title: "Calculations",
    description: "Engineering calculations and analysis",
    icon: "fas fa-calculator"
  },
  {
    number: 5,
    name: "reviewAttachments",
    title: "Review & Attachments",
    description: "Supporting documents and final review",
    icon: "fas fa-paperclip"
  },
  {
    number: 6,
    name: "submitReport",
    title: "Submit Report",
    description: "Final submission and engineer assignment",
    icon: "fas fa-paper-plane"
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
