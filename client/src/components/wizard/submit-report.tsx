import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, FileText, Send, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SubmitReportProps {
  reportId: number;
  onPrevious: () => void;
  formData: any;
}

export function SubmitReportStep({ reportId, onPrevious, formData }: SubmitReportProps) {
  const [selectedEngineer, setSelectedEngineer] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const { toast } = useToast();

  const engineers = [
    { id: "1", name: "John Doe, P.E.", specialty: "Structural Engineering" },
    { id: "2", name: "Jane Smith, P.E.", specialty: "Geotechnical Engineering" },
    { id: "3", name: "Mike Johnson, P.E.", specialty: "Transportation Engineering" },
  ];

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

  const handleSubmit = async () => {
    if (!selectedEngineer) {
      toast({
        title: "Engineer Required",
        description: "Please select an engineer for review.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", `/api/reports/${reportId}/submit`, {
        assignedEngineer: parseInt(selectedEngineer),
        reviewNotes,
      });
      
      toast({
        title: "Report Submitted",
        description: "Your report has been submitted for engineer review.",
      });
      
      // In a real app, this would redirect to a confirmation page
    } catch (error) {
      toast({
        title: "Submission Failed", 
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
            Generate a Google Doc version of your report before submitting for review.
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

      {/* Engineer Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Send className="mr-2 h-5 w-5 text-primary-600" />
            Engineer Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="engineer" className="text-sm font-medium text-slate-700">
              Assign to Engineer <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedEngineer} onValueChange={setSelectedEngineer}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select an engineer for review..." />
              </SelectTrigger>
              <SelectContent>
                {engineers.map((engineer) => (
                  <SelectItem key={engineer.id} value={engineer.id}>
                    <div>
                      <div className="font-medium">{engineer.name}</div>
                      <div className="text-sm text-slate-600">{engineer.specialty}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-slate-700">
              Review Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add any specific notes or requirements for the reviewing engineer..."
              rows={3}
              className="mt-1"
            />
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
          onClick={handleSubmit}
          disabled={!allSectionsComplete || !selectedEngineer || isSubmitting}
          className="flex items-center px-8 py-3 bg-primary-600 hover:bg-primary-700"
        >
          {isSubmitting ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Report
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
              <h3 className="text-sm font-semibold text-blue-900 mb-2">What happens next?</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>After submitting your report:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>The assigned engineer will receive an email notification</li>
                  <li>They will review your report and provide feedback</li>
                  <li>You'll be notified once the review is complete</li>
                  <li>Any required revisions will be communicated back to you</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
