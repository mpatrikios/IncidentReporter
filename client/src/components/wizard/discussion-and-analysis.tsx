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
  reportId?: number | null;
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
      discussionAndAnalysis: "",
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
        discussionAndAnalysis: "",
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
          
          <div className="bg-purple-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-comments text-purple-600 mr-2"></i>
              Discussion and Analysis
            </h3>
            
            <FormField
              control={form.control}
              name="discussionAndAnalysis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
                    Discussion and Analysis <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Provide detailed technical analysis and discussion of findings. Include:

• Analysis of observed damage and conditions
• Evaluation of potential causes
• Engineering assessment of structural integrity
• Discussion of relevant codes and standards
• Consideration of weather and environmental factors
• Professional engineering opinion and technical reasoning..."
                      rows={12}
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