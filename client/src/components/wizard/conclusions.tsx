import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { conclusionsSchema, type Conclusions } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, FileText, Save, Clock } from "lucide-react";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useEffect, forwardRef, useImperativeHandle } from "react";
import type { StepRef } from "@/lib/types";
import { useLocation } from "wouter";

interface ConclusionsProps {
  initialData?: Partial<Conclusions>;
  onSubmit: (data: Conclusions) => void;
  onPrevious?: () => void;
  reportId?: number | null;
  formData?: any;
  initialTitle?: string;
  steps?: any[];
}

export const ConclusionsStep = forwardRef<StepRef<Conclusions>, ConclusionsProps>(({ 
  initialData, 
  onSubmit, 
  onPrevious,
  reportId,
  formData: _formData,
  initialTitle,
  steps
}, ref) => {
  const [reportTitle, setReportTitle] = useState(initialTitle || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<Conclusions>({
    resolver: zodResolver(conclusionsSchema),
    defaultValues: {
      conclusions: "",
      ...initialData,
    },
  });

  useImperativeHandle(ref, () => ({
    save: async () => {
      const isValid = await form.trigger();
      if (isValid) {
        const values = form.getValues();
        onSubmit(values);
      }
    },
    getValues: () => form.getValues(),
  }));

  const { isSaving: isAutoSaving } = useAutoSave(reportId, 6, form.watch());

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      form.reset({
        conclusions: "",
        ...initialData,
      });
    }
  }, [initialData, form]);

  const handleGenerateDoc = async () => {
    console.log('DEBUG: Starting Google Doc generation for report ID:', reportId);
    setIsGeneratingDoc(true);
    try {
      console.log('DEBUG: Making API request to generate doc...');
      const response = await apiRequest("POST", `/api/reports/${reportId}/generate-doc`);
      console.log('DEBUG: Raw API response:', response);
      
      const data = await response.json();
      console.log('DEBUG: Parsed response data:', data);
      
      if (data.documentUrl) {
        console.log('DEBUG: Opening document URL:', data.documentUrl);
        window.open(data.documentUrl, '_blank');
      } else {
        console.log('DEBUG: No documentUrl in response');
      }
      
      toast({
        title: "Document Generated",
        description: "Google Doc has been generated successfully.",
      });
    } catch (error: any) {
      console.error('DEBUG: Error during doc generation:', error);
      if (error.message?.includes('not authenticated')) {
        toast({
          title: "Authentication Required",
          description: "Please authenticate with Google first.",
          variant: "destructive",
        });
        // Optionally redirect to auth  
        if (error.authUrl) {
          window.open(error.authUrl, '_blank');
        }
      } else {
        toast({
          title: "Generation Failed",
          description: error.message || "Failed to generate Google Doc. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  const handleSaveReport = async () => {
    if (!reportTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your report.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await apiRequest("POST", `/api/reports/${reportId}/save`, {
        title: reportTitle.trim(),
      });
      
      toast({
        title: "Report Saved",
        description: "Your report has been saved successfully.",
      });

      // Navigate back to dashboard after successful save
      setTimeout(() => {
        setLocation("/");
      }, 1000); // Small delay to show the success toast
      
    } catch (error) {
      toast({
        title: "Save Failed", 
        description: "Failed to save report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Check completion based on steps data instead of formData
  const getStepData = (stepNumber: number) => {
    return steps?.find(s => s.stepNumber === stepNumber)?.data || {};
  };

  const hasRequiredData = (stepNumber: number, requiredFields: string[]) => {
    const stepData = getStepData(stepNumber);
    return requiredFields.every(field => {
      const value = stepData[field];
      return value && value.toString().trim().length > 0;
    });
  };

  const hasAnyData = (stepNumber: number, fields: string[]) => {
    const stepData = getStepData(stepNumber);
    return fields.some(field => {
      const value = stepData[field];
      return value && value.toString().trim().length > 0;
    });
  };

  const completedSections = [
    { 
      name: "Project Information", 
      completed: hasRequiredData(1, ['insuredName', 'insuredAddress', 'fileNumber', 'claimNumber', 'clientCompany', 'clientContactName', 'clientEmail', 'dateOfLoss', 'siteVisitDate', 'engineerName']) 
    },
    { 
      name: "Assignment Scope", 
      completed: hasRequiredData(2, ['assignmentScope']) 
    },
    { 
      name: "Building & Site Observations", 
      completed: hasRequiredData(3, ['buildingDescription']) 
    },
    { 
      name: "Research", 
      completed: hasAnyData(4, ['weatherDataSummary', 'corelogicDataSummary']) 
    },
    { 
      name: "Discussion & Analysis", 
      completed: hasRequiredData(5, ['discussionAndAnalysis']) 
    },
  ];

  const allSectionsComplete = completedSections.every(section => section.completed);

  // Debug logging
  console.log("Steps data:", steps);
  console.log("Completed sections:", completedSections);
  console.log("All sections complete:", allSectionsComplete);

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = form.getValues();
          onSubmit(formData);
        }} className="space-y-8">
          
          {/* Conclusions */}
          <div className="bg-green-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-check-circle text-green-600 mr-2"></i>
              Conclusions
            </h3>
            
            <FormField
              control={form.control}
              name="conclusions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
                    Conclusions <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Provide clear, concise conclusions based on your investigation and analysis. Include:

• Summary of key findings
• Final determination regarding cause of damage
• Professional engineering opinion
• Any recommendations for remediation or further investigation..."
                      rows={8}
                      className="px-4 py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Completion Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <CheckCircle className="mr-2 h-5 w-5 text-emerald-600" />
                Report Completion Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completedSections.map((section, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      section.completed ? "bg-emerald-600" : "bg-slate-300"
                    }`}>
                      {section.completed && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-sm ${
                      section.completed ? "text-slate-900" : "text-slate-500"
                    }`}>
                      {section.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Document Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <FileText className="mr-2 h-5 w-5 text-primary-600" />
                Document Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Generate a Google Doc version of your report for easy sharing and printing.
              </p>
              <Button
                type="button"
                onClick={handleGenerateDoc}
                disabled={!allSectionsComplete || isGeneratingDoc}
                className="w-full"
                variant="outline"
              >
                {isGeneratingDoc ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Generating Document...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Google Doc
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Save Report */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Save className="mr-2 h-5 w-5 text-primary-600" />
                Save Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <FormLabel className="text-sm font-medium text-slate-700">
                  Report Title <span className="text-red-500">*</span>
                </FormLabel>
                <Input
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Enter a descriptive title for your report..."
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  This title will be used to identify your report on the dashboard.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              className="flex items-center px-6 py-3"
            >
              <i className="fas fa-chevron-left mr-2"></i>
              Previous: Discussion & Analysis
            </Button>
            
            <Button
              type="button"
              onClick={handleSaveReport}
              disabled={!allSectionsComplete || !reportTitle.trim() || isSaving}
              className="flex items-center px-8 py-3 bg-primary-600 hover:bg-primary-700"
            >
              {isSaving ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Report
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
});