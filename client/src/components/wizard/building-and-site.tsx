import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { buildingAndSiteSchema, type BuildingAndSite } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useEffect, forwardRef, useImperativeHandle } from "react";
import type { StepRef } from "@/lib/types";

interface BuildingAndSiteProps {
  initialData?: Partial<BuildingAndSite>;
  onSubmit: (data: BuildingAndSite) => void;
  onPrevious?: () => void;
  reportId?: number | null;
}

export const BuildingAndSiteStep = forwardRef<StepRef<BuildingAndSite>, BuildingAndSiteProps>(({ 
  initialData, 
  onSubmit, 
  onPrevious,
  reportId 
}, ref) => {
  const form = useForm<BuildingAndSite>({
    resolver: zodResolver(buildingAndSiteSchema),
    defaultValues: {
      structureAge: "",
      squareFootage: "",
      roofType: "",
      ventilationDescription: "",
      buildingDescription: "",
      exteriorObservations: "",
      interiorObservations: "",
      crawlspaceObservations: "",
      siteObservations: "",
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

  const { isSaving } = useAutoSave(reportId, 3, form.watch());

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      form.reset({
        structureAge: "",
        squareFootage: "",
        roofType: "",
        ventilationDescription: "",
        buildingDescription: "",
        exteriorObservations: "",
        interiorObservations: "",
        crawlspaceObservations: "",
        siteObservations: "",
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
          
          {/* Building Description */}
          <div className="bg-blue-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-building text-blue-600 mr-2"></i>
              Building Description
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="structureAge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      Structure Age
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Built in 1995 (29 years old)" className="px-4 py-3" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="squareFootage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      Square Footage
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="2,500 sq ft" className="px-4 py-3" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roofType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      Roof Type
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Asphalt shingle, gable roof" className="px-4 py-3" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ventilationDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      Ventilation Description
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ridge vents, soffit vents" className="px-4 py-3" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="buildingDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
                    Building Description <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Detailed description of the building structure, materials, construction type, and general condition..."
                      rows={4}
                      className="px-4 py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Site Observations */}
          <div className="bg-green-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-eye text-green-600 mr-2"></i>
              Site Observations
            </h3>
            
            <FormField
              control={form.control}
              name="exteriorObservations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
                    Exterior Observations
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Detailed observations of exterior conditions, damage, and structural elements..."
                      rows={4}
                      className="px-4 py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interiorObservations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
                    Interior Observations
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Detailed observations of interior conditions, damage, and structural elements..."
                      rows={4}
                      className="px-4 py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="crawlspaceObservations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
                    Crawlspace Observations
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Observations of crawlspace conditions, if accessible..."
                      rows={3}
                      className="px-4 py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="siteObservations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
                    Site Observations
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="General site observations, drainage, landscaping, surrounding conditions..."
                      rows={3}
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
              Previous: Assignment Scope
            </Button>
            
            <Button 
              type="submit"
              className="flex items-center px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Next: Research"}
              <i className="fas fa-chevron-right ml-2"></i>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
});