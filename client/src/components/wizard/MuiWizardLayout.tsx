import { ReactNode } from 'react';
import {
  Box,
  Container,
  Stepper,
  Step,
  StepLabel,
  StepIcon,
  Paper,
  Typography,
  Button,
  Stack,
  LinearProgress,
  useTheme,
  useMediaQuery,
  StepIconProps,
  styled,
} from '@mui/material';
import {
  Check,
  Description,
  Assignment,
  Home as HomeIcon,
  Science,
  Analytics,
  CheckCircle,
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
}

const stepIcons: { [key: number]: ReactNode } = {
  1: <Description />,
  2: <Assignment />,
  3: <HomeIcon />,
  4: <Science />,
  5: <Analytics />,
  6: <CheckCircle />,
};

const ColorlibStepIconRoot = styled('div')<{
  ownerState: { completed?: boolean; active?: boolean };
}>(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#ccc',
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  ...(ownerState.active && {
    backgroundColor: theme.palette.primary.main,
    boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
  }),
  ...(ownerState.completed && {
    backgroundColor: theme.palette.success.main,
  }),
}));

function ColorlibStepIcon(props: StepIconProps) {
  const { active, completed, className } = props;
  const icon = stepIcons[Number(props.icon)] || <Description />;

  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {completed ? <Check sx={{ fontSize: 28 }} /> : icon}
    </ColorlibStepIconRoot>
  );
}

export function MuiWizardLayout({
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
}: WizardLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 4 }}>
      {/* Progress Bar */}
      <LinearProgress 
        variant="determinate" 
        value={progress || progressPercentage} 
        sx={{ 
          height: 6,
          '& .MuiLinearProgress-bar': {
            backgroundColor: 'primary.main',
            transition: 'transform 0.4s ease',
          }
        }}
      />

      <Container maxWidth="lg" sx={{ pt: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Civil Engineering Report Wizard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Complete each section to generate your professional report
          </Typography>
        </Box>

        {/* Stepper */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 3,
            border: 1,
            borderColor: 'divider',
          }}
        >
          <Stepper 
            activeStep={currentStep - 1} 
            alternativeLabel={!isMobile}
            orientation={isMobile ? 'vertical' : 'horizontal'}
          >
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel
                  StepIconComponent={ColorlibStepIcon}
                  optional={
                    step.description && !isMobile ? (
                      <Typography variant="caption" color="text.secondary">
                        {step.description}
                      </Typography>
                    ) : undefined
                  }
                >
                  <Typography 
                    variant="body2" 
                    fontWeight={currentStep === index + 1 ? 600 : 400}
                  >
                    {step.label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Content Area */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            border: 1,
            borderColor: 'divider',
            minHeight: '400px',
            position: 'relative',
          }}
        >
          {/* Auto-save indicator */}
          {isSaving && (
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: 'text.secondary',
                fontSize: '0.875rem',
              }}
            >
              <LinearProgress sx={{ width: 60 }} />
              <Typography variant="caption">Saving...</Typography>
            </Box>
          )}

          {children}
        </Paper>

        {/* Navigation Buttons */}
        <Stack 
          direction="row" 
          justifyContent="space-between" 
          alignItems="center"
          sx={{ mt: 4 }}
        >
          <Button
            variant="outlined"
            onClick={onPrevious}
            disabled={isFirstStep}
            sx={{ minWidth: 140 }}
          >
            Previous
          </Button>

          <Typography variant="body2" color="text.secondary">
            Step {currentStep} of {steps.length}
          </Typography>

          {isLastStep ? (
            <Button
              variant="contained"
              onClick={onSave}
              disabled={isSaving}
              sx={{ minWidth: 140 }}
            >
              {isSaving ? 'Saving...' : 'Save Report'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={onNext}
              sx={{ minWidth: 140 }}
            >
              Next
            </Button>
          )}
        </Stack>

        {/* Help Text */}
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Need help? Contact support at support@engineering-reports.com
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}