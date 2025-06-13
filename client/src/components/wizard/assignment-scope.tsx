import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assignmentScopeSchema, type AssignmentScope } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useEffect, forwardRef, useImperativeHandle } from "react";
import type { StepRef } from "@/lib/types";

interface AssignmentScopeProps {
  initialData?: Partial<AssignmentScope>;
  onSubmit: (data: AssignmentScope) => void;
  onPrevious?: () => void;
  reportId?: number | null;
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
      assignmentScope: "",
      siteContact: "",
      interviewees: "",
      documentsReviewed: "",
      weatherResearchSummary: "",
      ...initialData,
    },
  });

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
        assignmentScope: "",
        siteContact: "",
        interviewees: "",
        documentsReviewed: "",
        weatherResearchSummary: "",
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
          
          {/* Assignment Scope */}
          <div className="bg-blue-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-tasks text-blue-600 mr-2"></i>
              Assignment Details
            </h3>
            
            <FormField
              control={form.control}
              name="assignmentScope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
                    Assignment Scope <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe the scope of this engineering assignment, including objectives, deliverables, and limitations..."
                      rows={4}
                      className="px-4 py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Site Contact Information */}
          <div className="bg-green-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-user-friends text-green-600 mr-2"></i>
              Site Contact & Personnel
            </h3>
            
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="siteContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      Site Contact
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Property Manager: John Smith, Phone: (555) 123-4567"
                        className="px-4 py-3"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interviewees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      Interviewees
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="List individuals interviewed during the investigation, including their roles and key information provided..."
                        rows={3}
                        className="px-4 py-3"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Documentation Review */}
          <div className="bg-amber-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-file-alt text-amber-600 mr-2"></i>
              Documentation Review
            </h3>
            
            <FormField
              control={form.control}
              name="documentsReviewed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
                    Documents Reviewed
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="List all documents reviewed, including:
• Building plans and specifications
• Inspection reports
• Maintenance records
• Previous engineering reports
• Insurance documentation
• Photographs and videos
• Other relevant materials..."
                      rows={6}
                      className="px-4 py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Weather Research */}
          <div className="bg-purple-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-cloud-rain text-purple-600 mr-2"></i>
              Weather Research Summary
            </h3>
            
            <FormField
              control={form.control}
              name="weatherResearchSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
                    Weather Research Summary
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Summarize weather research findings relevant to the loss event, including:
• Weather conditions on the date of loss
• Historical weather patterns
• Severe weather events in the area
• Wind speeds, precipitation, and other relevant meteorological data..."
                      rows={5}
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
              {isSaving ? "Saving..." : "Next: Building & Site Observations"}
              <i className="fas fa-chevron-right ml-2"></i>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
});