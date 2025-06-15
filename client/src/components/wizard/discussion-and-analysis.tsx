import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { discussionAndAnalysisSchema, type DiscussionAndAnalysis } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useEffect, forwardRef, useImperativeHandle } from "react";
import type { StepRef } from "@/lib/types";

interface DiscussionAndAnalysisProps {
  initialData?: Partial<DiscussionAndAnalysis>;
  onSubmit: (data: DiscussionAndAnalysis) => void;
  onPrevious?: () => void;
  reportId?: string | null;
}

export const DiscussionAndAnalysisStep = forwardRef<StepRef<DiscussionAndAnalysis>, DiscussionAndAnalysisProps>(({ 
  initialData, 
  onSubmit, 
  onPrevious,
  reportId 
}, ref) => {
  const form = useForm<DiscussionAndAnalysis>({
    resolver: zodResolver(discussionAndAnalysisSchema),
    defaultValues: {
      siteDiscussionAnalysis: "",
      weatherDiscussionAnalysis: "",
      weatherImpactAnalysis: "",
      recommendationsAndDiscussion: "",
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

  const { isSaving } = useAutoSave(reportId, 5, form.watch());

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      form.reset({
        siteDiscussionAnalysis: "",
        weatherDiscussionAnalysis: "",
        weatherImpactAnalysis: "",
        recommendationsAndDiscussion: "",
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
          
          {/* Site Discussion and Analysis */}
          <div className="bg-blue-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-building text-blue-600 mr-2"></i>
              Site Discussion and Analysis
            </h3>
            
            <FormField
              control={form.control}
              name="siteDiscussionAnalysis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
                    Site Discussion and Analysis <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Provide detailed technical analysis of site observations including:
• Analysis of observed roof damage and conditions
• Evaluation of building system performance
• Assessment of construction materials and methods
• Discussion of age-related deterioration
• Structural integrity evaluation
• Professional engineering opinion on site conditions..."
                      rows={8}
                      className="px-4 py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Weather Discussion and Analysis */}
          <div className="bg-green-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-cloud-rain text-green-600 mr-2"></i>
              Weather Discussion and Analysis
            </h3>
            
            <FormField
              control={form.control}
              name="weatherDiscussionAnalysis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
                    Weather Discussion and Analysis <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Provide detailed analysis of weather conditions and impact including:
• Hail and wind event correlation with damage
• Storm intensity and duration analysis
• Weather data correlation with site observations
• Impact angle and trajectory analysis
• Comparison with historical weather patterns
• Professional opinion on weather-related causation..."
                      rows={6}
                      className="px-4 py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Weather Impact Analysis */}
          <div className="bg-purple-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-search text-purple-600 mr-2"></i>
              Weather Impact Analysis
            </h3>
            
            <FormField
              control={form.control}
              name="weatherImpactAnalysis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
                    Weather Impact Analysis <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="We inspected each of the roof slopes for hail damage. [Complete this analysis]:
• Hail strike patterns and impact angles
• Damage consistency with weather event severity
• Impact velocity and kinetic energy calculations
• Damage progression and distribution patterns
• Correlation between damage and weather data
• Professional opinion on weather causation..."
                      rows={6}
                      className="px-4 py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Recommendations and Discussion */}
          <div className="bg-amber-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-lightbulb text-amber-600 mr-2"></i>
              Recommendations and Additional Discussion
            </h3>
            
            <FormField
              control={form.control}
              name="recommendationsAndDiscussion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
                    Recommendations and Discussion (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Additional recommendations and discussion including:
• Repair and remediation recommendations
• Prevention measures and improvements
• Maintenance recommendations
• Additional testing or investigation needs
• Long-term monitoring recommendations
• Other professional recommendations..."
                      rows={5}
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
              Previous: Research
            </Button>
            
            <Button 
              type="submit"
              className="flex items-center px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Next: Conclusions"}
              <i className="fas fa-chevron-right ml-2"></i>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
});