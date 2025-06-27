import React, { useState } from 'react';
import { Button, Dialog, DialogContent, DialogActions, Stack, Box, Typography, Chip, LinearProgress, Checkbox, FormControlLabel } from '@mui/material';
import { Description, Close } from '@mui/icons-material';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface UnifiedDocumentGenerationProps {
  reportId: string;
  reportTitle?: string;
  getFormStepData: (stepNumber: number) => any;
  onGenerationComplete?: () => void;
  trigger?: React.ReactElement; // Custom trigger button
}

export function UnifiedDocumentGeneration({
  reportId,
  reportTitle,
  getFormStepData,
  onGenerationComplete,
  trigger
}: UnifiedDocumentGenerationProps) {
  const [showGenerationOptions, setShowGenerationOptions] = useState(false);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');
  const [includePhotosInline, setIncludePhotosInline] = useState(false);
  const [aiEnhanceText, setAiEnhanceText] = useState(true);
  const { toast } = useToast();

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
    setGenerationMessage('Preparing your report...');
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

      const response = await apiRequest("POST", `/api/reports/${reportId}/generate-doc`, {
        aiEnhanceText,
        includePhotosInline
      });
      
      const data = await response.json();
      
      if (data.documentUrl) {
        window.open(data.documentUrl, '_blank');
        toast({
          title: "Google Doc Generated",
          description: "Your report has been generated and opened in a new tab.",
        });
        onGenerationComplete?.();
      }
    } catch (error: any) {
      console.error('Google Doc generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate Google Doc. Please try again.",
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
      // Compile report data from steps with correct field names for server-side generation
      const reportData = {
        projectInformation: getFormStepData(1),
        assignmentScope: getFormStepData(2),
        buildingAndSite: getFormStepData(3), // Correct field name for server
        buildingObservations: getFormStepData(3), // Legacy support
        research: getFormStepData(4),
        discussionAndAnalysis: getFormStepData(5), // Correct field name for server
        discussionAnalysis: getFormStepData(5), // Legacy support
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

      setGenerationProgress(5);
      setGenerationMessage('Using server-side generation with MJSolutionsTemplate...');

      // ALWAYS use server-side generation with MJSolutionsTemplate to ensure consistency
      const response = await apiRequest("POST", `/api/reports/generate-word`, {
        title: reportTitle || 'Engineering Report',
        reportData,
        images,
        includePhotosInline,
        aiEnhanceText,
        templateId: 'MJSolutionsTemplate'
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
      onGenerationComplete?.();
    } catch (error: any) {
      console.error('Word generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate Word document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingWord(false);
      setGenerationProgress(0);
      setGenerationMessage('');
    }
  };

  const defaultTrigger = (
    <Button
      variant="contained"
      size="large"
      startIcon={<Description />}
      onClick={() => setShowGenerationOptions(true)}
      sx={{ 
        backgroundColor: '#0070BA',
        '&:hover': { backgroundColor: '#005A9A' },
      }}
    >
      Generate Report
    </Button>
  );

  return (
    <>
      {trigger ? React.cloneElement(trigger, { onClick: () => setShowGenerationOptions(true) }) : defaultTrigger}

      {/* Generation Options Dialog */}
      <Dialog
        open={showGenerationOptions}
        onClose={() => setShowGenerationOptions(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Stack spacing={3} sx={{ py: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={600} component="div">
                Generate Your Report
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Choose your preferred format and options
              </Typography>
            </Box>

            {/* Options */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ color: '#2C3E50' }}>
                Options
              </Typography>
              
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={aiEnhanceText}
                      onChange={(e) => setAiEnhanceText(e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        AI Text Enhancement
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Improve grammar, clarity, and professional tone
                      </Typography>
                    </Box>
                  }
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includePhotosInline}
                      onChange={(e) => setIncludePhotosInline(e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        Include Photos Inline
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Embed photos directly in the document (vs. listing filenames only)
                      </Typography>
                    </Box>
                  }
                />
              </Stack>
            </Box>
            
            {/* Format Selection */}
            <Box>
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
            </Box>
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
            
            <Box>
              <LinearProgress 
                variant="determinate" 
                value={generationProgress}
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: '#E3F2FD',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    borderRadius: 4,
                  }
                }} 
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {generationMessage}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(generationProgress)}%
                </Typography>
              </Box>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}