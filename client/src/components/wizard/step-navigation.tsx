import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";
import { FORM_STEPS } from "@/lib/types";

interface StepNavigationProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
  progress: number;
  lastSaved: string;
}

export function StepNavigation({ 
  currentStep, 
  completedSteps, 
  onStepClick, 
  progress,
  lastSaved 
}: StepNavigationProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Report Progress</h2>
      
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-slate-600 mb-2">
          <span>Step {currentStep} of {FORM_STEPS.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Navigation */}
      <nav className="space-y-1">
        {FORM_STEPS.map((step) => {
          const isCompleted = completedSteps.includes(step.number);
          const isCurrent = currentStep === step.number;
          const isAccessible = true; // Allow access to all steps

          return (
            <button
              key={step.number}
              onClick={() => isAccessible && onStepClick(step.number)}
              disabled={!isAccessible}
              className={cn(
                "w-full flex items-center p-3 rounded-lg transition-colors text-left",
                isCompleted && "bg-emerald-50 border border-emerald-200",
                isCurrent && !isCompleted && "bg-primary-50 border border-primary-200",
                !isCurrent && !isCompleted && isAccessible && "hover:bg-slate-50",
                !isAccessible && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className={cn(
                "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3",
                isCompleted && "bg-emerald-600",
                isCurrent && !isCompleted && "bg-primary-600", 
                !isCurrent && !isCompleted && "bg-slate-300"
              )}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  <span className={cn(
                    "text-xs font-bold",
                    isCurrent ? "text-white" : "text-slate-600"
                  )}>
                    {step.number}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-sm font-medium",
                isCompleted && "text-emerald-800",
                isCurrent && !isCompleted && "text-primary-800",
                !isCurrent && !isCompleted && "text-slate-600"
              )}>
                {step.title}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Save Indicator */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <div className="flex items-center text-sm text-slate-600">
          <i className="fas fa-save text-emerald-500 mr-2"></i>
          <span>{lastSaved}</span>
        </div>
      </div>
    </div>
  );
}
