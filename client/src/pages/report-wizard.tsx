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
  const { data: steps = [] as FormStep[], isLoading: stepsLoading, refetch: refetchSteps } = useQuery<FormStep[]>({
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
      <div className="loading-screen-container">
        <div className="loading-content-center">
          <div className="loading-spinner"></div>
          <p className="loading-message">Loading report...</p>
        </div>
      </div>
    );
  }

  const completedSteps = steps.filter(step => step.isCompleted).map(step => step.stepNumber);
  const progress = Math.min((completedSteps.length / FORM_STEPS.length) * 100, 85);

  const getStepData = (stepNumber: number) => {
    console.log(`All steps:`, steps);
    const step = steps.find(s => s.stepNumber === stepNumber);
    console.log(`Found step ${stepNumber}:`, step);
    const data = step?.data || {};
    console.log(`Getting data for step ${stepNumber}:`, data);
    return data;
  };

  const handleStepSubmit = async (stepNumber: number, data: any, goToNext: boolean = true) => {
    try {
      console.log(`Submitting step ${stepNumber} with data:`, data);
      // Save as partial data when navigating between steps, full validation only on final submit
      await saveFormData(stepNumber, data, false);
      
      // Wait for the save to complete before switching steps
      if (goToNext && stepNumber < FORM_STEPS.length) {
        console.log(`Moving to step ${stepNumber + 1}`);
        // Wait for save and force refetch fresh data
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log("Refetching steps data...");
        const result = await refetchSteps();
        console.log("Refetch result:", result);
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
      console.log(`Going from step ${currentStep} to step ${step}`);
      // Save current step data before switching
      if (stepRef.current?.getValues) {
        const currentData = stepRef.current.getValues();
        console.log(`Current step ${currentStep} data:`, currentData);
        // Only save if there's meaningful data
        const hasContent = Object.values(currentData).some(value => 
          value !== "" && value !== null && value !== undefined && 
          (Array.isArray(value) ? value.length > 0 : true)
        );
        
        console.log(`Has content: ${hasContent}`);
        if (hasContent) {
          console.log(`Saving current step ${currentStep} data before switching`);
          await saveFormData(currentStep, currentData, false);
          // Wait longer to ensure save completes
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Force refetch of steps data
      console.log("Refetching steps data in goToStep...");
      const result = await refetchSteps();
      console.log("GoToStep refetch result:", result);
      
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


  const renderCurrentStep = () => {
    const stepData = getStepData(currentStep);
    console.log(`Rendering step ${currentStep} with initialData:`, stepData);
    
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
            onPrevious={() => goToStep(1)}
            reportId={reportId}
          />
        );
      case 3:
        return (
          <DesignSpecificationsStep
            ref={stepRef as React.RefObject<StepRef<DesignSpecifications>>}
            initialData={stepData}
            onSubmit={(data) => handleStepSubmit(3, data)}
            onPrevious={() => goToStep(2)}
            reportId={reportId}
          />
        );
      case 4:
        return (
          <CalculationsStep
            ref={stepRef as React.RefObject<StepRef<Calculations>>}
            initialData={stepData}
            onSubmit={(data) => handleStepSubmit(4, data)}
            onPrevious={() => goToStep(3)}
            reportId={reportId}
          />
        );
      case 5:
        return (
          <ReviewAttachmentsStep
            ref={stepRef as React.RefObject<StepRef<ReviewAttachments>>}
            initialData={stepData}
            onSubmit={(data) => handleStepSubmit(5, data)}
            onPrevious={() => goToStep(4)}
            reportId={reportId}
          />
        );
      case 6:
        return (
          <SubmitReportStep
            reportId={reportId}
            onPrevious={() => goToStep(5)}
            formData={report?.formData || {} as Record<string, any>}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="report-wizard-container">
      {/* Modern Header */}
      <header className="wizard-header-sticky">
        <div className="header-content-wrapper">
          <div className="header-nav-bar">
            <div className="brand-section">
              <div className="brand-icon-container">
                <Zap className="brand-icon" />
              </div>
              <div className="brand-text-container">
                <span className="brand-title">Engineering Suite</span>
                <div className="brand-subtitle">Report Builder</div>
              </div>
            </div>
            <div className="header-actions">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/")}
                className="dashboard-nav-button"
              >
                <Home className="nav-button-icon" />
                Dashboard
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="user-profile-trigger">
                    <div className="profile-avatar-container">
                      <User className="profile-avatar-icon" />
                    </div>
                    <span className="profile-display-name">{user?.fullName || user?.username}, P.E.</span>
                    <ChevronDown className="profile-dropdown-icon" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="profile-dropdown-menu">
                  <div className="profile-info-section">
                    <p className="profile-name">{user?.fullName || user?.username}</p>
                    <p className="profile-email">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator className="profile-menu-separator" />
                  <DropdownMenuItem 
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                    className="logout-menu-item"
                  >
                    <LogOut className="logout-icon" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="wizard-main-content">
        <div className="wizard-layout-grid">
          {/* Step Navigation */}
          <div className="wizard-sidebar-column">
            <StepNavigation
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={goToStep}
              progress={progress}
              lastSaved={formatLastSaved()}
            />
          </div>

          {/* Step Content */}
          <div className="wizard-content-column">
            <div className="wizard-step-container">
              {renderCurrentStep()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
