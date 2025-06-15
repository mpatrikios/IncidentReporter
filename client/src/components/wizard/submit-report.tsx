import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, FileText, Save, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useAutoSave } from "@/hooks/use-auto-save";

interface SubmitReportProps {
  reportId: string;
  onPrevious: () => void;
  formData: any;
  initialTitle?: string;
}

export function SubmitReportStep({ reportId, onPrevious, formData, initialTitle }: SubmitReportProps) {
  const [reportTitle, setReportTitle] = useState(initialTitle || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
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


  const handleGenerateDoc = async () => {
    setIsGeneratingDoc(true);
    try {
      await apiRequest("POST", `/api/reports/${reportId}/generate-doc`);
      toast({
        title: "Document Generated",
        description: "Google Doc has been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate Google Doc. Please try again.",
        variant: "destructive",
      });
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

  const completedSections = [
    { name: "Project Information", completed: !!formData?.projectInformation },
    { name: "Site Analysis", completed: !!formData?.siteAnalysis },
    { name: "Design Specifications", completed: !!formData?.designSpecifications },
    { name: "Calculations", completed: !!formData?.calculations },
    { name: "Review & Attachments", completed: !!formData?.reviewAttachments },
  ];

  const allSectionsComplete = completedSections.every(section => section.completed);

  return (
    <div className="space-y-8">
      
      {/* Report Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary-600" />
            Report Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-slate-700">Project Name</Label>
              <p className="text-slate-900">{formData?.projectInformation?.projectName || "Not specified"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Report Type</Label>
              <p className="text-slate-900 capitalize">{formData?.designSpecifications?.designType || "Not specified"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Client</Label>
              <p className="text-slate-900">{formData?.projectInformation?.clientName || "Not specified"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Project Manager</Label>
              <p className="text-slate-900">{formData?.projectInformation?.projectManager || "Not specified"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-emerald-600" />
            Completion Status
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
          
          {!allSectionsComplete && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Please complete all sections before submitting your report.
              </p>
            </div>
          )}
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

      {/* Report Title */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Save className="mr-2 h-5 w-5 text-primary-600" />
            Save Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-slate-700">
              Report Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
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

      {/* Form Actions */}
      <div className="flex justify-between items-center pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          className="flex items-center px-6 py-3"
        >
          <i className="fas fa-chevron-left mr-2"></i>
          Previous: Review & Attachments
        </Button>
        
        <Button
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

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start">
            <i className="fas fa-info-circle text-blue-500 mt-1 mr-3"></i>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-2">What happens after saving?</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>After saving your report:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Your report will be saved to your dashboard</li>
                  <li>You can view and edit it anytime from "My Reports"</li>
                  <li>Generate Google Docs for easy sharing</li>
                  <li>Your work is automatically preserved</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
