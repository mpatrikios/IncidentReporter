import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { researchSchema, type Research } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useEffect, forwardRef, useImperativeHandle } from "react";
import type { StepRef } from "@/lib/types";

interface CalculationsProps {
  initialData?: Partial<Research>;
  onSubmit: (data: Research) => void;
  onPrevious?: () => void;
  reportId?: string | null;
}

export const CalculationsStep = forwardRef<StepRef<Research>, CalculationsProps>(({ 
  initialData, 
  onSubmit, 
  onPrevious,
  reportId 
}, ref) => {
  const form = useForm<Research>({
    resolver: zodResolver(researchSchema),
    defaultValues: {
      weatherDataSummary: "",
      corelogicHailSummary: "",
      corelogicWindSummary: "",
      ...initialData,
    },
  });

  const { control, handleSubmit, reset, trigger, getValues } = form;

  // Expose save method to parent
  useImperativeHandle(ref, () => ({
    save: async () => {
      const isValid = await trigger();
      if (isValid) {
        const values = getValues();
        onSubmit(values);
      }
    },
    getValues: () => getValues(),
  }));

  const { isSaving } = useAutoSave(reportId, 4, form.watch());

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      reset({
        weatherDataSummary: "",
        corelogicHailSummary: "",
        corelogicWindSummary: "",
        ...initialData,
      });
    }
  }, [initialData, reset]);

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Weather Data Summary */}
          <FormField
            control={control}
            name="weatherDataSummary"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold text-slate-900">
                  NOAA's Storm Prediction Center Records <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="NOAA's Storm Prediction Center records reported [complete this section]:
• Date and time of weather events
• Storm severity and classification
• Wind speeds recorded
• Hail reports and sizes
• Precipitation amounts
• Storm path and duration
• Damage reports from the area..."
                    rows={6}
                    className="px-4 py-3"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* CoreLogic Hail Summary */}
          <FormField
            control={control}
            name="corelogicHailSummary"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold text-slate-900">
                  CoreLogic's Hail Verification Report <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="CoreLogic's Hail Verification Report [complete this section]:
• Hail event dates and times
• Hail sizes reported
• Probability of hail at the subject property
• Distance from hail swath center
• Intensity and duration of hail
• Comparison with surrounding areas
• Historical hail data for the location..."
                    rows={6}
                    className="px-4 py-3"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* CoreLogic Wind Summary */}
          <FormField
            control={control}
            name="corelogicWindSummary"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold text-slate-900">
                  CoreLogic's Wind Verification Report <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="CoreLogic's Wind Verification Report indicates [complete this section]:
• Wind event dates and times
• Maximum wind speeds recorded
• Wind direction and patterns
• Duration of high wind conditions
• Probability of damaging winds at the subject property
• Comparison with design wind speeds
• Historical wind data for the location..."
                    rows={6}
                    className="px-4 py-3"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between items-center pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              className="flex items-center px-6 py-3"
            >
              <i className="fas fa-chevron-left mr-2"></i>
              Previous: Building Analysis
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