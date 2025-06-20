import { forwardRef, useImperativeHandle, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectInformationSchema, type ProjectInformation } from "@shared/schema";
import {
  Box,
  TextField,
  Grid,
  Typography,
  Stack,
  Paper,
  InputAdornment,
  Autocomplete,
  Chip,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Person,
  Business,
  Phone,
  Email,
  Description,
  CalendarToday,
  Engineering,
} from '@mui/icons-material';
import { useAutoSave } from "@/hooks/use-auto-save";
import type { StepRef } from "@/lib/types";

interface ProjectInformationProps {
  initialData?: Partial<ProjectInformation>;
  onSubmit?: (data: ProjectInformation) => void;
  reportId?: string | null;
}

export const ProjectInformationStepMUI = forwardRef<StepRef<ProjectInformation>, ProjectInformationProps>(
  ({ initialData, onSubmit = () => {}, reportId }, ref) => {
    const form = useForm<ProjectInformation>({
      resolver: zodResolver(projectInformationSchema),
      defaultValues: {
        insuredName: "",
        insuredAddress: "",
        insuredCity: "",
        insuredState: "",
        insuredZip: "",
        fileNumber: "",
        claimNumber: "",
        clientCompany: "",
        clientContact: "",
        clientEmail: "",
        clientPhone: "",
        dateOfLoss: "",
        siteVisitDate: "",
        engineerName: "",
        licenseNumber: "",
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

    const { isSaving } = useAutoSave(reportId, 1, watch());

    useEffect(() => {
      if (initialData && Object.keys(initialData).length > 0) {
        reset({
          insuredName: "",
          insuredAddress: "",
          insuredCity: "",
          insuredState: "",
          insuredZip: "",
          fileNumber: "",
          claimNumber: "",
          clientCompany: "",
          clientContact: "",
          clientEmail: "",
          clientPhone: "",
          dateOfLoss: "",
          siteVisitDate: "",
          engineerName: "",
          licenseNumber: "",
          ...initialData,
        });
      }
    }, [initialData, reset]);

    const SectionHeader = ({ title, icon }: { title: string; icon: ReactNode }) => (
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        {icon}
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
      </Stack>
    );

    const USStates = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ];

    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box>
          <Stack spacing={4}>
            {/* Insured Information Section */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <SectionHeader title="Insured Information" icon={<Person color="primary" />} />
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Controller
                    name="insuredName"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Insured Name"
                        placeholder="Enter the name of the insured party"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        required
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="insuredAddress"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Street Address"
                        placeholder="123 Main Street"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        required
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={5}>
                  <Controller
                    name="insuredCity"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="City"
                        placeholder="City name"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        required
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={6} sm={3} md={3}>
                  <Controller
                    name="insuredState"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Autocomplete
                        value={field.value}
                        onChange={(_, value) => field.onChange(value)}
                        options={USStates}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="State"
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                            required
                          />
                        )}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={6} sm={3} md={4}>
                  <Controller
                    name="insuredZip"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="ZIP Code"
                        placeholder="12345"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        required
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* File Information Section */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'blue.50', borderRadius: 2 }}>
              <SectionHeader title="File Information" icon={<Description color="primary" />} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="fileNumber"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="File Number"
                        placeholder="FILE-2024-001"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        required
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="claimNumber"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Claim Number"
                        placeholder="CLM-2024-12345"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        required
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Client Information Section */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'green.50', borderRadius: 2 }}>
              <SectionHeader title="Client Information" icon={<Business color="primary" />} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="clientCompany"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Client Company"
                        placeholder="Insurance Company LLC"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Business color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="clientContact"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Client Contact Name"
                        placeholder="John Doe"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="clientEmail"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Client Email"
                        type="email"
                        placeholder="contact@company.com"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="clientPhone"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Client Phone"
                        placeholder="(555) 123-4567"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Phone color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Important Dates Section */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'orange.50', borderRadius: 2 }}>
              <SectionHeader title="Important Dates" icon={<CalendarToday color="primary" />} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="dateOfLoss"
                    control={control}
                    render={({ field, fieldState }) => (
                      <DatePicker
                        label="Date of Loss"
                        value={field.value ? new Date(field.value) : null}
                        onChange={(date) => field.onChange(date?.toISOString().split('T')[0] || '')}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!fieldState.error,
                            helperText: fieldState.error?.message || 'When the incident occurred',
                            required: true,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="siteVisitDate"
                    control={control}
                    render={({ field, fieldState }) => (
                      <DatePicker
                        label="Site Visit Date"
                        value={field.value ? new Date(field.value) : null}
                        onChange={(date) => field.onChange(date?.toISOString().split('T')[0] || '')}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!fieldState.error,
                            helperText: fieldState.error?.message || 'When the site inspection was conducted',
                            required: true,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Engineering Team Section */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'purple.50', borderRadius: 2 }}>
              <SectionHeader title="Engineering Team" icon={<Engineering color="primary" />} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Controller
                    name="engineerName"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Lead Engineer Name"
                        placeholder="Jane Smith, P.E."
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Engineering color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="licenseNumber"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="License Number"
                        placeholder="PE-12345"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>
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
      </LocalizationProvider>
    );
  }
);