import { ReactNode } from 'react';
import {
  Box,
  Container,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Button,
  Stack,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Link,
  IconButton,
} from '@mui/material';
import {
  Check,
  ArrowBack,
  ArrowForward,
  HelpOutline,
  Save,
} from '@mui/icons-material';

interface WizardLayoutProps {
  children: ReactNode;
  currentStep: number;
  steps: Array<{
    label: string;
    description?: string;
  }>;
  onNext?: () => void;
  onPrevious?: () => void;
  onSave?: () => void;
  isLastStep?: boolean;
  isFirstStep?: boolean;
  isSaving?: boolean;
  progress?: number;
  reportTitle?: string;
}

export function TurboTaxWizardLayout({
  children,
  currentStep,
  steps,
  onNext,
  onPrevious,
  onSave,
  isLastStep = false,
  isFirstStep = false,
  isSaving = false,
  progress = 0,
  reportTitle = "Engineering Report",
}: WizardLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const progressPercentage = progress || ((currentStep - 1) / (steps.length - 1)) * 100;

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
            <Typography 
              variant="h6" 
              fontWeight={600}
              sx={{ color: '#0070BA' }}
            >
              Engineering Reports
            </Typography>
            
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="text"
                startIcon={<Save />}
                sx={{ 
                  color: '#5E6C84',
                  fontWeight: 500,
                  display: { xs: 'none', sm: 'flex' },
                }}
              >
                Saved automatically
              </Button>
              <IconButton
                size="small"
                sx={{ color: '#5E6C84' }}
                aria-label="Get help"
              >
                <HelpOutline />
              </IconButton>
            </Stack>
          </Stack>
        </Container>

        {/* Progress Bar */}
        <LinearProgress 
          variant="determinate" 
          value={progressPercentage} 
          sx={{ 
            height: 4,
            backgroundColor: '#E8EAED',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#00AA3B',
              transition: 'transform 0.4s ease',
            }
          }}
        />
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Title Section */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            fontWeight={500} 
            gutterBottom
            sx={{ color: '#2C3E50' }}
          >
            {reportTitle}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ color: '#5E6C84' }}
          >
            {steps[currentStep - 1]?.description || 'Complete this section to continue'}
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
            <Box
              sx={{
                p: 3,
                backgroundColor: '#F8F9FA',
                borderRadius: 2,
                border: '1px solid #E8EAED',
              }}
            >
              <Typography 
                variant="subtitle2" 
                fontWeight={600}
                gutterBottom
                sx={{ color: '#2C3E50' }}
              >
                Your Progress
              </Typography>
              
              <Stepper 
                activeStep={currentStep - 1} 
                orientation="vertical"
                sx={{ mt: 2 }}
              >
                {steps.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel
                      StepIconComponent={({ active, completed }) => (
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: completed ? '#00AA3B' : active ? '#0070BA' : '#E8EAED',
                            color: completed || active ? '#FFFFFF' : '#6B778C',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          {completed ? <Check sx={{ fontSize: 16 }} /> : index + 1}
                        </Box>
                      )}
                    >
                      <Typography 
                        variant="body2" 
                        fontWeight={currentStep === index + 1 ? 600 : 400}
                        sx={{ 
                          color: currentStep === index + 1 ? '#0070BA' : 
                                 index < currentStep - 1 ? '#00AA3B' : '#6B778C' 
                        }}
                      >
                        {step.label}
                      </Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>

            {/* Help Section */}
            <Box
              sx={{
                mt: 3,
                p: 3,
                backgroundColor: '#E3F2FD',
                borderRadius: 2,
                border: '1px solid #90CAF9',
              }}
            >
              <Stack spacing={1}>
                <Typography 
                  variant="subtitle2" 
                  fontWeight={600}
                  sx={{ color: '#0D47A1' }}
                >
                  Need help?
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ color: '#0D47A1' }}
                >
                  Our support team is here to help you complete your report.
                </Typography>
                <Link
                  href="#"
                  underline="always"
                  sx={{ 
                    color: '#0070BA',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  Contact support
                </Link>
              </Stack>
            </Box>
          </Box>

          {/* Form Content */}
          <Box sx={{ flex: 1, width: '100%' }}>
            <Box
              sx={{
                backgroundColor: '#FFFFFF',
                borderRadius: 2,
                minHeight: 400,
              }}
            >
              {children}
            </Box>

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
                onClick={onPrevious}
                disabled={isFirstStep}
                sx={{ 
                  minWidth: 120,
                  visibility: isFirstStep ? 'hidden' : 'visible',
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
                Step {currentStep} of {steps.length}
              </Typography>

              {isLastStep ? (
                <Button
                  variant="contained"
                  onClick={onSave}
                  disabled={isSaving}
                  sx={{ 
                    minWidth: 140,
                    backgroundColor: '#00AA3B',
                    '&:hover': {
                      backgroundColor: '#007A2A',
                    },
                  }}
                >
                  {isSaving ? 'Saving...' : 'Complete & Save'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  endIcon={<ArrowForward />}
                  onClick={onNext}
                  sx={{ minWidth: 120 }}
                >
                  Continue
                </Button>
              )}
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}