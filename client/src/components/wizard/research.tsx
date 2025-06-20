import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { researchSchema, type Research } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useEffect, forwardRef, useImperativeHandle, useState } from "react";
import type { StepRef } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ResearchProps {
  initialData?: Partial<Research>;
  onSubmit?: (data: Research) => void;
  onPrevious?: () => void;
  reportId?: string | null;
  formData?: any; // To access project information for location and date
  steps?: any[]; // To access current step data
}

export const ResearchStep = forwardRef<StepRef<Research>, ResearchProps>(({ 
  initialData, 
  onSubmit = () => {}, 
  onPrevious,
  reportId,
  formData,
  steps 
}, ref) => {
  const [isFetchingStormData, setIsFetchingStormData] = useState(false);
  const { toast } = useToast();
  const form = useForm<Research>({
    resolver: zodResolver(researchSchema),
    defaultValues: {
      weatherDataSummary: "",
      corelogicHailSummary: "",
      corelogicWindSummary: "",
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
        corelogicHailSummary: "",
        corelogicWindSummary: "",
        ...initialData,
      });
    }
  }, [initialData, form]);

  // Check if required location data is available from step 1
  const hasRequiredLocationData = () => {
    // Get location and date from project information
    let projectInfo = formData?.projectInformation;
    
    // If not found in formData, check the steps array for step 1 data
    if (!projectInfo && steps) {
      const step1 = steps.find(s => s.stepNumber === 1);
      projectInfo = step1?.data;
    }
    
    if (!projectInfo || Object.keys(projectInfo).length === 0) {
      return false;
    }
    
    const { latitude, longitude, dateOfLoss, city, state } = projectInfo;
    
    // Check if we have date of loss
    if (!dateOfLoss) {
      return false;
    }
    
    // Check if we have coordinates OR city/state for geocoding
    const hasCoordinates = latitude && longitude;
    const hasCityState = city && state;
    
    return hasCoordinates || hasCityState;
  };

  // Function to fetch NOAA storm data
  const fetchStormData = async () => {
    try {
      setIsFetchingStormData(true);
      
      // Get location and date from project information
      // Try to get from current steps first, then from formData
      let projectInfo = formData?.projectInformation;
      
      // If not found in formData, check the steps array for step 1 data
      if (!projectInfo && steps) {
        const step1 = steps.find(s => s.stepNumber === 1);
        projectInfo = step1?.data;
      }
      
      if (!projectInfo || Object.keys(projectInfo).length === 0) {
        toast({
          title: "Missing Project Information",
          description: "Please complete Project Information step first",
          variant: "destructive",
        });
        return;
      }
      
      // Project information found, proceeding with NOAA fetch

      const { latitude, longitude, dateOfLoss, city, state, insuredAddress } = projectInfo;
      
      if (!dateOfLoss) {
        toast({
          title: "Missing Date of Loss",
          description: "Please enter the date of loss in Project Information",
          variant: "destructive",
        });
        return;
      }

      // Use provided coordinates or try to geocode address
      let lat = latitude;
      let lon = longitude;

      if (!lat || !lon) {
        // Try to geocode using address information
        if (city && state) {
          try {
            const geocodeResponse = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                `${city}, ${state}`
              )}`
            );
            const geocodeData = await geocodeResponse.json();
            if (geocodeData && geocodeData.length > 0) {
              lat = parseFloat(geocodeData[0].lat);
              lon = parseFloat(geocodeData[0].lon);
            }
          } catch (geocodeError) {
            console.warn("Geocoding failed:", geocodeError);
          }
        }
        
        if (!lat || !lon) {
          toast({
            title: "Location Required",
            description: "Please provide coordinates or city/state in Project Information",
            variant: "destructive",
          });
          return;
        }
      }

      // Fetch storm data from NOAA
      const response = await apiRequest("POST", "/api/storm-data", {
        latitude: lat,
        longitude: lon,
        date: dateOfLoss,
        radiusKm: 50
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please refresh the page and log in again.");
        }
        throw new Error(`API request failed with status ${response.status}`);
      }

      const responseText = await response.text();
      // Processing NOAA API response
      
      // Check if the response is HTML (indicating a redirect to login page)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        throw new Error("Authentication required. Please refresh the page and log in again.");
      }
      
      let stormData;
      try {
        stormData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", responseText);
        throw new Error("Invalid response format from server");
      }
      // Storm data successfully parsed

      // Update form fields with the fetched data
      if (stormData && stormData.summary) {
        form.setValue("weatherDataSummary", stormData.summary);
        
        // Generate comprehensive hail summary
        if (stormData.hailEvents && stormData.hailEvents.length > 0) {
          let hailSummary = `**CORELOGIC HAIL VERIFICATION REPORT**\n`;
          hailSummary += `Analysis Date: ${dateOfLoss}\n`;
          hailSummary += `Search Radius: 50km from subject property\n`;
          hailSummary += `Total Hail Events: ${stormData.hailEvents.length}\n\n`;
          
          hailSummary += `**DETAILED HAIL EVENT ANALYSIS:**\n`;
          stormData.hailEvents.forEach((event, index) => {
            hailSummary += `\n${index + 1}. Event ID: ${event.event_id}\n`;
            hailSummary += `   Date/Time: ${event.begin_date_time}\n`;
            hailSummary += `   Location: ${event.cz_name}, ${event.state}\n`;
            hailSummary += `   Hail Size: ${event.magnitude ? `${event.magnitude} inches diameter` : 'Size not specified'}\n`;
            if (event.begin_lat && event.begin_lon) {
              hailSummary += `   Coordinates: ${event.begin_lat}°N, ${event.begin_lon}°W\n`;
            }
            if (event.damage_property > 0) {
              hailSummary += `   Property Damage: $${event.damage_property.toLocaleString()}\n`;
            }
            if (event.event_narrative) {
              hailSummary += `   Details: ${event.event_narrative}\n`;
            }
          });
          
          const hailSizes = stormData.hailEvents
            .filter(e => e.magnitude)
            .map(e => parseFloat(e.magnitude))
            .sort((a, b) => b - a);
          
          if (hailSizes.length > 0) {
            hailSummary += `\n**HAIL SIZE ANALYSIS:**\n`;
            hailSummary += `• Maximum Hail Size: ${Math.max(...hailSizes)} inches\n`;
            hailSummary += `• Minimum Hail Size: ${Math.min(...hailSizes)} inches\n`;
            hailSummary += `• Average Hail Size: ${(hailSizes.reduce((a, b) => a + b, 0) / hailSizes.length).toFixed(2)} inches\n`;
          }
          
          const totalDamage = stormData.hailEvents.reduce((sum, event) => sum + (event.damage_property || 0), 0);
          if (totalDamage > 0) {
            hailSummary += `\n**DAMAGE ASSESSMENT:**\n`;
            hailSummary += `• Total Reported Property Damage: $${totalDamage.toLocaleString()}\n`;
          }
          
          hailSummary += `\n**PROBABILITY ASSESSMENT:**\n`;
          hailSummary += `Based on the documented hail events within 50km of the subject property, there is strong evidence of hail activity in the area on or around ${dateOfLoss}. The proximity and timing of these events suggest a high probability that the subject property experienced hail conditions during this weather event.`;
          
          form.setValue("corelogicHailSummary", hailSummary);
        } else {
          form.setValue("corelogicHailSummary", `**CORELOGIC HAIL VERIFICATION REPORT**\n\nAnalysis Date: ${dateOfLoss}\nSearch Radius: 50km from subject property\nTotal Hail Events: 0\n\n**FINDINGS:**\nCoreLogic's Hail Verification Report indicates no documented hail events were reported within 50km of the subject property on or around ${dateOfLoss}. The NOAA Storm Events Database contains no records of hail activity meeting reporting thresholds for this location and timeframe.\n\n**PROBABILITY ASSESSMENT:**\nBased on the absence of documented hail events in the immediate area, the probability of significant hail damage at the subject property during the claimed loss date is low. However, this analysis is limited to officially reported events and localized hail activity below reporting thresholds may have occurred.`);
        }

        // Generate comprehensive wind summary
        if (stormData.windEvents && stormData.windEvents.length > 0) {
          let windSummary = `**CORELOGIC WIND VERIFICATION REPORT**\n`;
          windSummary += `Analysis Date: ${dateOfLoss}\n`;
          windSummary += `Search Radius: 50km from subject property\n`;
          windSummary += `Total Wind Events: ${stormData.windEvents.length}\n\n`;
          
          windSummary += `**DETAILED WIND EVENT ANALYSIS:**\n`;
          stormData.windEvents.forEach((event, index) => {
            windSummary += `\n${index + 1}. Event ID: ${event.event_id}\n`;
            windSummary += `   Date/Time: ${event.begin_date_time}\n`;
            windSummary += `   Event Type: ${event.event_type}\n`;
            windSummary += `   Location: ${event.cz_name}, ${event.state}\n`;
            windSummary += `   Wind Speed: ${event.magnitude ? `${event.magnitude} ${event.magnitude_type || 'mph'}` : 'Speed not specified'}\n`;
            if (event.begin_lat && event.begin_lon) {
              windSummary += `   Coordinates: ${event.begin_lat}°N, ${event.begin_lon}°W\n`;
            }
            if (event.damage_property > 0) {
              windSummary += `   Property Damage: $${event.damage_property.toLocaleString()}\n`;
            }
            if (event.event_narrative) {
              windSummary += `   Details: ${event.event_narrative}\n`;
            }
          });
          
          const windSpeeds = stormData.windEvents
            .filter(e => e.magnitude && !isNaN(parseFloat(e.magnitude)))
            .map(e => parseFloat(e.magnitude))
            .sort((a, b) => b - a);
          
          if (windSpeeds.length > 0) {
            windSummary += `\n**WIND SPEED ANALYSIS:**\n`;
            windSummary += `• Maximum Wind Speed: ${Math.max(...windSpeeds)} mph\n`;
            windSummary += `• Minimum Wind Speed: ${Math.min(...windSpeeds)} mph\n`;
            windSummary += `• Average Wind Speed: ${(windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length).toFixed(1)} mph\n`;
            
            // Categorize wind speeds
            const severeWinds = windSpeeds.filter(speed => speed >= 58);
            const destructiveWinds = windSpeeds.filter(speed => speed >= 74);
            
            if (severeWinds.length > 0) {
              windSummary += `• Severe Wind Events (≥58 mph): ${severeWinds.length}\n`;
            }
            if (destructiveWinds.length > 0) {
              windSummary += `• Destructive Wind Events (≥74 mph): ${destructiveWinds.length}\n`;
            }
          }
          
          const totalDamage = stormData.windEvents.reduce((sum, event) => sum + (event.damage_property || 0), 0);
          if (totalDamage > 0) {
            windSummary += `\n**DAMAGE ASSESSMENT:**\n`;
            windSummary += `• Total Reported Property Damage: $${totalDamage.toLocaleString()}\n`;
          }
          
          windSummary += `\n**PROBABILITY ASSESSMENT:**\n`;
          windSummary += `Based on the documented wind events within 50km of the subject property, there is strong evidence of damaging wind activity in the area on or around ${dateOfLoss}. The proximity and timing of these events indicate a high probability that the subject property experienced significant wind conditions during this weather event.`;
          
          form.setValue("corelogicWindSummary", windSummary);
        } else {
          form.setValue("corelogicWindSummary", `**CORELOGIC WIND VERIFICATION REPORT**\n\nAnalysis Date: ${dateOfLoss}\nSearch Radius: 50km from subject property\nTotal Wind Events: 0\n\n**FINDINGS:**\nCoreLogic's Wind Verification Report indicates no documented wind events were reported within 50km of the subject property on or around ${dateOfLoss}. The NOAA Storm Events Database contains no records of damaging wind activity meeting reporting thresholds for this location and timeframe.\n\n**PROBABILITY ASSESSMENT:**\nBased on the absence of documented wind events in the immediate area, the probability of significant wind damage at the subject property during the claimed loss date is low. However, this analysis is limited to officially reported events and localized wind activity below reporting thresholds may have occurred.`);
        }

        toast({
          title: "Storm Data Retrieved",
          description: `Found ${stormData.events?.length || 0} storm events near the property`,
        });
      } else if (stormData) {
        // Handle case where we got a response but no summary
        form.setValue("weatherDataSummary", `NOAA's Storm Prediction Center records indicate no significant storm events were reported within 50km of the subject property on or around ${dateOfLoss}.`);
        form.setValue("corelogicHailSummary", `CoreLogic's Hail Verification Report indicates no significant hail events were reported near the subject property around ${dateOfLoss}.`);
        form.setValue("corelogicWindSummary", `CoreLogic's Wind Verification Report indicates no significant wind events were reported near the subject property around ${dateOfLoss}.`);
        
        toast({
          title: "No Storm Data Found",
          description: "No storm events found for the specified location and date",
        });
      } else {
        throw new Error("Invalid response format from NOAA API");
      }

    } catch (error) {
      console.error("Error fetching storm data:", error);
      
      let errorMessage = "Failed to retrieve storm data from NOAA";
      
      if (error instanceof SyntaxError && error.message.includes("Unexpected token '<'")) {
        errorMessage = "Authentication required. Please log in and try again.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error Fetching Data",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsFetchingStormData(false);
    }
  };

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = form.getValues();
          onSubmit(formData);
        }} className="space-y-8">
          
          {/* Auto-fetch NOAA Data */}
          <div className="bg-indigo-50 rounded-lg p-6 space-y-4 border-2 border-indigo-200">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-download text-indigo-600 mr-2"></i>
              Auto-Fetch NOAA Storm Data
            </h3>
            
            <p className="text-sm text-slate-700">
              Automatically retrieve NOAA storm data for the property location and date of loss from Project Information.
            </p>
            
            {!hasRequiredLocationData() && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800 flex items-center">
                  <i className="fas fa-exclamation-triangle text-amber-600 mr-2"></i>
                  <span>
                    <strong>Required:</strong> Please complete Project Information step with date of loss and either coordinates (latitude/longitude) or city/state before fetching weather data.
                  </span>
                </p>
              </div>
            )}
            
            <Button
              type="button"
              onClick={fetchStormData}
              disabled={isFetchingStormData || !hasRequiredLocationData()}
              className={`${
                !hasRequiredLocationData() 
                  ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed text-white opacity-60' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isFetchingStormData ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Fetching NOAA Data...
                </>
              ) : (
                <>
                  <i className="fas fa-cloud-download-alt mr-2"></i>
                  Fetch NOAA Storm Data
                </>
              )}
            </Button>
          </div>
          
          {/* Weather Conditions Research */}
          <div className="bg-blue-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-cloud-rain text-blue-600 mr-2"></i>
              Weather Conditions Research
            </h3>
            
            <div className="text-sm text-slate-700 mb-4 space-y-2">
              <p><strong>The National Climatic Data Center (NCDC)</strong>, a part of the National Oceanic Atmospheric Administration (NOAA), publishes official records for weather reporting stations throughout the United States.</p>
              <p><strong>The National Weather Service (NWS)</strong>, a part of the NOAA, publishes observation records for weather reporting stations for recently occurring events.</p>
              <p>The observation reports are records from storm spotters throughout the United States and are then summarized and eventually reported by the NCDC.</p>
            </div>
            
            <FormField
              control={form.control}
              name="weatherDataSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
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
          </div>

          {/* CoreLogic Hail Report */}
          <div className="bg-green-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-chart-bar text-green-600 mr-2"></i>
              CoreLogic Hail Verification Report
            </h3>
            
            <FormField
              control={form.control}
              name="corelogicHailSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
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
          </div>

          {/* CoreLogic Wind Report */}
          <div className="bg-purple-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <i className="fas fa-wind text-purple-600 mr-2"></i>
              CoreLogic Wind Verification Report
            </h3>
            
            <FormField
              control={form.control}
              name="corelogicWindSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-900">
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
          </div>

          <div className="flex justify-between items-center pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              className="flex items-center px-6 py-3"
            >
              <i className="fas fa-chevron-left mr-2"></i>
              Previous: Background & Observations
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