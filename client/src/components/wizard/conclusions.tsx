import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { conclusionsSchema, type Conclusions } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, FileText, Save, Clock, Wand2 } from "lucide-react";
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
  reportId?: string | null;
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
  const [aiEnhanceText, setAiEnhanceText] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Auto-save the title directly to the report record
  useEffect(() => {
    if (!reportTitle.trim() || reportTitle === initialTitle) return;
    
    const timeoutId = setTimeout(async () => {
      try {
        await apiRequest("PATCH", `/api/reports/${reportId}`, {
          title: reportTitle.trim(),
        });
      } catch (error) {
        console.error("Failed to auto-save title:", error);
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [reportTitle, reportId, initialTitle]);

  // Update title when initialTitle changes
  useEffect(() => {
    if (initialTitle) {
      setReportTitle(initialTitle);
    }
  }, [initialTitle]);

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
      const response = await apiRequest("POST", `/api/reports/${reportId}/generate-doc`, {
        aiEnhanceText
      });
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
      completed: hasRequiredData(1, ['insuredName', 'insuredAddress', 'fileNumber', 'claimNumber', 'clientCompany', 'clientContact', 'dateOfLoss', 'siteVisitDate', 'engineerName']) 
    },
    { 
      name: "Assignment Scope", 
      completed: hasAnyData(2, ['intervieweesNames', 'providedDocumentsTitles', 'additionalMethodologyNotes']) 
    },
    { 
      name: "Building & Site Observations", 
      completed: hasRequiredData(3, ['buildingSystemDescription', 'exteriorObservations', 'interiorObservations']) 
    },
    { 
      name: "Research", 
      completed: hasRequiredData(4, ['weatherDataSummary', 'corelogicHailSummary', 'corelogicWindSummary']) 
    },
    { 
      name: "Discussion & Analysis", 
      completed: hasRequiredData(5, ['siteDiscussionAnalysis', 'weatherDiscussionAnalysis', 'weatherImpactAnalysis']) 
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
                      placeholder="Provide clear, concise conclusions based on your investigation and analysis. You can use bullet points - they will be converted to professional paragraphs when generating the Google Doc (if AI enhancement is enabled):

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
              
              {/* AI Enhancement Option */}
              <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Checkbox
                  id="ai-enhance"
                  checked={aiEnhanceText}
                  onCheckedChange={(checked) => setAiEnhanceText(checked === true)}
                />
                <div className="flex-1">
                  <label
                    htmlFor="ai-enhance"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center"
                  >
                    <Wand2 className="h-4 w-4 mr-2 text-blue-600" />
                    AI-enhance bullet points into professional paragraphs
                  </label>
                  <p className="text-xs text-slate-600 mt-1 ml-6">
                    Convert bullet points in long-form fields to polished, professional paragraphs using AI
                  </p>
                </div>
              </div>
              
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