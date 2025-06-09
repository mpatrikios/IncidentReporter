import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { calculationsSchema, type Calculations } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useEffect, forwardRef, useImperativeHandle } from "react";
import type { StepRef } from "@/lib/types";
import type { UseFormReturn } from "react-hook-form";

interface CalculationsProps {
  initialData?: Partial<Calculations>;
  onSubmit: (data: Calculations) => void;
  onPrevious?: () => void;
  reportId?: number | null;
}

export const CalculationsStep = forwardRef<StepRef<Calculations>, CalculationsProps>(({ 
  initialData, 
  onSubmit, 
  onPrevious,
  reportId 
}, ref) => {
  const form: UseFormReturn<Calculations> = useForm<Calculations>({
    resolver: zodResolver(calculationsSchema),
    defaultValues: {
      calculationType: [],
      loadCalculations: "",
      structuralAnalysis: "",
      safetyFactors: undefined,
      codeCompliance: "",
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
  const { isSaving } = useAutoSave(reportId, 4, form.watch());

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      form.reset({
        calculationType: [],
        loadCalculations: "",
        structuralAnalysis: "",
        safetyFactors: undefined,
        codeCompliance: "",
        ...initialData,
      });
    }
  }, [initialData, form]);

  const calculationTypes = [
    "Load calculations",
    "Structural analysis",
    "Foundation design",
    "Seismic analysis",
    "Wind load analysis",
    "Thermal analysis",
    "Fatigue analysis",
    "Connection design"
  ];

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Calculation Types */}
          <FormField
            control={form.control}
            name="calculationType"
            render={() => (
              <FormItem>
                <FormLabel className="text-base font-semibold text-slate-900">
                  Required Calculations <span className="text-red-500">*</span>
                </FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                  {calculationTypes.map((type) => (
                    <FormField
                      key={type}
                      control={form.control}
                      name="calculationType"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={type}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(type)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, type])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== type
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              {type}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Load Calculations */}
          <FormField
            control={form.control}
            name="loadCalculations"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold text-slate-900">
                  Load Calculations Summary
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Summarize the load calculations performed, including dead loads, live loads, wind loads, seismic loads, etc..."
                    rows={4}
                    className="px-4 py-3"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Structural Analysis */}
          <FormField
            control={form.control}
            name="structuralAnalysis"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold text-slate-900">
                  Structural Analysis Method
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Describe the structural analysis methods used (e.g., finite element analysis, manual calculations, software used)..."
                    rows={4}
                    className="px-4 py-3"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Safety Factors */}
          <FormField
            control={form.control}
            name="safetyFactors"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold text-slate-900">
                  Applied Safety Factor
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.1"
                    placeholder="2.0"
                    className="px-4 py-3"
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Code Compliance */}
          <FormField
            control={form.control}
            name="codeCompliance"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold text-slate-900">
                  Code Compliance Notes
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Document how the calculations comply with applicable building codes and standards..."
                    rows={4}
                    className="px-4 py-3"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-6">
            {onPrevious && (
              <Button
                type="button"
                variant="outline"
                onClick={onPrevious}
                className="flex items-center px-6 py-3"
              >
                <i className="fas fa-chevron-left mr-2"></i>
                Previous: Design Specifications
              </Button>
            )}
            
            <Button
              type="submit"
              className="flex items-center px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Next: Review & Attachments"}
              <i className="fas fa-chevron-right ml-2"></i>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
});
