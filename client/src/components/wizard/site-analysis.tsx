import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { siteAnalysisSchema, type SiteAnalysis } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useEffect, forwardRef, useImperativeHandle } from "react";
import type { StepRef } from "@/lib/types";

interface SiteAnalysisProps {
  initialData?: Partial<SiteAnalysis>;
  onSubmit: (data: SiteAnalysis) => void;
  onPrevious?: () => void;
  reportId?: string | null;
}

export const SiteAnalysisStep = forwardRef<StepRef<SiteAnalysis>, SiteAnalysisProps>(({ 
  initialData, 
  onSubmit, 
  onPrevious,
  reportId 
}, ref) => {
  const form = useForm<SiteAnalysis>({
    resolver: zodResolver(siteAnalysisSchema),
    defaultValues: {
      siteArea: 0,
      soilType: "",
      groundwaterLevel: undefined,
      existingStructures: "",
      accessibilityNotes: "",
      environmentalFactors: [],
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
        siteArea: 0,
        soilType: "",
        groundwaterLevel: undefined,
        existingStructures: "",
        accessibilityNotes: "",
        environmentalFactors: [],
        ...initialData,
      });
    }
  }, [initialData, form]);

  const environmentalOptions = [
    "Wetlands",
    "Flood zone", 
    "Seismic activity",
    "High winds",
    "Snow loads",
    "Coastal environment",
    "Urban setting",
    "Protected wildlife"
  ];

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={(e) => {
          e.preventDefault();
          // Allow navigation without validation - just submit current form data
          const formData = form.getValues();
          onSubmit(formData);
        }} className="space-y-6">
          
          {/* Site Measurements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="siteArea"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold text-slate-900">
                    Site Area (sq ft) <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="50000"
                      className="px-4 py-3"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="groundwaterLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold text-slate-900">
                    Groundwater Level (ft below surface)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="15"
                      className="px-4 py-3"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Soil Information */}
          <FormField
            control={form.control}
            name="soilType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold text-slate-900">
                  Primary Soil Type <span className="text-red-500">*</span>
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="px-4 py-3">
                      <SelectValue placeholder="Select soil type..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="clay">Clay</SelectItem>
                    <SelectItem value="sand">Sand</SelectItem>
                    <SelectItem value="silt">Silt</SelectItem>
                    <SelectItem value="gravel">Gravel</SelectItem>
                    <SelectItem value="rock">Bedrock</SelectItem>
                    <SelectItem value="mixed">Mixed composition</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Existing Structures */}
          <FormField
            control={form.control}
            name="existingStructures"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold text-slate-900">
                  Existing Structures
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Describe any existing buildings, utilities, or infrastructure on the site..."
                    rows={3}
                    className="px-4 py-3"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Accessibility */}
          <FormField
            control={form.control}
            name="accessibilityNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold text-slate-900">
                  Site Accessibility Notes
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Notes about site access, transportation, parking, etc..."
                    rows={3}
                    className="px-4 py-3"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Environmental Factors */}
          <FormField
            control={form.control}
            name="environmentalFactors"
            render={() => (
              <FormItem>
                <FormLabel className="text-base font-semibold text-slate-900">
                  Environmental Factors
                </FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                  {environmentalOptions.map((factor) => (
                    <FormField
                      key={factor}
                      control={form.control}
                      name="environmentalFactors"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={factor}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(factor)}
                                onCheckedChange={(checked) => {
                                  const currentValue: string[] = field.value || [];
                                  return checked
                                    ? field.onChange([...currentValue, factor])
                                    : field.onChange(
                                        currentValue.filter(
                                          (value) => value !== factor
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              {factor}
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
              className="flex items-center px-8 py-3 bg-primary-600 hover:bg-primary-700"
            >
              Next: Design Specifications
              <i className="fas fa-chevron-right ml-2"></i>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
});
