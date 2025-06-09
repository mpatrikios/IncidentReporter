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
                "w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 text-left group",
                "hover:shadow-md",
                isCompleted && "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30",
                isCurrent && !isCompleted && "bg-primary/10 border border-primary/20 hover:bg-primary/20 shadow-md",
                !isCurrent && !isCompleted && isAccessible && "bg-muted/50 border border-border hover:bg-muted",
                !isAccessible && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className={cn(
                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                isCompleted && "bg-emerald-600 shadow-lg shadow-emerald-600/25",
                isCurrent && !isCompleted && "bg-primary shadow-lg shadow-primary/25", 
                !isCurrent && !isCompleted && "bg-muted-foreground/20 group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/25"
              )}>
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : isCurrent ? (
                  <Circle className="w-5 h-5 text-white fill-current" />
                ) : (
                  <span className={cn(
                    "text-sm font-bold transition-colors",
                    "text-muted-foreground group-hover:text-white"
                  )}>
                    {step.number}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "font-semibold text-sm transition-colors",
                  isCompleted && "text-emerald-700 dark:text-emerald-400",
                  isCurrent && !isCompleted && "text-primary",
                  !isCurrent && !isCompleted && "text-foreground group-hover:text-primary"
                )}>
                  {step.title}
                </div>
                <div className={cn(
                  "text-xs mt-1 transition-colors",
                  isCompleted && "text-emerald-600 dark:text-emerald-500",
                  isCurrent && !isCompleted && "text-primary/70",
                  !isCurrent && !isCompleted && "text-muted-foreground"
                )}>
                  {isCompleted ? "Completed" : isCurrent ? "In Progress" : step.description}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Save Indicator */}
      <div className="mt-8 pt-6 border-t border-border/50">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Auto-saved</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-500 truncate">{lastSaved}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
