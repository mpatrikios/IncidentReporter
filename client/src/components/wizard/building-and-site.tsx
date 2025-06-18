import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { buildingAndSiteSchema, type BuildingAndSite } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileUpload, type UploadedFile } from "@/components/ui/file-upload";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useEffect, forwardRef, useImperativeHandle, useState } from "react";
import type { StepRef } from "@/lib/types";

interface BuildingAndSiteProps {
  initialData?: Partial<BuildingAndSite>;
  onSubmit?: (data: BuildingAndSite) => void;
  onPrevious?: () => void;
  reportId?: string | null;
}

export const BuildingAndSiteStep = forwardRef<StepRef<BuildingAndSite>, BuildingAndSiteProps>(({ 
  initialData, 
  onSubmit = () => {}, 
  onPrevious,
  reportId 
}, ref) => {
  const form = useForm<BuildingAndSite>({
    resolver: zodResolver(buildingAndSiteSchema),
    defaultValues: {
      structureBuiltDate: "",
      structureAge: "",
      buildingSystemDescription: "",
      frontFacingDirection: "",
      exteriorObservations: "",
      interiorObservations: "",
      otherSiteObservations: "",
      ...initialData,
    },
  });

  // File upload state
  const [buildingPhotos, setBuildingPhotos] = useState<UploadedFile[]>([]);
  const [exteriorPhotos, setExteriorPhotos] = useState<UploadedFile[]>([]);
  const [interiorPhotos, setInteriorPhotos] = useState<UploadedFile[]>([]);
  const [siteDocuments, setSiteDocuments] = useState<UploadedFile[]>([]);

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
        structureBuiltDate: "",
        structureAge: "",
        buildingSystemDescription: "",
        frontFacingDirection: "",
        exteriorObservations: "",
        interiorObservations: "",
        otherSiteObservations: "",
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
          
          {/* Background Information */}
          <div className="bg-blue-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-info-circle text-blue-600 mr-2"></i>
              Background Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="structureBuiltDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      Structure Built Date <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="1995" 
                        className="px-4 py-3" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="structureAge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      Structure Age <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="29 years old" 
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
              name="frontFacingDirection"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
                    Front Facing Direction <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="north, south, east, west, etc." 
                      className="px-4 py-3" 
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-slate-500 mt-1">
                    All directional references in the report will be made from the perspective of one facing the front of the structure from the street.
                  </p>
                </FormItem>
              )}
            />
          </div>

          {/* Building System Description */}
          <div className="bg-amber-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-building text-amber-600 mr-2"></i>
              Building System Description
            </h3>
            
            <FormField
              control={form.control}
              name="buildingSystemDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
                    Building System Description <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Detailed description of the building system including:
• Construction type and materials
• Roof system and materials
• Foundation type
• Structural elements
• Age and condition of building systems
• Previous repairs or modifications
• Any notable features or deficiencies..."
                      rows={6}
                      className="px-4 py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Building Documentation Upload */}
            <div className="mt-6">
              <FileUpload
                category="Building Documentation"
                onFilesChange={setBuildingPhotos}
                initialFiles={buildingPhotos}
                acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf']}
                maxFiles={10}
                maxFileSize={10}
                className="border-t border-amber-200 pt-6"
              />
            </div>
          </div>

          {/* Site Observations */}
          <div className="bg-green-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-eye text-green-600 mr-2"></i>
              Site Observations
            </h3>
            
            <div className="text-sm text-slate-700 mb-4">
              <p><strong>Observations were limited to visual examinations and measurements of accessible portions of the subject property.</strong> Removal of finish materials, qualitative testing, excavation, or other work not specifically described herein was not conducted.</p>
              <p className="mt-2">Observations were photographed to document distress and relevant conditions at the subject property on the date of the site visit.</p>
            </div>

            <FormField
              control={form.control}
              name="exteriorObservations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
                    Exterior Observations <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Detailed exterior observations including:
• Roof condition and damage
• Siding and exterior wall conditions
• Foundation observations
• Gutters and downspouts
• Windows and doors
• Evidence of wind or hail damage
• Overall structural condition..."
                      rows={5}
                      className="px-4 py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Exterior Photos Upload */}
            <div className="mt-6">
              <FileUpload
                category="Exterior Photos"
                onFilesChange={setExteriorPhotos}
                initialFiles={exteriorPhotos}
                acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/gif']}
                maxFiles={15}
                maxFileSize={10}
                className="border-t border-green-200 pt-6"
              />
            </div>

            <FormField
              control={form.control}
              name="interiorObservations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
                    Interior Observations <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Detailed interior observations including:
• Ceiling conditions and water stains
• Wall conditions
• Flooring conditions
• Evidence of leaking or water damage
• Structural elements visible
• HVAC systems
• Overall interior condition..."
                      rows={5}
                      className="px-4 py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Interior Photos Upload */}
            <div className="mt-6">
              <FileUpload
                category="Interior Photos"
                onFilesChange={setInteriorPhotos}
                initialFiles={interiorPhotos}
                acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/gif']}
                maxFiles={15}
                maxFileSize={10}
                className="border-t border-green-200 pt-6"
              />
            </div>

            <FormField
              control={form.control}
              name="otherSiteObservations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
                    Other Site Observations
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Additional site observations including:
• Landscaping and grading
• Drainage conditions
• Surrounding structures
• Access conditions
• Security features
• Other relevant site conditions..."
                      rows={4}
                      className="px-4 py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Site Documents Upload */}
            <div className="mt-6">
              <FileUpload
                category="Site Documents & Other Photos"
                onFilesChange={setSiteDocuments}
                initialFiles={siteDocuments}
                acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
                maxFiles={10}
                maxFileSize={10}
                className="border-t border-green-200 pt-6"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              className="flex items-center px-6 py-3"
            >
              <i className="fas fa-chevron-left mr-2"></i>
              Previous: Methodology
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