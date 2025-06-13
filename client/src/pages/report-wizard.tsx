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
import { ProjectInformationStep } from "@/components/wizard/project-information";
import { AssignmentScopeStep } from "@/components/wizard/assignment-scope";
import { BuildingAndSiteStep } from "@/components/wizard/building-and-site";
import { ResearchStep } from "@/components/wizard/research";
import { DiscussionAndAnalysisStep } from "@/components/wizard/discussion-and-analysis";
import { ConclusionsStep } from "@/components/wizard/conclusions";
import { SubmitReportStep } from "@/components/wizard/submit-report";

export default function ReportWizard() {
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  const { user } = useAuth();
  const logout = useLogout();
  const stepRef = useRef<StepRef<any>>(null);
  
  // Handle both direct report ID and edit parameter
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const editReportId = urlParams.get('edit');
  const reportId = editReportId ? parseInt(editReportId) : (id ? parseInt(id) : null);
  
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
          <AssignmentScopeStep
            ref={stepRef as React.RefObject<StepRef<AssignmentScope>>}
            initialData={stepData}
            onSubmit={(data) => handleStepSubmit(2, data)}
            onPrevious={() => goToStep(1)}
            reportId={reportId}
          />
        );
      case 3:
        return (
          <BuildingAndSiteStep
            ref={stepRef as React.RefObject<StepRef<BuildingAndSite>>}
            initialData={stepData}
            onSubmit={(data) => handleStepSubmit(3, data)}
            onPrevious={() => goToStep(2)}
            reportId={reportId}
          />
        );
      case 4:
        return (
          <ResearchStep
            ref={stepRef as React.RefObject<StepRef<Research>>}
            initialData={stepData}
            onSubmit={(data) => handleStepSubmit(4, data)}
            onPrevious={() => goToStep(3)}
            reportId={reportId}
          />
        );
      case 5:
        return (
          <DiscussionAndAnalysisStep
            ref={stepRef as React.RefObject<StepRef<DiscussionAndAnalysis>>}
            initialData={stepData}
            onSubmit={(data) => handleStepSubmit(5, data)}
            onPrevious={() => goToStep(4)}
            reportId={reportId}
          />
        );
      case 6:
        return (
          <ConclusionsStep
            ref={stepRef as React.RefObject<StepRef<Conclusions>>}
            initialData={stepData}
            onSubmit={(data) => handleStepSubmit(6, data)}
            onPrevious={() => goToStep(5)}
            reportId={reportId}
            formData={report?.formData || {} as Record<string, any>}
            initialTitle={report?.title || ""}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Consistent Header from Home Page */}
      <div className="bg-white border-b-2 border-grey-200 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl border-2 border-blue-200">
                <Zap className="h-7 w-7 text-blue-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-blue-700">
                  Engineering Suite
                </h1>
                <div className="text-xs text-grey-600 font-medium">
                  Civil Engineering Documentation Platform
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/")}
                className="flex items-center gap-2 border-2 border-grey-300 text-grey-700 hover:bg-grey-100"
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
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold text-grey-900">
                        {user?.fullName || user?.username}
                      </span>
                      {user?.isEngineer && (
                        <span className="bg-blue-100 text-blue-700 border border-blue-200 text-xs px-2 py-0.5 rounded">
                          Licensed Engineer
                        </span>
                      )}
                    </div>
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
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer px-4 py-3"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {logout.isPending ? "Logging out..." : "Logout"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
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
            <div className="bg-white rounded-lg shadow-lg p-8">
              {renderCurrentStep()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
