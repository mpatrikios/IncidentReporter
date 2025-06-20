import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useFormPersistence } from "@/hooks/use-form-persistence";
import { FORM_STEPS } from "@/lib/types";
import { useAuth, useLogout } from "@/hooks/useAuth";
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Avatar,
  Chip,
  Card,
  CardContent,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Backdrop,
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Save,
  HelpOutline,
  Logout,
  Description,
  GetApp,
  Check,
  CloudUpload,
  AutoAwesome,
  PhotoLibrary,
} from '@mui/icons-material';

import type { StepRef } from "@/lib/types";
import type { ProjectInformation } from "@shared/schema";
import type { AssignmentScope } from "@shared/schema";
import type { BuildingAndSite } from "@shared/schema";
import type { Research } from "@shared/schema";
import type { DiscussionAndAnalysis } from "@shared/schema";
import type { Conclusions } from "@shared/schema";
import type { FormStep } from "@shared/schema";
import type { Report } from "@shared/schema";

// TurboTax-style Step Components
import { ProjectInformationStepTurboTax } from "@/components/wizard/project-information-turbotax";
import { AssignmentScopeStep } from "@/components/wizard/assignment-scope";
import { BuildingAndSiteStepTurboTax } from "@/components/wizard/building-and-site-turbotax";
import { ResearchStepTurboTax } from "@/components/wizard/research-turbotax";
import { DiscussionAndAnalysisStepTurboTax } from "@/components/wizard/discussion-and-analysis-turbotax";
import { ConclusionsStepTurboTax } from "@/components/wizard/conclusions-turbotax";

