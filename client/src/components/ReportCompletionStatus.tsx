import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Stack,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Warning,
  ExpandMore,
  Assignment,
  ReportProblem,
} from '@mui/icons-material';

export interface StepCompletionStatus {
  stepNumber: number;
  stepName: string;
  isComplete: boolean;
  isRequired: boolean;
  missingFields: string[];
  completionPercentage: number;
}

export interface ReportCompletionStatus {
  isComplete: boolean;
  overallPercentage: number;
  requiredStepsComplete: number;
  totalRequiredSteps: number;
  steps: StepCompletionStatus[];
  missingRequiredSteps: string[];
}

interface ReportCompletionStatusProps {
  completionStatus: ReportCompletionStatus;
  onStepClick?: (stepNumber: number) => void;
}

// Friendly field name mappings
const FIELD_NAMES: Record<string, string> = {
  fileNumber: "EFI Global File Number",
  insuredName: "Insured Name",
  clientCompany: "Client Company",
  dateOfLoss: "Date of Loss",
  engineerName: "Engineer Name",
  city: "City",
  state: "State",
  intervieweesNames: "Interviewees",
  providedDocumentsTitles: "Provided Documents",
  buildingSystemDescription: "Building System Description",
  exteriorObservations: "Exterior Observations",
  interiorObservations: "Interior Observations",
  weatherDataSummary: "Weather Data Summary",
  corelogicHailSummary: "CoreLogic Hail Summary",
  corelogicWindSummary: "CoreLogic Wind Summary",
  siteDiscussionAnalysis: "Site Discussion & Analysis",
  weatherDiscussionAnalysis: "Weather Discussion & Analysis",
  conclusions: "Conclusions",
};

const getStatusColor = (percentage: number) => {
  if (percentage >= 100) return 'success';
  if (percentage >= 75) return 'info';
  if (percentage >= 50) return 'warning';
  return 'error';
};

const getStatusIcon = (isComplete: boolean, isRequired: boolean) => {
  if (isComplete) {
    return <CheckCircle color="success" />;
  }
  if (isRequired) {
    return <ReportProblem color="error" />;
  }
  return <RadioButtonUnchecked color="action" />;
};

export function ReportCompletionStatusComponent({ 
  completionStatus, 
  onStepClick 
}: ReportCompletionStatusProps) {
  const { isComplete, overallPercentage, steps, missingRequiredSteps } = completionStatus;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Stack spacing={3}>
          {/* Header */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <Assignment color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Report Completion Status
              </Typography>
              <Chip 
                label={isComplete ? "Complete" : "Incomplete"} 
                color={isComplete ? "success" : "warning"}
                size="small"
              />
            </Stack>

            {/* Overall Progress */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ minWidth: 'auto' }}>
                Overall Progress
              </Typography>
              <Box sx={{ flexGrow: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={overallPercentage} 
                  color={getStatusColor(overallPercentage)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Typography variant="body2" fontWeight={600}>
                {overallPercentage}%
              </Typography>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {completionStatus.requiredStepsComplete} of {completionStatus.totalRequiredSteps} required sections complete
            </Typography>
          </Box>

          {/* Missing Requirements Alert */}
          {!isComplete && missingRequiredSteps.length > 0 && (
            <Alert severity="warning" icon={<Warning />}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Missing Required Sections:
              </Typography>
              <Typography variant="body2">
                {missingRequiredSteps.join(', ')}
              </Typography>
            </Alert>
          )}

          {/* Success Message */}
          {isComplete && (
            <Alert severity="success">
              <Typography variant="body2" fontWeight={600}>
                ✓ Report Complete!
              </Typography>
              <Typography variant="body2">
                All required sections have been completed. Your report is ready for submission.
              </Typography>
            </Alert>
          )}

          {/* Step Details */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="body2" fontWeight={600}>
                View Section Details ({steps.filter(s => s.isComplete).length}/{steps.length} sections complete)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {steps.map((step, index) => (
                  <React.Fragment key={step.stepNumber}>
                    <ListItem
                      button={!!onStepClick}
                      onClick={() => onStepClick?.(step.stepNumber)}
                      sx={{
                        cursor: onStepClick ? 'pointer' : 'default',
                        '&:hover': onStepClick ? { bgcolor: 'action.hover' } : {}
                      }}
                    >
                      <ListItemIcon>
                        {getStatusIcon(step.isComplete, step.isRequired)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Typography variant="body2" fontWeight={600}>
                              {step.stepName}
                            </Typography>
                            <Chip 
                              label={`${step.completionPercentage}%`}
                              size="small"
                              color={getStatusColor(step.completionPercentage)}
                              variant="outlined"
                            />
                          </Stack>
                        }
                        secondary={
                          step.missingFields.length > 0 ? (
                            <Typography variant="caption" color="error">
                              Missing: {step.missingFields.map(f => FIELD_NAMES[f] || f).join(', ')}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="success.main">
                              All fields complete
                            </Typography>
                          )
                        }
                      />
                    </ListItem>
                    {index < steps.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        </Stack>
      </CardContent>
    </Card>
  );
}