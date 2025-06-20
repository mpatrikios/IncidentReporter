import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { conclusionsSchema, type Conclusions } from "@shared/schema";
import {
  Box,
  TextField,
  Typography,
  Stack,
  Alert,
  Divider,
  Chip,
  Card,
  CardContent,
  Button,
  FormControlLabel,
  Switch,
  Grid,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle,
  Save,
  Description,
  GetApp,
  AutoAwesome,
  PhotoLibrary,
  Celebration,
} from '@mui/icons-material';
import { useAutoSave } from "@/hooks/use-auto-save";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { StepRef } from "@/lib/types";

interface ConclusionsProps {
  initialData?: Partial<Conclusions>;
  onSubmit?: (data: Conclusions) => void;
  reportId?: string | null;
  initialTitle?: string;
  steps?: any[];
}

export const ConclusionsStepTurboTax = forwardRef<StepRef<Conclusions>, ConclusionsProps>(
  ({ initialData, onSubmit = () => {}, reportId, initialTitle, steps }, ref) => {
    const [reportTitle, setReportTitle] = useState(initialTitle || "");
    const [isSaving, setIsSaving] = useState(false);
    const [aiEnhanceText, setAiEnhanceText] = useState(false);
    const [includePhotosInline, setIncludePhotosInline] = useState(false);
    const { toast } = useToast();
    const [, setLocation] = useLocation();

    const form = useForm<Conclusions>({
      resolver: zodResolver(conclusionsSchema),
      defaultValues: {
        conclusions: "",
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

    const { isSaving: isAutoSaving } = useAutoSave(reportId, 6, watch());

    // Auto-save the title
    useEffect(() => {
      if (!reportTitle.trim() || reportTitle === initialTitle) return;
      
      const timeoutId = setTimeout(async () => {
        try {
          await apiRequest("PATCH", `/api/reports/${reportId}`, {
            title: reportTitle.trim(),
          });
        } catch (error) {
          console.error("Failed to auto-save title:", error);
        }
      }, 1000);

      return () => clearTimeout(timeoutId);
    }, [reportTitle, reportId, initialTitle]);

    useEffect(() => {
      if (initialTitle) {
        setReportTitle(initialTitle);
      }
    }, [initialTitle]);

    useEffect(() => {
      if (initialData && Object.keys(initialData).length > 0) {
        reset({
          conclusions: "",
          ...initialData,
        });
      }
    }, [initialData, reset]);

    // Calculate completion status
    const getStepData = (stepNumber: number) => {
      return steps?.find(s => s.stepNumber === stepNumber)?.data || {};
    };

    const hasRequiredData = (stepNumber: number, requiredFields: string[]) => {
      const stepData = getStepData(stepNumber);
      return requiredFields.every(field => {
        const value = stepData[field];
        return value && value.toString().trim().length > 0;
      });
    };

    const hasAnyData = (stepNumber: number, fields: string[]) => {
      const stepData = getStepData(stepNumber);
      return fields.some(field => {
        const value = stepData[field];
        return value && value.toString().trim().length > 0;
      });
    };

    const completedSections = [
      { 
        name: "Project Information", 
        completed: hasRequiredData(1, ['insuredName', 'insuredAddress', 'fileNumber', 'claimNumber', 'clientCompany', 'clientContact', 'dateOfLoss', 'siteVisitDate', 'engineerName']) 
      },
      { 
        name: "Assignment Scope", 
        completed: hasAnyData(2, ['intervieweesNames', 'providedDocumentsTitles', 'additionalMethodologyNotes']) 
      },
      { 
        name: "Building & Site Observations", 
        completed: hasRequiredData(3, ['buildingSystemDescription', 'exteriorObservations', 'interiorObservations']) 
      },
      { 
        name: "Research", 
        completed: hasRequiredData(4, ['weatherDataSummary', 'corelogicHailSummary', 'corelogicWindSummary']) 
      },
      { 
        name: "Discussion & Analysis", 
        completed: hasRequiredData(5, ['siteDiscussionAnalysis', 'weatherDiscussionAnalysis', 'weatherImpactAnalysis']) 
      },
    ];

    const allPreviousSectionsComplete = completedSections.every(section => section.completed);
    const currentConclusionsComplete = hasRequiredData(6, ['conclusions']);
    const allSectionsComplete = allPreviousSectionsComplete && currentConclusionsComplete;

    const handleSaveReport = async () => {
      if (!reportTitle.trim()) {
        toast({
          title: "Title Required",
          description: "Please enter a title for your report.",
          variant: "destructive",
        });
        return;
      }

      setIsSaving(true);
      try {
        await apiRequest("POST", `/api/reports/${reportId}/save`, {
          title: reportTitle.trim(),
        });
        
        toast({
          title: "Report Saved",
          description: "Your report has been saved successfully.",
        });

        setTimeout(() => {
          setLocation("/");
        }, 1000);
        
      } catch (error) {
        toast({
          title: "Save Failed", 
          description: "Failed to save report. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
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
              Time for your professional conclusions
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ color: '#5E6C84' }}
            >
              Summarize your findings and provide your final engineering conclusions based on all the evidence.
            </Typography>
          </Box>

          {/* Report Title */}
          <Box>
            <Typography 
              variant="h6" 
              fontWeight={500} 
              gutterBottom
              sx={{ color: '#2C3E50', mb: 3 }}
            >
              What should we call this report?
            </Typography>
            
            <TextField
              fullWidth
              label="Report title"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="Civil Engineering Report - Property Name - Date"
              helperText="This will appear as the main title of your report"
              required
            />
          </Box>

          <Divider />

          {/* Conclusions */}
          <Box>
            <Typography 
              variant="h6" 
              fontWeight={500} 
              gutterBottom
              sx={{ color: '#2C3E50', mb: 3 }}
            >
              What are your engineering conclusions?
            </Typography>
            
            <Controller
              name="conclusions"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={8}
                  label="Professional conclusions"
                  placeholder="Provide your clear, concise engineering conclusions:

• Summary of key findings from your investigation
• Final determination regarding cause of damage
• Professional engineering opinion on damage mechanisms
• Conclusions about weather event impact
• Assessment of any contributing factors
• Any limitations or additional considerations
• Recommendations for remediation or further investigation"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "State your professional conclusions clearly and definitively"}
                  required
                />
              )}
            />
          </Box>

          <Divider />

          {/* Completion Status */}
          <Card sx={{ bgcolor: allSectionsComplete ? '#E8F5E9' : '#FFF3E0' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                {allSectionsComplete ? (
                  <Celebration sx={{ color: '#00AA3B' }} />
                ) : (
                  <CheckCircle sx={{ color: '#FFA000' }} />
                )}
                <Typography 
                  variant="h6" 
                  fontWeight={600}
                  sx={{ color: allSectionsComplete ? '#00AA3B' : '#FFA000' }}
                >
                  {allSectionsComplete ? 'Report Complete!' : 'Report Status'}
                </Typography>
              </Stack>
              
              <Grid container spacing={2}>
                {completedSections.map((section, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          backgroundColor: section.completed ? '#00AA3B' : '#E0E0E0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {section.completed && (
                          <CheckCircle sx={{ fontSize: 12, color: 'white' }} />
                        )}
                      </Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: section.completed ? '#00AA3B' : '#6B778C',
                          fontWeight: section.completed ? 500 : 400,
                        }}
                      >
                        {section.name}
                      </Typography>
                    </Stack>
                  </Grid>
                ))}
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: currentConclusionsComplete ? '#00AA3B' : '#E0E0E0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {currentConclusionsComplete && (
                        <CheckCircle sx={{ fontSize: 12, color: 'white' }} />
                      )}
                    </Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: currentConclusionsComplete ? '#00AA3B' : '#6B778C',
                        fontWeight: currentConclusionsComplete ? 500 : 400,
                      }}
                    >
                      Conclusions
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>

              {allSectionsComplete && (
                <Alert 
                  severity="success" 
                  sx={{ mt: 2, backgroundColor: 'transparent', color: '#00AA3B' }}
                >
                  🎉 Your report is complete and ready to generate!
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Document Generation Options */}
          {allSectionsComplete && (
            <Card sx={{ bgcolor: '#F0F8FF', border: '1px solid #90CAF9' }}>
              <CardContent>
                <Typography 
                  variant="h6" 
                  fontWeight={600}
                  gutterBottom
                  sx={{ color: '#0070BA' }}
                >
                  Generation Options
                </Typography>
                
                <Stack spacing={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={aiEnhanceText}
                        onChange={(e) => setAiEnhanceText(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <AutoAwesome sx={{ fontSize: 16, color: '#0070BA' }} />
                          <Typography variant="body2" fontWeight={500}>
                            AI-enhance bullet points into professional paragraphs
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          Convert bullet points in long-form fields to polished, professional paragraphs
                        </Typography>
                      </Box>
                    }
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={includePhotosInline}
                        onChange={(e) => setIncludePhotosInline(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <PhotoLibrary sx={{ fontSize: 16, color: '#0070BA' }} />
                          <Typography variant="body2" fontWeight={500}>
                            Include photos inline in document
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          Embed photos directly in the document (vs. listing filenames only)
                        </Typography>
                      </Box>
                    }
                  />
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Save Report */}
          <Card>
            <CardContent>
              <Typography 
                variant="h6" 
                fontWeight={600}
                gutterBottom
                sx={{ color: '#2C3E50' }}
              >
                Ready to save your report?
              </Typography>
              
              <Typography 
                variant="body2" 
                sx={{ color: '#5E6C84', mb: 3 }}
              >
                Save your completed report to the dashboard. You can generate documents anytime after saving.
              </Typography>

              <Button
                variant="contained"
                size="large"
                startIcon={isSaving ? <LinearProgress /> : <Save />}
                onClick={handleSaveReport}
                disabled={!allSectionsComplete || !reportTitle.trim() || isSaving}
                sx={{ 
                  backgroundColor: '#00AA3B',
                  '&:hover': { backgroundColor: '#007A2A' },
                  '&:disabled': { backgroundColor: '#E0E0E0' },
                }}
              >
                {isSaving ? 'Saving Report...' : 'Save Complete Report'}
              </Button>
            </CardContent>
          </Card>

          {/* Professional Note */}
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
              <strong>Professional Standards:</strong> Ensure your conclusions are supported by your observations and analysis. Your engineering seal and professional judgment are the foundation of this report's credibility.
            </Typography>
          </Alert>

          {/* Auto-save Status */}
          {(isAutoSaving || isSaving) && (
            <Box sx={{ textAlign: 'right' }}>
              <Chip 
                label={isSaving ? "Saving report..." : "Auto-saving..."} 
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