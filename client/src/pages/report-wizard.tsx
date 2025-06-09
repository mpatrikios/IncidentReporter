import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useFormPersistence } from "@/hooks/use-form-persistence";
import { FORM_STEPS } from "@/lib/types";
import { Zap, User, Bell, Home, ChevronDown, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth, useLogout } from "@/hooks/useAuth";
import type { StepRef } from "@/lib/types";
import type { ProjectInformation } from "@shared/schema";
import type { SiteAnalysis } from "@shared/schema";
import type { DesignSpecifications } from "@shared/schema";
import type { Calculations } from "@shared/schema";
import type { ReviewAttachments } from "@shared/schema";
import type { FormStep } from "@shared/schema";
import type { Report } from "@shared/schema";

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
  const { user } = useAuth();
  const logout = useLogout();
  const stepRef = useRef<StepRef<any>>(null);
  
  const reportId = id ? parseInt(id) : null;
  const { saveFormData, formatLastSaved } = useFormPersistence(reportId);

  // Fetch report data
  const { data: report, isLoading: reportLoading } = useQuery<Report>({
    queryKey: ["/api/reports", reportId],
    enabled: !!reportId,
  });

  // Fetch form steps
  const { data: steps = [] as FormStep[], isLoading: stepsLoading } = useQuery<FormStep[]>({
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

  const completedSteps = steps.filter(step => step.isCompleted).map(step => step.stepNumber);
  const progress = Math.min((completedSteps.length / FORM_STEPS.length) * 100, 85);

  const getStepData = (stepNumber: number) => {
    const step = steps.find(s => s.stepNumber === stepNumber);
    return step?.data || {};
  };

  const handleStepSubmit = async (stepNumber: number, data: any, goToNext: boolean = true) => {
    try {
      // Save as partial data when navigating between steps, full validation only on final submit
      await saveFormData(stepNumber, data, false);
      
      // Wait for the save to complete before switching steps
      if (goToNext && stepNumber < FORM_STEPS.length) {
        // Invalidate the steps query to ensure fresh data
        await queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "steps"] });
        setCurrentStep(stepNumber + 1);
      }
    } catch (error) {
      console.error("Failed to save step:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const goToStep = async (step: number) => {
    try {
      // Save current step data before switching
      if (stepRef.current?.save) {
        await stepRef.current.save();
      }
      
      // Invalidate the steps query to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "steps"] });
      setCurrentStep(step);
    } catch (error) {
      console.error("Failed to save step before switching:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const currentStepConfig = FORM_STEPS.find(step => step.number === currentStep);

  const renderCurrentStep = () => {
    const stepData = getStepData(currentStep);
    
    switch (currentStep) {
      case 1:
        return (
          <ProjectInformationStep
            ref={stepRef as React.RefObject<StepRef<ProjectInformation>>}
            initialData={stepData}
            onSubmit={(data) => handleStepSubmit(1, data)}
            isFirstStep={true}
            reportId={reportId}
          />
        );
      case 2:
        return (
          <SiteAnalysisStep
            ref={stepRef as React.RefObject<StepRef<SiteAnalysis>>}
            initialData={stepData}
            onSubmit={(data) => handleStepSubmit(2, data)}
            onPrevious={() => setCurrentStep(1)}
            reportId={reportId}
          />
        );
      case 3:
        return (
          <DesignSpecificationsStep
            ref={stepRef as React.RefObject<StepRef<DesignSpecifications>>}
            initialData={stepData}
            onSubmit={(data) => handleStepSubmit(3, data)}
            onPrevious={() => setCurrentStep(2)}
            reportId={reportId}
          />
        );
      case 4:
        return (
          <CalculationsStep
            ref={stepRef as React.RefObject<StepRef<Calculations>>}
            initialData={stepData}
            onSubmit={(data) => handleStepSubmit(4, data)}
            onPrevious={() => setCurrentStep(3)}
            reportId={reportId}
          />
        );
      case 5:
        return (
          <ReviewAttachmentsStep
            ref={stepRef as React.RefObject<StepRef<ReviewAttachments>>}
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
            formData={report?.formData || {} as Record<string, any>}
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
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-3 px-4 py-2 rounded-xl bg-grey-50 border-2 border-grey-200 hover:bg-grey-100 hover:border-grey-300">
                    <div className="p-1.5 bg-blue-100 rounded-lg border border-blue-200">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-semibold text-grey-900">{user?.fullName || user?.username}, P.E.</span>
                    <ChevronDown className="h-4 w-4 text-grey-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-white border-2 border-grey-200 shadow-lg">
                  <div className="px-4 py-4">
                    <p className="text-sm font-semibold text-grey-900">{user?.fullName || user?.username}</p>
                    <p className="text-xs text-grey-600">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-grey-200" />
                  <DropdownMenuItem 
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Step Navigation */}
          <div className="lg:col-span-1">
            <StepNavigation
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={goToStep}
              progress={progress}
              lastSaved={formatLastSaved()}
            />
          </div>

          {/* Step Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-border p-8">
              {renderCurrentStep()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
