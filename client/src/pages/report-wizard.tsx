import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useFormPersistence } from "@/hooks/use-form-persistence";
import { FORM_STEPS } from "@/lib/types";

// Step Components
import { StepNavigation } from "@/components/wizard/step-navigation";
import { ProjectInformationStep } from "@/components/wizard/project-information";
import { SiteAnalysisStep } from "@/components/wizard/site-analysis";
import { DesignSpecificationsStep } from "@/components/wizard/design-specifications";
import { CalculationsStep } from "@/components/wizard/calculations";
import { ReviewAttachmentsStep } from "@/components/wizard/review-attachments";
import { SubmitReportStep } from "@/components/wizard/submit-report";

export default function ReportWizard() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  
  const reportId = id ? parseInt(id) : null;
  const { saveFormData, formatLastSaved } = useFormPersistence(reportId);

  // Fetch report data
  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ["/api/reports", reportId],
    enabled: !!reportId,
  });

  // Fetch form steps
  const { data: steps = [], isLoading: stepsLoading } = useQuery({
    queryKey: ["/api/reports", reportId, "steps"],
    enabled: !!reportId,
  });

  // Create new report mutation
  const createReportMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/reports", data);
      return response.json();
    },
    onSuccess: (newReport) => {
      setLocation(`/reports/${newReport.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create report. Please try again.",
        variant: "destructive",
      });
    },
  });

  // If no report ID, create a new report
  useEffect(() => {
    if (!reportId) {
      createReportMutation.mutate({
        title: "New Civil Engineering Report",
        reportType: "structural",
        status: "draft",
      });
    }
  }, [reportId]);

  if (!reportId || reportLoading || stepsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading report...</p>
        </div>
      </div>
    );
  }

  const completedSteps = steps.filter((step: any) => step.isCompleted).map((step: any) => step.stepNumber);
  const progress = Math.min((completedSteps.length / FORM_STEPS.length) * 100, 85);

  const getStepData = (stepNumber: number) => {
    const step = steps.find((s: any) => s.stepNumber === stepNumber);
    return step?.data || {};
  };

  const handleStepSubmit = async (stepNumber: number, data: any, goToNext: boolean = true) => {
    try {
      await saveFormData(stepNumber, data, true);
      
      if (goToNext && stepNumber < FORM_STEPS.length) {
        setCurrentStep(stepNumber + 1);
      }
    } catch (error) {
      console.error("Failed to save step:", error);
    }
  };

  const goToStep = (step: number) => {
    const maxAccessibleStep = Math.max(currentStep, Math.max(...completedSteps, 0) + 1);
    if (step <= maxAccessibleStep) {
      setCurrentStep(step);
    }
  };

  const currentStepConfig = FORM_STEPS.find(step => step.number === currentStep);

  const renderCurrentStep = () => {
    const stepData = getStepData(currentStep);
    
    switch (currentStep) {
      case 1:
        return (
          <ProjectInformationStep
            initialData={stepData}
            onSubmit={(data) => handleStepSubmit(1, data)}
            isFirstStep={true}
          />
        );
      case 2:
        return (
          <SiteAnalysisStep
            initialData={stepData}
            onSubmit={(data) => handleStepSubmit(2, data)}
            onPrevious={() => setCurrentStep(1)}
          />
        );
      case 3:
        return (
          <DesignSpecificationsStep
            initialData={stepData}
            onSubmit={(data) => handleStepSubmit(3, data)}
            onPrevious={() => setCurrentStep(2)}
          />
        );
      case 4:
        return (
          <CalculationsStep
            initialData={stepData}
            onSubmit={(data) => handleStepSubmit(4, data)}
            onPrevious={() => setCurrentStep(3)}
          />
        );
      case 5:
        return (
          <ReviewAttachmentsStep
            initialData={stepData}
            onSubmit={(data) => handleStepSubmit(5, data)}
            onPrevious={() => setCurrentStep(4)}
          />
        );
      case 6:
        return (
          <SubmitReportStep
            reportId={reportId}
            onPrevious={() => setCurrentStep(5)}
            formData={report?.formData || {}}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <i className="fas fa-hard-hat text-primary-600 text-2xl mr-3"></i>
                <span className="text-xl font-bold text-slate-900">CivilReports Pro</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-slate-600 hover:text-slate-900 transition-colors">
                <i className="far fa-bell text-lg"></i>
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">JD</span>
                </div>
                <span className="text-sm font-medium text-slate-700">John Doe, P.E.</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <StepNavigation
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={goToStep}
              progress={progress}
              lastSaved={formatLastSaved()}
            />
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              
              {/* Form Header */}
              <div className="px-8 py-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                      {currentStepConfig?.title}
                    </h1>
                    <p className="text-slate-600 mt-1">
                      {currentStepConfig?.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-500">Project ID</div>
                    <div className="font-mono text-sm font-semibold text-slate-900">
                      {report?.projectId}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-8">
                {renderCurrentStep()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
