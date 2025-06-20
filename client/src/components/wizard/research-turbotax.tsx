import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { researchSchema, type Research } from "@shared/schema";
import {
  Box,
  TextField,
  Typography,
  Stack,
  Alert,
  Divider,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  CloudDownload,
  Science,
  Analytics,
  AutoAwesome,
} from '@mui/icons-material';
import { useAutoSave } from "@/hooks/use-auto-save";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StepRef } from "@/lib/types";

interface ResearchProps {
  initialData?: Partial<Research>;
  onSubmit?: (data: Research) => void;
  reportId?: string | null;
  formData?: any;
  steps?: any[];
}

export const ResearchStepTurboTax = forwardRef<StepRef<Research>, ResearchProps>(
  ({ initialData, onSubmit = () => {}, reportId, formData, steps }, ref) => {
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

    const { control, watch, reset, trigger, getValues, setValue } = form;
    
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

    const { isSaving } = useAutoSave(reportId, 4, watch());

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

        // Update form fields with the fetched data
        if (stormData && stormData.summary) {
          setValue("weatherDataSummary", stormData.summary);
          
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
            
            setValue("corelogicHailSummary", hailSummary);
          } else {
            setValue("corelogicHailSummary", `**CORELOGIC HAIL VERIFICATION REPORT**\n\nAnalysis Date: ${dateOfLoss}\nSearch Radius: 50km from subject property\nTotal Hail Events: 0\n\n**FINDINGS:**\nCoreLogic's Hail Verification Report indicates no documented hail events were reported within 50km of the subject property on or around ${dateOfLoss}.`);
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
            
            setValue("corelogicWindSummary", windSummary);
          } else {
            setValue("corelogicWindSummary", `**CORELOGIC WIND VERIFICATION REPORT**\n\nAnalysis Date: ${dateOfLoss}\nSearch Radius: 50km from subject property\nTotal Wind Events: 0\n\n**FINDINGS:**\nCoreLogic's Wind Verification Report indicates no documented wind events were reported within 50km of the subject property on or around ${dateOfLoss}.`);
          }

          toast({
            title: "Storm Data Retrieved",
            description: `Found ${stormData.events?.length || 0} storm events near the property`,
          });
        } else if (stormData) {
          // Handle case where we got a response but no summary
          setValue("weatherDataSummary", `NOAA's Storm Prediction Center records indicate no significant storm events were reported within 50km of the subject property on or around ${dateOfLoss}.`);
          setValue("corelogicHailSummary", `CoreLogic's Hail Verification Report indicates no significant hail events were reported near the subject property around ${dateOfLoss}.`);
          setValue("corelogicWindSummary", `CoreLogic's Wind Verification Report indicates no significant wind events were reported near the subject property around ${dateOfLoss}.`);
          
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
      <Box>
        <Stack spacing={5}>
          {/* Introduction */}
          <Box>
            <Typography 
              variant="h5" 
              fontWeight={500} 
              gutterBottom
              sx={{ color: '#2C3E50' }}
            >
              Let's gather the research data
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ color: '#5E6C84' }}
            >
              Document weather conditions and research findings that support your engineering analysis.
            </Typography>
          </Box>

          {/* NOAA Weather Data Fetch */}
          <Card sx={{ bgcolor: '#E3F2FD', border: '2px solid #1976D2' }}>
            <CardContent>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6" fontWeight={600} sx={{ color: '#1976D2', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CloudDownload />
                    Auto-Fetch NOAA Storm Data
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#5E6C84', mt: 1 }}>
                    Automatically retrieve NOAA storm data for the property location and date of loss from Project Information.
                  </Typography>
                </Box>

                {!hasRequiredLocationData() && (
                  <Alert severity="warning">
                    <strong>Required:</strong> Please complete Project Information step with date of loss and either coordinates (latitude/longitude) or city/state before fetching weather data.
                  </Alert>
                )}

                <Button
                  variant="contained"
                  startIcon={isFetchingStormData ? <CircularProgress size={16} color="inherit" /> : <CloudDownload />}
                  onClick={fetchStormData}
                  disabled={isFetchingStormData || !hasRequiredLocationData()}
                  sx={{ 
                    backgroundColor: hasRequiredLocationData() ? '#1976D2' : '#BDBDBD',
                    '&:hover': {
                      backgroundColor: hasRequiredLocationData() ? '#1565C0' : '#BDBDBD'
                    },
                    cursor: hasRequiredLocationData() ? 'pointer' : 'not-allowed'
                  }}
                >
                  {isFetchingStormData ? 'Fetching NOAA Data...' : 'Fetch NOAA Storm Data'}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Weather Data Summary */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
              <Science sx={{ color: '#0070BA' }} />
              <Typography 
                variant="h6" 
                fontWeight={500}
                sx={{ color: '#2C3E50' }}
              >
                What were the weather conditions?
              </Typography>
            </Stack>
            
            <Controller
              name="weatherDataSummary"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={6}
                  label="Weather data summary"
                  placeholder="Summarize the weather conditions during the loss event:

