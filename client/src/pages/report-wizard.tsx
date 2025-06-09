import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useFormPersistence } from "@/hooks/use-form-persistence";
import { FORM_STEPS } from "@/lib/types";
import { Zap, User, Bell, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      // Save as partial data when navigating between steps, full validation only on final submit
      await saveFormData(stepNumber, data, false);
      
      if (goToNext && stepNumber < FORM_STEPS.length) {
        setCurrentStep(stepNumber + 1);
      }
    } catch (error) {
      console.error("Failed to save step:", error);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
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
            reportId={reportId}
          />
        );
      case 2:
        return (
          <SiteAnalysisStep
            initialData={stepData}
            onSubmit={(data) => handleStepSubmit(2, data)}
            onPrevious={() => setCurrentStep(1)}
            reportId={reportId}
          />
        );
      case 3:
        return (
          <DesignSpecificationsStep
            initialData={stepData}
            onSubmit={(data) => handleStepSubmit(3, data)}
            onPrevious={() => setCurrentStep(2)}
            reportId={reportId}
          />
        );
      case 4:
        return (
          <CalculationsStep
            initialData={stepData}
            onSubmit={(data) => handleStepSubmit(4, data)}
            onPrevious={() => setCurrentStep(3)}
            reportId={reportId}
          />
        );
      case 5:
        return (
          <ReviewAttachmentsStep
            initialData={stepData}
            onSubmit={(data) => handleStepSubmit(5, data)}
            onPrevious={() => setCurrentStep(4)}
            reportId={reportId}
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
    <div className="min-h-screen">
      {/* Modern Header */}
      <header className="bg-white border-b-2 border-grey-200 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-18 py-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl border-2 border-blue-200">
                <Zap className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <span className="text-xl font-bold text-blue-700">Engineering Suite</span>
                <div className="text-xs text-grey-600 font-medium">Report Builder</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/")}
                className="gap-2 border-2 border-grey-300 text-grey-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-grey-50 border-2 border-grey-200">
                <div className="p-1.5 bg-blue-100 rounded-lg border border-blue-200">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-grey-900">John Doe, P.E.</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
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
            <div className="bg-white border-2 border-grey-200 shadow-lg rounded-xl overflow-hidden animate-fade-in">
              
              {/* Form Header */}
              <div className="px-8 py-6 border-b-2 border-grey-200 bg-grey-50">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-grey-900">
                      {currentStepConfig?.title}
                    </h1>
                    <p className="text-grey-700 text-lg">
                      {currentStepConfig?.description}
                    </p>
                  </div>
                  <div className="text-right px-4 py-3 rounded-xl bg-blue-50 border-2 border-blue-200">
                    <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Project ID</div>
                    <div className="font-mono text-sm font-bold text-blue-800 mt-1">
                      PRJ-001
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-8 bg-white">
                {renderCurrentStep()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
