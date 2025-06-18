import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assignmentScopeSchema, type AssignmentScope } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileUpload, type UploadedFile } from "@/components/ui/file-upload";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useEffect, forwardRef, useImperativeHandle, useState } from "react";
import type { StepRef } from "@/lib/types";

interface AssignmentScopeProps {
  initialData?: Partial<AssignmentScope>;
  onSubmit: (data: AssignmentScope) => void;
  onPrevious?: () => void;
  reportId?: string | null;
}

export const AssignmentScopeStep = forwardRef<StepRef<AssignmentScope>, AssignmentScopeProps>(({ 
  initialData, 
  onSubmit, 
  onPrevious,
  reportId 
}, ref) => {
  const form = useForm<AssignmentScope>({
    resolver: zodResolver(assignmentScopeSchema),
    defaultValues: {
      intervieweesNames: "",
      providedDocumentsTitles: "",
      additionalMethodologyNotes: "",
      ...initialData,
    },
  });

  // File upload state
  const [documentFiles, setDocumentFiles] = useState<UploadedFile[]>([]);

  // Expose save method to parent
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

  // Auto-save form data as user types
  const { isSaving } = useAutoSave(reportId, 2, form.watch());

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      form.reset({
        intervieweesNames: "",
        providedDocumentsTitles: "",
        additionalMethodologyNotes: "",
        ...initialData,
      });
    }
  }, [initialData, form]);

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={(e) => {
          e.preventDefault();
          // Allow navigation without validation - just submit current form data
          const formData = form.getValues();
          onSubmit(formData);
        }} className="space-y-8">
          
          {/* Methodology Overview */}
          <div className="bg-blue-50 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-clipboard-list text-blue-600 mr-2"></i>
              Methodology
            </h3>
            
            <div className="text-sm text-slate-700 space-y-2">
              <p><strong>The collection and analysis of information for this project followed an application of engineering principles to the investigation analysis.</strong></p>
              
              <p><strong>The procedures followed included:</strong></p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Upon receipt of the assignment, a site examination was conducted</li>
                <li>Personnel were interviewed during the assessment</li>
                <li>Provided documents were reviewed</li>
                <li>Historical weather data was researched to determine size and location of the storm on the date of loss</li>
                <li>This written report was authored at the client's request</li>
              </ul>
            </div>
          </div>

          {/* Interviewees */}
          <div className="bg-green-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-users text-green-600 mr-2"></i>
              Interviewees
            </h3>
            
            <FormField
              control={form.control}
              name="intervieweesNames"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
                    The following were interviewed:
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="List individuals interviewed during the investigation:
• Property owner
• Insured
• Witnesses
• Property manager
• Contractors
• Other relevant parties..."
                      rows={4}
                      className="px-4 py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Provided Documents */}
          <div className="bg-amber-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-file-alt text-amber-600 mr-2"></i>
              Document Review
            </h3>
            
            <FormField
              control={form.control}
              name="providedDocumentsTitles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
                    The following provided documents were reviewed:
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="List all documents reviewed during the investigation:
• Insurance policy documentation
• Previous inspection reports
• Building plans and specifications
• Maintenance records
• Photographs and videos
• Weather reports
• Other relevant documentation..."
                      rows={5}
                      className="px-4 py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Document Upload */}
            <div className="mt-6">
              <FileUpload
                category="Document Review Files"
                onFilesChange={setDocumentFiles}
                initialFiles={documentFiles}
                acceptedFileTypes={['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png']}
                maxFiles={20}
                maxFileSize={15}
                className="border-t border-amber-200 pt-6"
              />
            </div>
          </div>

          {/* Additional Methodology Notes */}
          <div className="bg-purple-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-notes-medical text-purple-600 mr-2"></i>
              Additional Methodology Notes
            </h3>
            
            <FormField
              control={form.control}
              name="additionalMethodologyNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
                    Additional methodology details (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add any additional methodology notes, special procedures, testing methods, or investigative techniques used..."
                      rows={3}
                      className="px-4 py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              className="flex items-center px-6 py-3"
            >
              <i className="fas fa-chevron-left mr-2"></i>
              Previous: Project Information
            </Button>
            
            <Button 
              type="submit"
              className="flex items-center px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Next: Background & Observations"}
              <i className="fas fa-chevron-right ml-2"></i>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
});