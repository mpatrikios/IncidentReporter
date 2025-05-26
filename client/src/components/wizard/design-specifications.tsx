import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { designSpecificationsSchema, type DesignSpecifications } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DesignSpecificationsProps {
  initialData?: Partial<DesignSpecifications>;
  onSubmit: (data: DesignSpecifications) => void;
  onPrevious: () => void;
}

export function DesignSpecificationsStep({ initialData, onSubmit, onPrevious }: DesignSpecificationsProps) {
  const form = useForm<DesignSpecifications>({
    resolver: zodResolver(designSpecificationsSchema),
    defaultValues: {
      designType: "structural",
      deadLoad: undefined,
      liveLoad: undefined,
      material: "",
      concreteStrength: "",
      rebarGrade: "",
      slump: undefined,
      designCodes: [],
      seismicCategory: "",
      windSpeed: undefined,
      additionalNotes: "",
      ...initialData,
    },
  });

  const designType = form.watch("designType");
  const material = form.watch("material");

  const designCodes = [
    "ACI 318 (Concrete)",
    "AISC 360 (Steel)", 
    "ASCE 7 (Loads)",
    "IBC (Building Code)"
  ];

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Design Type Selection */}
          <FormField
            control={form.control}
            name="designType"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <FormLabel className="text-base font-semibold text-slate-900">
                  Primary Design Type <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="structural" id="structural" className="sr-only peer" />
                      <Label
                        htmlFor="structural"
                        className={cn(
                          "w-full p-4 rounded-lg border-2 cursor-pointer transition-all",
                          "border-slate-200 hover:border-slate-300",
                          "peer-checked:border-primary-600 peer-checked:bg-primary-50"
                        )}
                      >
                        <div className="flex items-center">
                          <i className="fas fa-building text-primary-600 text-xl mr-3"></i>
                          <div>
                            <div className="font-semibold text-slate-900">Structural Design</div>
                            <div className="text-sm text-slate-600">Buildings, bridges, foundations</div>
                          </div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="transportation" id="transportation" className="sr-only peer" />
                      <Label
                        htmlFor="transportation"
                        className={cn(
                          "w-full p-4 rounded-lg border-2 cursor-pointer transition-all",
                          "border-slate-200 hover:border-slate-300",
                          "peer-checked:border-primary-600 peer-checked:bg-primary-50"
                        )}
                      >
                        <div className="flex items-center">
                          <i className="fas fa-road text-slate-600 text-xl mr-3"></i>
                          <div>
                            <div className="font-semibold text-slate-900">Transportation</div>
                            <div className="text-sm text-slate-600">Roads, highways, traffic systems</div>
                          </div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="water" id="water" className="sr-only peer" />
                      <Label
                        htmlFor="water"
                        className={cn(
                          "w-full p-4 rounded-lg border-2 cursor-pointer transition-all",
                          "border-slate-200 hover:border-slate-300",
                          "peer-checked:border-primary-600 peer-checked:bg-primary-50"
                        )}
                      >
                        <div className="flex items-center">
                          <i className="fas fa-tint text-slate-600 text-xl mr-3"></i>
                          <div>
                            <div className="font-semibold text-slate-900">Water Resources</div>
                            <div className="text-sm text-slate-600">Drainage, treatment, distribution</div>
                          </div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="geotechnical" id="geotechnical" className="sr-only peer" />
                      <Label
                        htmlFor="geotechnical"
                        className={cn(
                          "w-full p-4 rounded-lg border-2 cursor-pointer transition-all",
                          "border-slate-200 hover:border-slate-300",
                          "peer-checked:border-primary-600 peer-checked:bg-primary-50"
                        )}
                      >
                        <div className="flex items-center">
                          <i className="fas fa-mountain text-slate-600 text-xl mr-3"></i>
                          <div>
                            <div className="font-semibold text-slate-900">Geotechnical</div>
                            <div className="text-sm text-slate-600">Soil analysis, slope stability</div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Structural Design Specific Fields */}
          {designType === "structural" && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              
              {/* Load Requirements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="deadLoad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-900">
                        Dead Load (psf) <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="number"
                            placeholder="50"
                            className="px-4 py-3 pr-12"
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <span className="text-slate-500 text-sm">psf</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="liveLoad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-900">
                        Live Load (psf) <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="number"
                            placeholder="40"
                            className="px-4 py-3 pr-12"
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <span className="text-slate-500 text-sm">psf</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Material Selection */}
              <FormField
                control={form.control}
                name="material"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      Primary Structural Material <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="px-4 py-3">
                          <SelectValue placeholder="Select material..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="concrete">Reinforced Concrete</SelectItem>
                        <SelectItem value="steel">Structural Steel</SelectItem>
                        <SelectItem value="wood">Engineered Wood</SelectItem>
                        <SelectItem value="masonry">Masonry</SelectItem>
                        <SelectItem value="composite">Composite Materials</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Concrete Specifications */}
              {material === "concrete" && (
                <div className="bg-slate-50 rounded-lg p-6 space-y-4 animate-in fade-in duration-200">
                  <h4 className="font-semibold text-slate-900 flex items-center">
                    <i className="fas fa-cube text-slate-600 mr-2"></i>
                    Concrete Specifications
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="concreteStrength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700">
                            Compressive Strength (psi)
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="px-3 py-2">
                                <SelectValue placeholder="Select strength..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="3000">3,000 psi</SelectItem>
                              <SelectItem value="4000">4,000 psi</SelectItem>
                              <SelectItem value="5000">5,000 psi</SelectItem>
                              <SelectItem value="6000">6,000 psi</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rebarGrade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700">
                            Rebar Grade
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="px-3 py-2">
                                <SelectValue placeholder="Select grade..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="grade40">Grade 40</SelectItem>
                              <SelectItem value="grade60">Grade 60</SelectItem>
                              <SelectItem value="grade75">Grade 75</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slump"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700">
                            Slump (inches)
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder="4"
                              min="2"
                              max="8"
                              className="px-3 py-2"
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Design Standards */}
              <FormField
                control={form.control}
                name="designCodes"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-900">Design Standards & Codes</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      {designCodes.map((code) => (
                        <FormField
                          key={code}
                          control={form.control}
                          name="designCodes"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={code}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(code)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value || [], code])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== code
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm cursor-pointer">
                                  {code}
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

              {/* Environmental Considerations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="seismicCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700">
                        Seismic Design Category
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="px-4 py-3">
                            <SelectValue placeholder="Select category..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A">Category A (Low)</SelectItem>
                          <SelectItem value="B">Category B (Moderate)</SelectItem>
                          <SelectItem value="C">Category C (Moderately High)</SelectItem>
                          <SelectItem value="D">Category D (High)</SelectItem>
                          <SelectItem value="E">Category E (Very High)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="windSpeed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700">
                        Wind Speed (mph)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="115"
                          className="px-4 py-3"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* Additional Notes */}
          <FormField
            control={form.control}
            name="additionalNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-slate-900">
                  Additional Design Notes
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Enter any additional design requirements, special considerations, or notes..."
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
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              className="flex items-center px-6 py-3"
            >
              <i className="fas fa-chevron-left mr-2"></i>
              Previous: Site Analysis
            </Button>
            
            <Button
              type="submit"
              className="flex items-center px-8 py-3 bg-primary-600 hover:bg-primary-700"
            >
              Next: Calculations
              <i className="fas fa-chevron-right ml-2"></i>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
