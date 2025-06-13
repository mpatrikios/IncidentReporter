import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { researchSchema, type Research } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useEffect, forwardRef, useImperativeHandle } from "react";
import type { StepRef } from "@/lib/types";

interface ResearchProps {
  initialData?: Partial<Research>;
  onSubmit: (data: Research) => void;
  onPrevious?: () => void;
  reportId?: number | null;
}

export const ResearchStep = forwardRef<StepRef<Research>, ResearchProps>(({ 
  initialData, 
  onSubmit, 
  onPrevious,
  reportId 
}, ref) => {
  const form = useForm<Research>({
    resolver: zodResolver(researchSchema),
    defaultValues: {
      weatherDataSummary: "",
      corelogicDataSummary: "",
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

  const { isSaving } = useAutoSave(reportId, 4, form.watch());

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      form.reset({
        weatherDataSummary: "",
        corelogicDataSummary: "",
        ...initialData,
      });
    }
  }, [initialData, form]);

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = form.getValues();
          onSubmit(formData);
        }} className="space-y-8">
          
          <div className="bg-blue-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-cloud-rain text-blue-600 mr-2"></i>
              Weather Data Summary
            </h3>
            
            <FormField
              control={form.control}
              name="weatherDataSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
                    Weather Data Summary
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Summarize weather data findings relevant to the loss event..."
                      rows={6}
                      className="px-4 py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="bg-green-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-database text-green-600 mr-2"></i>
              CoreLogic Data Summary
            </h3>
            
            <FormField
              control={form.control}
              name="corelogicDataSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
                    CoreLogic Data Summary
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Summarize CoreLogic research findings and data analysis..."
                      rows={6}
                      className="px-4 py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-between items-center pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              className="flex items-center px-6 py-3"
            >
              <i className="fas fa-chevron-left mr-2"></i>
              Previous: Building & Site
            </Button>
            
            <Button 
              type="submit"
              className="flex items-center px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Next: Discussion & Analysis"}
              <i className="fas fa-chevron-right ml-2"></i>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
});