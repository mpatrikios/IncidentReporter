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

    // Get project information for automated research
    const getProjectData = () => {
      if (steps && steps.length > 0) {
        return steps.find(s => s.stepNumber === 1)?.data || {};
      }
      return formData?.projectInformation || {};
    };

    const projectData = getProjectData();

    const handleFetchStormData = async () => {
      const { insuredAddress, insuredCity, insuredState, dateOfLoss } = projectData;
      
      if (!insuredCity || !insuredState || !dateOfLoss) {
        toast({
          title: "Missing Information",
          description: "Please complete the project information section first to use automated research.",
          variant: "destructive",
        });
        return;
      }

      setIsFetchingStormData(true);
      
      try {
        const response = await apiRequest("POST", "/api/weather/storm-data", {
          location: `${insuredCity}, ${insuredState}`,
          date: dateOfLoss,
        });
        
        const stormData = await response.json();
        
        if (stormData.weatherData) {
          setValue("weatherDataSummary", stormData.weatherData);
        }
        if (stormData.hailData) {
          setValue("corelogicHailSummary", stormData.hailData);
        }
        if (stormData.windData) {
          setValue("corelogicWindSummary", stormData.windData);
        }
        
        toast({
          title: "Research Complete",
          description: "Weather and storm data has been automatically populated.",
        });
      } catch (error) {
        toast({
          title: "Research Failed",
          description: "Could not fetch storm data. Please enter the information manually.",
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

          {/* Automated Research Option */}
          {projectData.insuredCity && projectData.insuredState && projectData.dateOfLoss && (
            <Card sx={{ bgcolor: '#F0F8FF', border: '1px solid #90CAF9' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <AutoAwesome sx={{ color: '#0070BA' }} />
                  <Box flex={1}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#0070BA' }}>
                      Smart Research Assistant
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#5E6C84', mb: 2 }}>
                      We can automatically research weather data for {projectData.insuredCity}, {projectData.insuredState} on {new Date(projectData.dateOfLoss).toLocaleDateString()}.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={isFetchingStormData ? <CircularProgress size={16} color="inherit" /> : <CloudDownload />}
                      onClick={handleFetchStormData}
                      disabled={isFetchingStormData}
                      sx={{ backgroundColor: '#0070BA' }}
                    >
                      {isFetchingStormData ? 'Researching...' : 'Auto-Research Weather Data'}
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          )}

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