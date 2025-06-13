import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectInformationSchema, type ProjectInformation } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useEffect, forwardRef, useImperativeHandle } from "react";
import type { StepRef } from "@/lib/types";

interface ProjectInformationProps {
  initialData?: Partial<ProjectInformation>;
  onSubmit: (data: ProjectInformation) => void;
  onPrevious?: () => void;
  isFirstStep?: boolean;
  reportId?: number | null;
}

export const ProjectInformationStep = forwardRef<StepRef<ProjectInformation>, ProjectInformationProps>(({ 
  initialData, 
  onSubmit, 
  onPrevious,
  isFirstStep = false,
  reportId 
}, ref) => {
  const form = useForm<ProjectInformation>({
    resolver: zodResolver(projectInformationSchema),
    defaultValues: {
      insuredName: "",
      insuredAddress: "",
      fileNumber: "",
      claimNumber: "",
      clientCompany: "",
      clientContactName: "",
      clientEmail: "",
      dateOfLoss: "",
      siteVisitDate: "",
      engineerName: "",
      technicalReviewerName: "",
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
  const { isSaving } = useAutoSave(reportId, 1, form.watch());

  // Reset form when initialData changes (when switching back to this step)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      form.reset({
        insuredName: "",
        insuredAddress: "",
        fileNumber: "",
        claimNumber: "",
        clientCompany: "",
        clientContactName: "",
        clientEmail: "",
        dateOfLoss: "",
        siteVisitDate: "",
        engineerName: "",
        technicalReviewerName: "",
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
          
          {/* Insured Information */}
          <div className="bg-slate-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-user-tie text-primary-600 mr-2"></i>
              Insured Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="insuredName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      Insured Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="John Smith"
                        className="px-4 py-3"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="insuredAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      Insured Address <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="123 Main Street, City, State 12345"
                        className="px-4 py-3"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* File and Claim Information */}
          <div className="bg-blue-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-folder-open text-blue-600 mr-2"></i>
              File & Claim Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="fileNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      File Number <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="CE-2024-001"
                        className="px-4 py-3"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="claimNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      Claim Number <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="CLM-2024-12345"
                        className="px-4 py-3"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Client Information */}
          <div className="bg-green-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-building text-green-600 mr-2"></i>
              Client Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="clientCompany"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      Client Company <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="ABC Insurance Company"
                        className="px-4 py-3"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientContactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      Client Contact Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Jane Adjuster"
                        className="px-4 py-3"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientEmail"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      Client Email <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="jane.adjuster@abcinsurance.com"
                        className="px-4 py-3"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Important Dates */}
          <div className="bg-amber-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-calendar-alt text-amber-600 mr-2"></i>
              Important Dates
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="dateOfLoss"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      Date of Loss <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className="px-4 py-3"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="siteVisitDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      Site Visit Date <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className="px-4 py-3"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Engineering Team */}
          <div className="bg-purple-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-hard-hat text-purple-600 mr-2"></i>
              Engineering Team
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="engineerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      Engineer Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Dr. Sarah Engineer, P.E."
                        className="px-4 py-3"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="technicalReviewerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      Technical Reviewer (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Prof. Mike Reviewer, P.E."
                        className="px-4 py-3"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-6">
            {!isFirstStep && (
              <Button
                type="button"
                variant="outline"
                onClick={onPrevious}
                className="flex items-center px-6 py-3"
              >
                <i className="fas fa-chevron-left mr-2"></i>
                Previous
              </Button>
            )}
            
            <div className={isFirstStep ? "ml-auto" : ""}>
              <Button 
                type="submit"
                className="flex items-center px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Next: Assignment Scope"}
                <i className="fas fa-chevron-right ml-2"></i>
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
});