export default function ReportWizardTurboTax() {
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');
  const [showGenerationOptions, setShowGenerationOptions] = useState(false);
  const [aiEnhanceText, setAiEnhanceText] = useState(false);
  const [includePhotosInline, setIncludePhotosInline] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const logout = useLogout();
  const stepRef = useRef<StepRef<any>>(null);
  
  // Handle both URL formats: /report-wizard?edit=123 and /reports/123
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const editReportId = urlParams.get('edit');
  const pathReportId = id; // From /reports/:id route
  const reportId = editReportId || pathReportId || null;
  
  const { saveFormData, formatLastSaved } = useFormPersistence(reportId);

  // Fetch report data
  const { data: report, isLoading: reportLoading } = useQuery<Report>({
    queryKey: ["/api/reports", reportId],
    enabled: !!reportId,
  });

  // Fetch form steps
  const { data: steps = [] as FormStep[], isLoading: stepsLoading, refetch: refetchSteps } = useQuery<FormStep[]>({
    queryKey: ["/api/reports", reportId, "steps"],
    enabled: !!reportId,
  });

  // Create new report mutation
  const createReportMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/reports", data);
      return response.json();
    },
    onSuccess: (newReport) => {
      setLocation(`/reports/${newReport._id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create report. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Only create a new report if we're not editing an existing one
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!reportId && !editReportId && !pathReportId) {
        createReportMutation.mutate({
          title: "New Civil Engineering Report",
          reportType: "structural",
          status: "draft",
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [reportId, editReportId, pathReportId]);

  // Calculate completion progress
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
    { 
      name: "Conclusions", 
      completed: hasRequiredData(6, ['conclusions']) 
    },
  ];

  const completedCount = completedSections.filter(section => section.completed).length;
  const totalSections = completedSections.length;
  const completionPercentage = (completedCount / totalSections) * 100;
  const allSectionsComplete = completedSections.every(section => section.completed);

  const handleNext = async () => {
    if (stepRef.current) {
      await stepRef.current.save();
    }
    if (currentStep < FORM_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGoToDashboard = () => {
    setLocation("/");
  };

  const handleLogout = () => {
    logout.mutate();
  };

  // Document generation functions
  const handleGenerateGoogleDoc = async () => {
    setIsGeneratingDoc(true);
    setGenerationProgress(0);
    setGenerationMessage('Preparing your report...');
    setShowGenerationOptions(false);
    
    try {
      // Simulate progress updates
      const progressSteps = [
        { progress: 20, message: 'Compiling report data...' },
        { progress: 40, message: 'Authenticating with Google...' },
        { progress: 60, message: 'Creating document template...' },
        { progress: 80, message: 'Inserting content and formatting...' },
        { progress: 100, message: 'Finalizing document...' }
      ];

      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setGenerationProgress(step.progress);
        setGenerationMessage(step.message);
      }

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
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate Google Doc. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDoc(false);
      setGenerationProgress(0);
      setGenerationMessage('');
    }
  };

  const handleGenerateWordDoc = async () => {
    setIsGeneratingWord(true);
    setGenerationProgress(0);
    setGenerationMessage('Preparing your Word document...');
    setShowGenerationOptions(false);
    
    try {
      // Compile report data from steps
      const reportData = {
        projectInformation: getStepData(1),
        assignmentScope: getStepData(2),
        buildingObservations: getStepData(3),
        research: getStepData(4),
        discussionAnalysis: getStepData(5),
        conclusions: getStepData(6),
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

      // Check if client-side generation is feasible
      const canGenerateClientSide = await wordDocumentService.canGenerateClientSide(images);

      if (canGenerateClientSide) {
        // Client-side generation with actual download
        await wordDocumentService.generateDocument({
          title: report?.title || 'Engineering Report',
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
        // Fallback to server-side generation
        setGenerationMessage('Using server-side generation for large document...');
        
        const response = await fetch('/api/reports/generate-word', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: report?.title || 'Engineering Report',
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
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Server generation failed');
        }

        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(report?.title || 'Engineering_Report').replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Word Document Generated",
          description: "Your report has been downloaded successfully (server-side).",
        });
      }
    } catch (error: any) {
      console.error('Error during Word doc generation:', error);
      
      let errorMessage = "Failed to generate Word document. Please try again.";
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingWord(false);
      setGenerationProgress(0);
      setGenerationMessage('');
    }
  };

  if (!reportId || reportLoading || stepsLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const renderCurrentStep = () => {
    const stepProps = {
      initialData: getStepData(currentStep),
      onSubmit: () => {},
      reportId: reportId,
    };

    // Compile form data for components that need it
    const formData = {
      projectInformation: getStepData(1),
      assignmentScope: getStepData(2),
      buildingObservations: getStepData(3),
      research: getStepData(4),
      discussionAnalysis: getStepData(5),
      conclusions: getStepData(6),
    };

    switch (currentStep) {
      case 1:
        return <ProjectInformationStepTurboTax {...stepProps} ref={stepRef} />;
      case 2:
        return <AssignmentScopeStep {...stepProps} ref={stepRef} />;
      case 3:
        return <BuildingAndSiteStepTurboTax {...stepProps} ref={stepRef} />;
      case 4:
        return <ResearchStepTurboTax {...stepProps} ref={stepRef} formData={formData} steps={steps} />;
      case 5:
        return <DiscussionAndAnalysisStepTurboTax {...stepProps} ref={stepRef} />;
      case 6:
        return <ConclusionsStepTurboTax {...stepProps} ref={stepRef} initialTitle={report?.title} steps={steps} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <Box
        sx={{
          borderBottom: '1px solid #E8EAED',
          backgroundColor: '#FFFFFF',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}
      >
        <Container maxWidth="lg">
          <Stack 
            direction="row" 
            alignItems="center" 
            justifyContent="space-between"
            sx={{ py: 2 }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton
                onClick={handleGoToDashboard}
                sx={{ color: '#5E6C84' }}
                aria-label="Back to dashboard"
              >
                <ArrowBack />
              </IconButton>
              <Typography 
                variant="h6" 
                fontWeight={600}
                sx={{ color: '#0070BA' }}
              >
                Engineering Reports
              </Typography>
            </Stack>
            
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip 
                icon={<Save />}
                label="Auto-saved" 
                size="small" 
                color="success"
                variant="outlined"
                sx={{ display: { xs: 'none', sm: 'flex' } }}
              />
              <IconButton
                size="small"
                sx={{ color: '#5E6C84' }}
                aria-label="Get help"
              >
                <HelpOutline />
              </IconButton>
              
              <Button
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{ 
                  textTransform: 'none',
                  color: '#2C3E50',
                  fontWeight: 500,
                  minWidth: 'auto',
                }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#0070BA' }}>
                  {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </Avatar>
              </Button>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{ sx: { minWidth: 200, mt: 1 } }}
              >
                <Box px={2} py={1}>
                  <Typography variant="body2" fontWeight={600}>
                    {user?.fullName || user?.username}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <Logout fontSize="small" sx={{ mr: 1 }} />
                  Sign out
                </MenuItem>
              </Menu>
            </Stack>
          </Stack>
        </Container>

        {/* Overall Progress Bar */}
        <Box sx={{ px: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="body2" fontWeight={500} sx={{ color: '#2C3E50' }}>
              Report Completion
            </Typography>
            <Typography variant="body2" sx={{ color: '#5E6C84' }}>
              {completedCount} of {totalSections} sections complete
            </Typography>
          </Stack>
          <LinearProgress 
            variant="determinate" 
            value={completionPercentage} 
            sx={{ 
              height: 6,
              borderRadius: 3,
              backgroundColor: '#E8EAED',
              '& .MuiLinearProgress-bar': {
                backgroundColor: allSectionsComplete ? '#00AA3B' : '#0070BA',
                borderRadius: 3,
              }
            }}
          />
        </Box>

        {/* Step Progress with Navigation */}
        <Box sx={{ px: 3, pb: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight={500} sx={{ color: '#2C3E50' }}>
              Current Step: {FORM_STEPS[currentStep - 1]?.title}
            </Typography>
            
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton
                size="small"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                sx={{ 
                  color: currentStep === 1 ? '#C1C7D0' : '#0070BA',
                  '&:hover': {
                    backgroundColor: currentStep === 1 ? 'transparent' : '#F1F3F5',
                  },
                }}
                aria-label="Previous step"
              >
                <ArrowBack />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleNext}
                disabled={currentStep === FORM_STEPS.length}
                sx={{ 
                  color: currentStep === FORM_STEPS.length ? '#C1C7D0' : '#0070BA',
                  '&:hover': {
                    backgroundColor: currentStep === FORM_STEPS.length ? 'transparent' : '#F1F3F5',
                  },
                }}
                aria-label="Next step"
              >
                <ArrowForward />
              </IconButton>
              <Typography variant="body2" sx={{ color: '#5E6C84' }}>
                Step {currentStep} of {FORM_STEPS.length}
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Report Title */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            fontWeight={500} 
            gutterBottom
            sx={{ color: '#2C3E50' }}
          >
            {report?.title || 'Engineering Report'}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ color: '#5E6C84' }}
          >
            {FORM_STEPS[currentStep - 1]?.description}
          </Typography>
        </Box>

        {/* Main Content Area */}
        <Stack 
          direction={{ xs: 'column', lg: 'row' }} 
          spacing={4}
          alignItems="flex-start"
        >
          {/* Sidebar Progress */}
          <Box 
            sx={{ 
              width: { xs: '100%', lg: 280 },
              flexShrink: 0,
            }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography 
                  variant="subtitle2" 
                  fontWeight={600}
                  gutterBottom
                  sx={{ color: '#2C3E50' }}
                >
                  Section Progress
                </Typography>
                
                <Stack spacing={2}>
                  {completedSections.map((section, index) => (
                    <Stack 
                      key={index} 
                      direction="row" 
                      alignItems="center" 
                      spacing={2}
                      onClick={() => setCurrentStep(index + 1)}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 1,
                        p: 1,
                        ml: -1,
                        mr: -1,
                        '&:hover': {
                          backgroundColor: '#F5F5F5',
                        },
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: section.completed ? '#00AA3B' : currentStep === index + 1 ? '#0070BA' : '#E8EAED',
                          color: section.completed || currentStep === index + 1 ? '#FFFFFF' : '#6B778C',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {section.completed ? <Check sx={{ fontSize: 14 }} /> : index + 1}
                      </Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: section.completed ? '#00AA3B' : currentStep === index + 1 ? '#0070BA' : '#6B778C',
                          fontWeight: section.completed || currentStep === index + 1 ? 600 : 400,
                        }}
                      >
                        {section.name}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Generate Options */}
            {allSectionsComplete && (
              <Card sx={{ bgcolor: '#F0F8FF' }}>
                <CardContent>
                  <Typography 
                    variant="subtitle2" 
                    fontWeight={600}
                    gutterBottom
                    sx={{ color: '#0070BA' }}
                  >
                    🎉 Report Complete!
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ color: '#5E6C84', mb: 2 }}
                  >
                    Your report is ready to generate.
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => setShowGenerationOptions(true)}
                    sx={{ 
                      backgroundColor: '#00AA3B',
                      '&:hover': { backgroundColor: '#007A2A' },
                    }}
                  >
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            )}
          </Box>

          {/* Form Content */}
          <Box sx={{ flex: 1, width: '100%' }}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                {renderCurrentStep()}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <Stack 
              direction="row" 
              justifyContent="space-between" 
              alignItems="center"
              sx={{ mt: 4 }}
            >
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={handlePrevious}
                disabled={currentStep === 1}
                sx={{ 
                  minWidth: 120,
                  visibility: currentStep === 1 ? 'hidden' : 'visible',
                }}
              >
                Back
              </Button>

              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#6B778C',
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                Step {currentStep} of {FORM_STEPS.length}
              </Typography>

              <Button
                variant="contained"
                endIcon={<ArrowForward />}
                onClick={handleNext}
                disabled={currentStep === FORM_STEPS.length}
                sx={{ minWidth: 120 }}
              >
                {currentStep === FORM_STEPS.length ? 'Complete' : 'Continue'}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Container>

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
          
          <Stack spacing={2}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<CloudUpload />}
              onClick={handleGenerateGoogleDoc}
              sx={{ 
                py: 2,
                textAlign: 'left',
                justifyContent: 'flex-start',
              }}
            >
              <Box>
                <Typography variant="body1" fontWeight={500}>
                  Google Docs
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create an editable Google Doc in your Drive
                </Typography>
              </Box>
            </Button>
            
            <Button
              variant="outlined"
              fullWidth
              startIcon={<GetApp />}
              onClick={handleGenerateWordDoc}
              sx={{ 
                py: 2,
                textAlign: 'left',
                justifyContent: 'flex-start',
              }}
            >
              <Box>
                <Typography variant="body1" fontWeight={500}>
                  Word Document
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Download as a .docx file
                </Typography>
              </Box>
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGenerationOptions(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generation Progress Backdrop */}
      <Backdrop
        open={isGeneratingDoc || isGeneratingWord}
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
        }}
      >
        <Card sx={{ p: 4, minWidth: 320, textAlign: 'center' }}>
          <CardContent>
            <CircularProgress 
              variant="determinate" 
              value={generationProgress} 
              size={80}
              sx={{ 
                mb: 3,
                color: '#00AA3B',
              }}
            />
            <Typography variant="h6" fontWeight={500} gutterBottom>
              {isGeneratingDoc ? 'Generating Google Doc' : 'Generating Word Document'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {generationMessage}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={generationProgress}
              sx={{ 
                width: '100%',
                height: 6,
                borderRadius: 3,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#00AA3B',
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {generationProgress}% complete
            </Typography>
          </CardContent>
        </Card>
      </Backdrop>
    </Box>
  );
}