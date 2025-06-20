import { forwardRef, useImperativeHandle, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { discussionAndAnalysisSchema, type DiscussionAndAnalysis } from "@shared/schema";
import {
  Box,
  TextField,
  Typography,
  Stack,
  Alert,
  Divider,
  Chip,
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  Assessment,
  Recommend,
} from '@mui/icons-material';
import { useAutoSave } from "@/hooks/use-auto-save";
import type { StepRef } from "@/lib/types";

interface DiscussionAndAnalysisProps {
  initialData?: Partial<DiscussionAndAnalysis>;
  onSubmit?: (data: DiscussionAndAnalysis) => void;
  reportId?: string | null;
}

export const DiscussionAndAnalysisStepTurboTax = forwardRef<StepRef<DiscussionAndAnalysis>, DiscussionAndAnalysisProps>(
  ({ initialData, onSubmit = () => {}, reportId }, ref) => {
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

    const { control, watch, reset, trigger, getValues } = form;
    
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

    const { isSaving } = useAutoSave(reportId, 5, watch());

    useEffect(() => {
      if (initialData && Object.keys(initialData).length > 0) {
        reset({
          siteDiscussionAnalysis: "",
          weatherDiscussionAnalysis: "",
          weatherImpactAnalysis: "",
          recommendationsAndDiscussion: "",
          ...initialData,
        });
      }
    }, [initialData, reset]);

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
              Now for your professional analysis
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ color: '#5E6C84' }}
            >
              This is where your engineering expertise shines. Provide your technical analysis connecting observations, research, and professional judgment.
            </Typography>
          </Box>

          {/* Site Discussion and Analysis */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
              <Psychology sx={{ color: '#0070BA' }} />
              <Typography 
                variant="h6" 
                fontWeight={500}
                sx={{ color: '#2C3E50' }}
              >
                What's your site analysis and engineering discussion?
              </Typography>
            </Stack>
            
            <Controller
              name="siteDiscussionAnalysis"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={7}
                  label="Site discussion and analysis"
                  placeholder="Provide your detailed engineering analysis of the site conditions and findings:

• Analysis of building performance during the event
• Discussion of damage mechanisms observed
• Evaluation of construction quality and building code compliance
• Assessment of any pre-existing conditions
• Engineering interpretation of damage patterns
• Structural or system performance evaluation
• Any relevant building science principles applied"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Apply your engineering expertise to interpret the site observations"}
                  required
                />
              )}
            />
          </Box>

          <Divider />

          {/* Weather Discussion and Analysis */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
              <TrendingUp sx={{ color: '#0070BA' }} />
              <Typography 
                variant="h6" 
                fontWeight={500}
                sx={{ color: '#2C3E50' }}
              >
                How do you interpret the weather data?
              </Typography>
            </Stack>
            
            <Controller
              name="weatherDiscussionAnalysis"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={6}
                  label="Weather discussion and analysis"
                  placeholder="Analyze the weather conditions and their significance:

• Interpretation of weather data in context of damage
• Severity assessment compared to design standards
• Discussion of weather event characteristics
• Analysis of timing and duration factors
• Comparison to historical weather events in the area
• Meteorological factors that contributed to damage
• Any unusual or significant weather patterns noted"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Connect the weather research to your engineering analysis"}
                  required
                />
              )}
            />
          </Box>

          <Divider />

          {/* Weather Impact Analysis */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
              <Assessment sx={{ color: '#0070BA' }} />
              <Typography 
                variant="h6" 
                fontWeight={500}
                sx={{ color: '#2C3E50' }}
              >
                What was the impact of weather on the building?
              </Typography>
            </Stack>
            
            <Controller
              name="weatherImpactAnalysis"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={6}
                  label="Weather impact analysis"
                  placeholder="Analyze how the weather event specifically impacted this building:

• Direct correlation between weather conditions and observed damage
• Building system vulnerabilities exposed by the weather event
• Failure mechanisms triggered by weather conditions
• Assessment of whether damage is consistent with reported weather
• Analysis of damage progression and sequence
• Evaluation of building's resistance to the weather forces
• Discussion of any protective or aggravating factors"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Establish the cause-and-effect relationship between weather and damage"}
                  required
                />
              )}
            />
          </Box>

          <Divider />

          {/* Recommendations and Discussion */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
              <Recommend sx={{ color: '#0070BA' }} />
              <Typography 
                variant="h6" 
                fontWeight={500}
                sx={{ color: '#2C3E50' }}
              >
                What are your professional recommendations?
              </Typography>
            </Stack>
            
            <Controller
              name="recommendationsAndDiscussion"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={5}
                  label="Recommendations and additional discussion (optional)"
                  placeholder="Provide any professional recommendations or additional discussion:

• Repair recommendations and methodologies
• Preventive measures for future events
• Building improvements or upgrades suggested
• Additional investigation recommendations
• Discussion of alternative damage scenarios
• Professional opinions on best practices
• Any other relevant engineering considerations"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Optional: Share your professional recommendations and insights"}
                />
              )}
            />
          </Box>

          {/* Analysis Tips */}
          <Alert 
            severity="success" 
            sx={{ 
              backgroundColor: '#E8F5E9',
              color: '#1B5E20',
              '& .MuiAlert-icon': {
                color: '#1B5E20',
              },
            }}
          >
            <Typography variant="body2">
              <strong>Professional Analysis Tips:</strong>
              <br />• Use technical terminology appropriate for your audience
              <br />• Support conclusions with engineering principles and standards
              <br />• Be objective and base analysis on factual observations
              <br />• Consider multiple damage scenarios when appropriate
              <br />• This analysis will form the foundation of your conclusions
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