• Date and time of weather event
• Temperature, humidity, and atmospheric conditions
• Precipitation amounts and duration
• Wind speeds and direction
• Any severe weather warnings or watches issued
• Weather service reports and observations
• Comparison to historical weather patterns for the area"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Include all relevant meteorological data from official sources"}
                  required
                />
              )}
            />
          </Box>

          <Divider />

          {/* CoreLogic Hail Summary */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
              <Analytics sx={{ color: '#0070BA' }} />
              <Typography 
                variant="h6" 
                fontWeight={500}
                sx={{ color: '#2C3E50' }}
              >
                What does the hail verification show?
              </Typography>
            </Stack>
            
            <Controller
              name="corelogicHailSummary"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={5}
                  label="CoreLogic hail verification summary"
                  placeholder="Summarize the CoreLogic hail verification report findings:

• Hail occurrence confirmation (Yes/No)
• Maximum hail size reported in the area
• Duration and intensity of hail event
• Spatial extent of hail damage
• Correlation with damage patterns observed
• Any limitations or notes from the verification report"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Reference the official CoreLogic hail verification report"}
                  required
                />
              )}
            />
          </Box>

          <Divider />

          {/* CoreLogic Wind Summary */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
              <Analytics sx={{ color: '#0070BA' }} />
              <Typography 
                variant="h6" 
                fontWeight={500}
                sx={{ color: '#2C3E50' }}
              >
                What about the wind verification data?
              </Typography>
            </Stack>
            
            <Controller
              name="corelogicWindSummary"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={5}
                  label="CoreLogic wind verification summary"
                  placeholder="Summarize the CoreLogic wind verification report findings:

• Peak wind speeds recorded in the area
• Duration and direction of high winds
• Wind pattern and storm track
• Comparison to design wind speeds for the area
• Correlation with observed damage patterns
• Any microbursts or tornado activity noted"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Reference the official CoreLogic wind verification report"}
                  required
                />
              )}
            />
          </Box>

          {/* Research Tips */}
          <Alert 
            severity="info" 
            sx={{ 
              backgroundColor: '#E3F2FD',
              color: '#0D47A1',
              '& .MuiAlert-icon': {
                color: '#0D47A1',
              },
            }}
          >
            <Typography variant="body2">
              <strong>Research Tips:</strong>
              <br />• Use official sources like National Weather Service, CoreLogic, and NOAA
              <br />• Include specific measurements and timeframes when available
              <br />• Note any discrepancies between different data sources
              <br />• This research will support your damage causation analysis
            </Typography>
          </Alert>

          {/* Auto-save Status */}
          {isSaving && (
            <Box sx={{ textAlign: 'right' }}>
              <Chip 
                label="Auto-saving..." 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            </Box>
          )}
        </Stack>
      </Box>
    );
  }
);