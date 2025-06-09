import { cn } from "@/lib/utils";
import { CheckCircle, Clock, Circle } from "lucide-react";
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
    <div className="bg-card border-2 border-border rounded-2xl shadow-lg p-8 sticky top-24 animate-scale-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary/15 rounded-xl border border-primary/20">
          <Clock className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Report Progress</h2>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm font-medium text-muted-foreground mb-3">
          <span>Step {currentStep} of {FORM_STEPS.length}</span>
          <span className="text-primary font-semibold">{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-500 ease-out shadow-sm" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Navigation */}
      <nav className="space-y-2">
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
                "w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 text-left group border-2",
                "hover:shadow-md",
                isCompleted && "bg-blue-50 border-blue-300 hover:bg-blue-100 text-blue-800",
                isCurrent && !isCompleted && "bg-blue-100 border-blue-400 hover:bg-blue-200 shadow-md text-blue-900",
                !isCurrent && !isCompleted && isAccessible && "bg-white border-grey-200 hover:bg-grey-50 text-grey-700",
                !isAccessible && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className={cn(
                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border-2",
                isCompleted && "bg-blue-600 border-blue-700 text-white",
                isCurrent && !isCompleted && "bg-blue-700 border-blue-800 text-white", 
                !isCurrent && !isCompleted && "bg-grey-100 border-grey-300 text-grey-600 group-hover:bg-blue-600 group-hover:border-blue-700 group-hover:text-white"
              )}>
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : isCurrent ? (
                  <Circle className="w-5 h-5 fill-current" />
                ) : (
                  <span className="text-sm font-bold transition-colors">
                    {step.number}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">
                  {step.title}
                </div>
                <div className={cn(
                  "text-xs mt-1 transition-colors",
                  isCompleted && "text-blue-600",
                  isCurrent && !isCompleted && "text-blue-700",
                  !isCurrent && !isCompleted && "text-grey-600"
                )}>
                  {isCompleted ? "Completed" : isCurrent ? "In Progress" : step.description}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Save Indicator */}
      <div className="mt-8 pt-6 border-t-2 border-grey-200">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 border-2 border-blue-200">
          <div className="p-1.5 bg-blue-100 rounded-lg border border-blue-300">
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-blue-800">Auto-saved</div>
            <div className="text-xs text-blue-600 truncate">{lastSaved}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
