import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { conclusionsSchema, type Conclusions } from "@shared/schema";
import { UnifiedDocumentGeneration } from "@/components/UnifiedDocumentGeneration";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
    const [showGenerationOptions, setShowGenerationOptions] = useState(false);
    const [aiEnhanceText, setAiEnhanceText] = useState(false);
    const [includePhotosInline, setIncludePhotosInline] = useState(false);
    const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
    const [isGeneratingWord, setIsGeneratingWord] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [generationMessage, setGenerationMessage] = useState('');
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
    const hasRequiredData = (stepNumber: number, requiredFields: string[]) => {
      const stepData = steps?.find(s => s.stepNumber === stepNumber)?.data || {};
      return requiredFields.every(field => {
        const value = stepData[field];
        return value && value.toString().trim().length > 0;
      });
    };

    const hasAnyData = (stepNumber: number, fields: string[]) => {
      const stepData = steps?.find(s => s.stepNumber === stepNumber)?.data || {};
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

    const getFormStepData = (stepNumber: number) => {
      return steps?.find(step => step.stepNumber === stepNumber)?.data || {};
    };

    const handleGenerateGoogleDoc = async () => {
      if (!reportId) {
        toast({
          title: "Error",
          description: "Report ID is missing. Please save the report first.",
          variant: "destructive",
        });
        return;
      }

      setIsGeneratingDoc(true);
      setGenerationProgress(0);
      setGenerationMessage('Starting document generation...');
      setShowGenerationOptions(false);
      
      try {
        // Start real-time progress tracking
        const eventSource = new EventSource(`/api/reports/${reportId}/generation-progress`);
        
        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          setGenerationProgress(data.progress);
          setGenerationMessage(data.message);
          
          if (data.completed) {
            eventSource.close();
          }
        };

        eventSource.onerror = (error) => {
          console.error('EventSource failed:', error);
          eventSource.close();
        };

        // Start the actual generation
        const response = await apiRequest("POST", `/api/reports/${reportId}/generate-doc`, {
          aiEnhanceText,
          includePhotosInline
        });
        
        const data = await response.json();
        
        if (data.documentUrl) {
          window.open(data.documentUrl, '_blank');
          toast({
            title: "Google Doc Generated",
            description: "Your report has been generated successfully.",
          });
        } else {
          throw new Error("No document URL returned from server");
        }
        
        // Close the event source
        eventSource.close();
      } catch (error) {
        console.error('Google Doc generation error:', error);
        toast({
          title: "Generation Failed",
          description: error instanceof Error ? error.message : "Failed to generate Google Doc. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsGeneratingDoc(false);
        setGenerationProgress(0);
        setGenerationMessage('');
      }
    };

    const handleGenerateWordDoc = async () => {
      if (!reportId) {
        toast({
          title: "Error",
          description: "Report ID is missing. Please save the report first.",
          variant: "destructive",
        });
        return;
      }

      setIsGeneratingWord(true);
      setGenerationProgress(0);
      setGenerationMessage('Preparing your Word document...');
      setShowGenerationOptions(false);
      
      try {
        // Compile report data from steps
        const reportData = {
          projectInformation: getFormStepData(1),
          assignmentScope: getFormStepData(2),
          buildingObservations: getFormStepData(3),
          research: getFormStepData(4),
          discussionAnalysis: getFormStepData(5),
          conclusions: getFormStepData(6),
        };

        // Get images from the report
        let images = [];
        try {
          const imagesResponse = await fetch(`/api/reports/${reportId}/images`);
          if (imagesResponse.ok) {
            images = await imagesResponse.json();
          }
        } catch (error) {
          console.warn('Failed to fetch images, proceeding without images:', error);
          images = [];
        }

        // Import the word document service dynamically
        const { wordDocumentService } = await import('@/services/wordDocumentService');

        setGenerationProgress(5);
        setGenerationMessage('Analyzing document size and complexity...');

        // Check if client-side generation is feasible
        const canGenerateClientSide = await wordDocumentService.canGenerateClientSide(images);

        if (canGenerateClientSide) {
          // Generate client-side
          await wordDocumentService.generateDocument({
            title: reportTitle || 'Engineering Report',
            reportData,
            images: images.map(img => ({
              originalFilename: img.originalFilename,
              s3Url: img.s3Url,
              publicUrl: img.publicUrl,
              fileSize: img.fileSize,
              description: img.description,
            })),
            includePhotosInline,
            aiEnhanceText,
            onProgress: (progress, message) => {
              setGenerationProgress(progress);
              setGenerationMessage(message);
            }
          });
          
          toast({
            title: "Word Document Generated",
            description: "Your report has been downloaded successfully.",
          });
        } else {
          // Fall back to server-side generation
          setGenerationMessage('Large report detected, generating on server...');
          
          const response = await apiRequest("POST", `/api/reports/${reportId}/generate-word`, {
            aiEnhanceText,
            includePhotosInline
          });
          
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Engineering_Report_${new Date().toISOString().split('T')[0]}.docx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          toast({
            title: "Word Document Generated",
            description: "Your report has been downloaded successfully.",
          });
        }
      } catch (error) {
        console.error('Word generation error:', error);
        toast({
          title: "Generation Failed",
          description: "Failed to generate Word document. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsGeneratingWord(false);
        setGenerationProgress(0);
        setGenerationMessage('');
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

              <Stack direction="row" spacing={2}>
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
                
                <UnifiedDocumentGeneration
                  reportId={reportId || ''}
                  reportTitle={reportTitle}
                  getFormStepData={getFormStepData}
                  trigger={
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<Description />}
                      disabled={!allSectionsComplete || !reportTitle.trim()}
                      sx={{ 
                        backgroundColor: '#0070BA',
                        '&:hover': { backgroundColor: '#005A9A' },
                        '&:disabled': { backgroundColor: '#E0E0E0' },
                      }}
                    >
                      Generate Report
                    </Button>
                  }
                />
              </Stack>
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

        {/* Generation Options Dialog */}
        <Dialog
          open={showGenerationOptions}
          onClose={() => setShowGenerationOptions(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight={600}>
              Generate Your Report
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose your preferred format and options for the final report.
            </Typography>
            
            {/* Generation Options */}
            <Box sx={{ mb: 4, p: 3, bgcolor: '#F8F9FA', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ color: '#2C3E50' }}>
                Generation Options
              </Typography>
              
              <Stack spacing={2}>
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
                      <Typography variant="caption" color="warning.main" sx={{ fontStyle: 'italic' }}>
                        Note: AI enhancement may take longer during peak usage times
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
            </Box>

            {/* Format Selection */}
            <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ color: '#2C3E50' }}>
              Choose Format
            </Typography>
            
            <Stack spacing={2}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={handleGenerateGoogleDoc}
                sx={{ justifyContent: 'flex-start', px: 3, py: 2 }}
              >
                <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                  <img 
                    src="https://www.gstatic.com/images/branding/product/2x/docs_48dp.png" 
                    alt="Google Docs" 
                    style={{ width: 32, height: 32 }}
                  />
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body1" fontWeight={500}>
                      Google Docs
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Opens in your browser for easy sharing
                    </Typography>
                  </Box>
                </Stack>
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={handleGenerateWordDoc}
                sx={{ justifyContent: 'flex-start', px: 3, py: 2 }}
              >
                <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/f/fd/Microsoft_Office_Word_%282019%E2%80%93present%29.svg" 
                    alt="Microsoft Word" 
                    style={{ width: 32, height: 32 }}
                  />
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body1" fontWeight={500}>
                      Microsoft Word
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Downloads to your computer
                    </Typography>
                  </Box>
                </Stack>
              </Button>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowGenerationOptions(false)}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        {/* Generation Progress Dialog */}
        <Dialog
          open={isGeneratingDoc || isGeneratingWord}
          disableEscapeKeyDown
          maxWidth="sm"
          fullWidth
        >
          <DialogContent>
            <Stack spacing={3} sx={{ py: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight={600} component="span">
                  {isGeneratingDoc ? 'Generating Google Doc' : 'Generating Word Document'}
                </Typography>
                {(aiEnhanceText && generationProgress > 65) && (
                  <Chip 
                    label="AI Enhanced" 
                    size="small" 
                    color="primary" 
                    sx={{ 
                      ml: 1,
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                      animation: 'pulse 2s ease-in-out infinite',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)', opacity: 1 },
                        '50%': { transform: 'scale(1.05)', opacity: 0.8 },
                        '100%': { transform: 'scale(1)', opacity: 1 }
                      }
                    }} 
                  />
                )}
              </Box>
              
              <Box sx={{ position: 'relative' }}>
                <LinearProgress 
                  variant="determinate" 
                  value={generationProgress} 
                  sx={{ 
                    height: 12, 
                    borderRadius: 6,
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 6,
                      background: 'linear-gradient(90deg, #4ECDC4, #45B7D1)',
                      backgroundSize: '300% 100%',
                      animation: 'shimmer 2s ease-in-out infinite',
                    },
                    '@keyframes shimmer': {
                      '0%': { backgroundPosition: '-200% 0' },
                      '100%': { backgroundPosition: '200% 0' }
                    }
                  }}
                />
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                  {(aiEnhanceText && generationProgress > 50 && generationProgress < 85) && (
                    <Box
                      sx={{
                        fontSize: '1.2rem',
                        animation: 'spin 2s linear infinite',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' }
                        }
                      }}
                    >
                      🤖
                    </Box>
                  )}
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{
                      fontWeight: aiEnhanceText && generationProgress > 50 && generationProgress < 85 ? 600 : 400,
                      color: aiEnhanceText && generationProgress > 50 && generationProgress < 85 
                        ? 'primary.main' 
                        : 'text.secondary',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {generationMessage || 'Starting generation...'}
                  </Typography>
                </Stack>
              </Box>
              
              <Typography variant="caption" color="text.secondary" align="center">
                {aiEnhanceText 
                  ? 'AI enhancement may take additional time for complex reports'
                  : 'This may take a minute for reports with many photos'
                }
              </Typography>
            </Stack>
          </DialogContent>
        </Dialog>
      </Box>
    );
  }
);