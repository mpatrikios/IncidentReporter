import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectInformationSchema, type ProjectInformation } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
      projectName: "",
      projectLocation: "",
      clientName: "",
      projectDescription: "",
      projectManager: "",
      startDate: "",
      expectedCompletionDate: "",
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
        projectName: "",
        projectLocation: "",
        clientName: "",
        projectDescription: "",
        projectManager: "",
        startDate: "",
        expectedCompletionDate: "",
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
        }} className="space-y-6">
          
          {/* Basic Project Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="projectName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold text-slate-900">
                    Project Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Downtown Office Complex"
                      className="px-4 py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold text-slate-900">
                    Project Location <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="123 Main St, City, State"
                      className="px-4 py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold text-slate-900">
                    Client Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="ABC Development Corp"
                      className="px-4 py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectManager"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold text-slate-900">
                    Project Manager <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="John Smith, P.E."
                      className="px-4 py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="projectDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold text-slate-900">
                  Project Description <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Describe the scope and objectives of the project..."
                    rows={4}
                    className="px-4 py-3"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold text-slate-900">
                    Project Start Date <span className="text-red-500">*</span>
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
              name="expectedCompletionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold text-slate-900">
                    Expected Completion Date <span className="text-red-500">*</span>
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

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-6">
            {!isFirstStep && onPrevious ? (
              <Button
                type="button"
                variant="outline"
                onClick={onPrevious}
                className="flex items-center px-6 py-3"
              >
                <i className="fas fa-chevron-left mr-2"></i>
                Previous
              </Button>
            ) : (
              <div />
            )}
            
            <Button
              type="submit"
              className="flex items-center px-8 py-3 bg-primary-600 hover:bg-primary-700"
            >
              Next: Site Analysis
              <i className="fas fa-chevron-right ml-2"></i>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
});
