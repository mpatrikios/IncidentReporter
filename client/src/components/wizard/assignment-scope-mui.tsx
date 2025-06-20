import { forwardRef, useImperativeHandle, useEffect, ReactNode } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assignmentScopeSchema, type AssignmentScope } from "@shared/schema";
import {
  Box,
  TextField,
  Grid,
  Typography,
  Stack,
  Paper,
  Chip,
  FormHelperText,
} from '@mui/material';
import {
  People,
  Description,
  Note,
} from '@mui/icons-material';
import { useAutoSave } from "@/hooks/use-auto-save";
import type { StepRef } from "@/lib/types";

interface AssignmentScopeProps {
  initialData?: Partial<AssignmentScope>;
  onSubmit?: (data: AssignmentScope) => void;
  reportId?: string | null;
}

export const AssignmentScopeStepMUI = forwardRef<StepRef<AssignmentScope>, AssignmentScopeProps>(
  ({ initialData, onSubmit = () => {}, reportId }, ref) => {
    const form = useForm<AssignmentScope>({
      resolver: zodResolver(assignmentScopeSchema),
      defaultValues: {
        intervieweesNames: "",
        providedDocumentsTitles: "",
        additionalMethodologyNotes: "",
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

    const { isSaving } = useAutoSave(reportId, 2, watch());

    useEffect(() => {
      if (initialData && Object.keys(initialData).length > 0) {
        reset({
          intervieweesNames: "",
          providedDocumentsTitles: "",
          additionalMethodologyNotes: "",
          ...initialData,
        });
      }
    }, [initialData, reset]);

    const SectionHeader = ({ title, icon, description }: { title: string; icon: ReactNode; description?: string }) => (
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
          {icon}
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
        </Stack>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 5 }}>
            {description}
          </Typography>
        )}
      </Box>
    );

    return (
      <Box>
        <Stack spacing={4}>
          {/* Methodology Overview */}
          <Paper elevation={0} sx={{ p: 3, bgcolor: 'info.50', borderRadius: 2 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Document your investigation methodology, including interviews conducted and documents reviewed during your assessment.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This information will be included in the Methodology section of your report.
            </Typography>
          </Paper>

          {/* Interviewees Section */}
          <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
            <SectionHeader 
              title="Interviewees" 
              icon={<People color="primary" />}
              description="List all people interviewed during the site visit"
            />
            
            <Controller
              name="intervieweesNames"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={4}
                  label="Interviewee Names and Titles"
                  placeholder="Enter each interviewee on a new line, e.g.:
• John Smith - Property Manager
• Jane Doe - Maintenance Supervisor
• Bob Johnson - Building Owner"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Include name and title/role for each person interviewed"}
                  sx={{
                    '& .MuiInputBase-root': {
                      fontFamily: 'monospace',
                    },
                  }}
                />
              )}
            />
          </Paper>

          {/* Documents Reviewed Section */}
          <Paper elevation={0} sx={{ p: 3, bgcolor: 'blue.50', borderRadius: 2 }}>
            <SectionHeader 
              title="Documents Reviewed" 
              icon={<Description color="primary" />}
              description="List all documents provided and reviewed for this assessment"
            />
            
            <Controller
              name="providedDocumentsTitles"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={6}
                  label="Document Titles"
                  placeholder="Enter each document on a new line, e.g.:
• Insurance claim documentation
• Building plans and specifications (dated 2020)
• Maintenance records (2021-2024)
• Previous inspection reports
• Contractor estimates and invoices
• Weather event documentation"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "List all relevant documents reviewed during your investigation"}
                  sx={{
                    '& .MuiInputBase-root': {
                      fontFamily: 'monospace',
                    },
                  }}
                />
              )}
            />
          </Paper>

          {/* Additional Methodology Notes Section */}
          <Paper elevation={0} sx={{ p: 3, bgcolor: 'green.50', borderRadius: 2 }}>
            <SectionHeader 
              title="Additional Methodology Notes" 
              icon={<Note color="primary" />}
              description="Include any additional details about your investigation approach"
            />
            
            <Controller
              name="additionalMethodologyNotes"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={4}
                  label="Additional Notes (Optional)"
                  placeholder="Add any additional methodology details, such as:
• Special equipment used during inspection
• Areas that were inaccessible
• Limitations or constraints encountered
• Special testing or analysis performed"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Optional: Include any additional relevant methodology information"}
                  sx={{
                    '& .MuiInputBase-root': {
                      fontFamily: 'monospace',
                    },
                  }}
                />
              )}
            />
          </Paper>

          {/* Tips Section */}
          <Paper elevation={0} sx={{ p: 3, bgcolor: 'warning.50', borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom color="warning.dark">
              💡 Tips for Methodology Section
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                • Be specific with names and titles for credibility
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Include dates on documents when available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Note any limitations or access restrictions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • This section establishes the thoroughness of your investigation
              </Typography>
            </Stack>
          </Paper>
        </Stack>

        {/* Auto-save Status */}
        {isSaving && (
          <Box sx={{ mt: 2, textAlign: 'right' }}>
            <Chip 
              label="Auto-saving..." 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          </Box>
        )}
      </Box>
    );
  }
);