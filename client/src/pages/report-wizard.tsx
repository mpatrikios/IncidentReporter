import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useFormPersistence } from "@/hooks/use-form-persistence";
import { FORM_STEPS } from "@/lib/types";
import { Zap, User, Bell, Home, ChevronDown, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth, useLogout } from "@/hooks/useAuth";
import type { StepRef } from "@/lib/types";
import type { ProjectInformation } from "@shared/schema";
import type { AssignmentScope } from "@shared/schema";
import type { BuildingAndSite } from "@shared/schema";
import type { Research } from "@shared/schema";
import type { DiscussionAndAnalysis } from "@shared/schema";
import type { Conclusions } from "@shared/schema";
import type { FormStep } from "@shared/schema";
import type { Report } from "@shared/schema";

// Step Components
import { StepNavigation } from "@/components/wizard/step-navigation";
import { ProjectInformationStepTurboTax } from "@/components/wizard/project-information-turbotax";
import { AssignmentScopeStep } from "@/components/wizard/assignment-scope";
import { BuildingAndSiteStepTurboTax } from "@/components/wizard/building-and-site-turbotax";
import { ResearchStepTurboTax } from "@/components/wizard/research-turbotax";
import { DiscussionAndAnalysisStepTurboTax } from "@/components/wizard/discussion-and-analysis-turbotax";
import { ConclusionsStepTurboTax } from "@/components/wizard/conclusions-turbotax";
import { SubmitReportStep } from "@/components/wizard/submit-report";

export default function ReportWizard() {
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  const { user } = useAuth();
  const logout = useLogout();
  const stepRef = useRef<StepRef<any>>(null);
  
  // Handle both URL formats: /report-wizard?edit=123 and /reports/123
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const editReportId = urlParams.get('edit');
  const selectedTemplate = urlParams.get('template');
  const pathReportId = id; // From /reports/:id route
  const reportId = editReportId || pathReportId || null;
  
  
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
      setLocation(`/reports/${newReport._id}`);
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

  // Only create a new report if we're not editing an existing one
  useEffect(() => {
    // Add a small delay to ensure route params are fully loaded
    const timer = setTimeout(() => {
      if (!reportId && !editReportId && !pathReportId) {
        createReportMutation.mutate({
          title: "New Civil Engineering Report",
          reportType: "structural",
          status: "draft",
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [reportId, editReportId, pathReportId]);

  if (!reportId || reportLoading || stepsLoading) {
    return (
      <div className="loading-screen-container">
        <div className="loading-content-center">
          <div className="loading-spinner"></div>
          <p className="loading-message">Loading report wizard...</p>
        </div>
      </div>
    );
  }

  const getCurrentStepData = () => {
    return steps.find(step => step.stepNumber === currentStep)?.data || {};
  };

  const handleNext = () => {
    if (currentStep < FORM_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderCurrentStep = () => {
    const stepData = getCurrentStepData();
    
    switch (currentStep) {
      case 1:
        return <ProjectInformationStepTurboTax 
          ref={stepRef} 
          reportId={reportId} 
          initialData={stepData} 
          onSubmit={handleNext}
        />;
      case 2:
        return <AssignmentScopeStep 
          ref={stepRef} 
          reportId={reportId} 
          initialData={stepData} 
          onSubmit={handleNext}
          onPrevious={handlePrevious}
        />;
      case 3:
        return <BuildingAndSiteStepTurboTax 
          ref={stepRef} 
          reportId={reportId} 
          initialData={stepData} 
          onSubmit={handleNext}
        />;
      case 4:
        return <ResearchStepTurboTax 
          ref={stepRef} 
          reportId={reportId} 
          initialData={stepData} 
          onSubmit={handleNext}
          formData={report?.formData}
          steps={steps}
        />;
      case 5:
        return <DiscussionAndAnalysisStepTurboTax 
          ref={stepRef} 
          reportId={reportId} 
          initialData={stepData} 
          onSubmit={handleNext}
        />;
      case 6:
        return <ConclusionsStepTurboTax 
          ref={stepRef} 
          reportId={reportId} 
          initialData={stepData} 
          onSubmit={handleNext}
          initialTitle={report?.title}
          steps={steps}
        />;
      case 7:
        return <SubmitReportStep 
          reportId={reportId} 
          onPrevious={handlePrevious}
          formData={stepData}
          initialTitle={report?.title}
        />;
      default:
        return <ProjectInformationStepTurboTax 
          ref={stepRef} 
          reportId={reportId} 
          initialData={stepData} 
          onSubmit={handleNext}
        />;
    }
  };

  const handleLogout = () => {
    logout.mutate();
  };

  return (
    <div className="report-wizard-container">
      {/* Header */}
      <div className="wizard-header-sticky">
        <div className="header-content-wrapper">
          <div className="header-nav-bar">
            
            {/* Brand Section */}
            <button 
              onClick={() => setLocation("/")}
              className="brand-section hover:opacity-75 transition-opacity"
            >
              <div className="brand-icon-container">
                <Zap className="brand-icon" />
              </div>
              <div className="brand-text-container">
                <h1 className="brand-title">Engineering Suite</h1>
                <div className="brand-subtitle">Civil Engineering Documentation Platform</div>
              </div>
            </button>
            
            <div className="flex items-center gap-4">
              {selectedTemplate && (
                <Badge variant="secondary" className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 border border-blue-200">
                  {selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)} Report
                </Badge>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/")}
                className="flex items-center gap-2 border-border/50 hover:bg-primary/10 hover:border-primary/50 rounded-xl transition-all duration-300"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="user-profile-trigger">
                    <div className="profile-avatar-container">
                      <User className="profile-avatar-icon" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="profile-display-name">
                        {user?.fullName || user?.username}
                      </span>
                      {user?.isEngineer && (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs px-2 py-0.5 w-fit">
                          Licensed Engineer
                        </Badge>
                      )}
                    </div>
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
                    onClick={handleLogout}
                    disabled={logout.isPending}
                    className="logout-menu-item"
                  >
                    <LogOut className="logout-icon" />
                    {logout.isPending ? "Logging out..." : "Logout"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="wizard-main-content">
        <div className="wizard-layout-grid">
          {/* Sidebar */}
          <div className="wizard-sidebar-column">
            <StepNavigation 
              currentStep={currentStep} 
              completedSteps={[]}
              onStepClick={setCurrentStep}
              progress={(currentStep / FORM_STEPS.length) * 100}
              lastSaved={formatLastSaved() || ""}
            />
          </div>

          {/* Form Content */}
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