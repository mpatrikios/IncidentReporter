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
  Autocomplete,
  Alert,
  Divider,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAutoSave } from "@/hooks/use-auto-save";
import type { StepRef } from "@/lib/types";

interface ProjectInformationProps {
  initialData?: Partial<ProjectInformation>;
  onSubmit?: (data: ProjectInformation) => void;
  reportId?: string | null;
}

export const ProjectInformationStepTurboTax = forwardRef<StepRef<ProjectInformation>, ProjectInformationProps>(
  ({ initialData, onSubmit = () => {}, reportId }, ref) => {
    const form = useForm<ProjectInformation>({
      resolver: zodResolver(projectInformationSchema),
      defaultValues: {
        fileNumber: "",
        dateOfCreation: "",
        insuredName: "",
        insuredAddress: "",
        city: "",
        state: "",
        zipCode: "",
        claimNumber: "",
        clientCompany: "",
        clientContact: "",
        dateOfLoss: "",
        siteVisitDate: "",
        engineerName: "",
        technicalReviewer: "",
        receivedDate: "",
        latitude: undefined,
        longitude: undefined,
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
          fileNumber: "",
          dateOfCreation: "",
          insuredName: "",
          insuredAddress: "",
          city: "",
          state: "",
          zipCode: "",
          claimNumber: "",
          clientCompany: "",
          clientContact: "",
          dateOfLoss: "",
          siteVisitDate: "",
          engineerName: "",
          technicalReviewer: "",
          receivedDate: "",
          latitude: undefined,
          longitude: undefined,
          ...initialData,
        });
      }
    }, [initialData, reset]);

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
          <Stack spacing={5}>
            {/* Introduction */}
            <Box>
              <Typography 
                variant="h5" 
                fontWeight={500} 
                gutterBottom
                sx={{ color: '#2C3E50' }}
              >
                Let's start with the basic information
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ color: '#5E6C84' }}
              >
                We'll need details about the insured property and your client to generate the report.
              </Typography>
            </Box>

            {/* Insured Information */}
            <Box>
              <Typography 
                variant="h6" 
                fontWeight={500} 
                gutterBottom
                sx={{ color: '#2C3E50', mb: 3 }}
              >
                Who is the insured party?
              </Typography>
              
              <Stack spacing={3}>
                <Controller
                  name="insuredName"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Insured name"
                      placeholder="e.g., John Smith or ABC Company"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      required
                    />
                  )}
                />

                <Controller
                  name="insuredAddress"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Property address"
                      placeholder="123 Main Street"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      required
                    />
                  )}
                />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={5}>
                    <Controller
                      name="city"
                      control={control}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="City"
                          placeholder="City"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          required
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Controller
                      name="state"
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

                  <Grid item xs={6} sm={4}>
                    <Controller
                      name="zipCode"
                      control={control}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="ZIP code"
                          placeholder="12345"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          required
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Stack>
            </Box>

            <Divider />

            {/* Claim Information */}
            <Box>
              <Typography 
                variant="h6" 
                fontWeight={500} 
                gutterBottom
                sx={{ color: '#2C3E50', mb: 3 }}
              >
                What are the claim details?
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="fileNumber"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Your file number"
                        placeholder="FILE-2024-001"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message || "Your internal reference number"}
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
                        label="Insurance claim number"
                        placeholder="CLM-2024-12345"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message || "The insurance company's claim number"}
                        required
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Client Information */}
            <Box>
              <Typography 
                variant="h6" 
                fontWeight={500} 
                gutterBottom
                sx={{ color: '#2C3E50', mb: 3 }}
              >
                Who is your client?
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="clientCompany"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Client company"
                        placeholder="Insurance Company LLC"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        required
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="clientContact"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Contact person"
                        placeholder="Jane Doe"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        required
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="clientEmail"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Email address"
                        type="email"
                        placeholder="contact@company.com"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="clientPhone"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Phone number"
                        placeholder="(555) 123-4567"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Important Dates */}
            <Box>
              <Typography 
                variant="h6" 
                fontWeight={500} 
                gutterBottom
                sx={{ color: '#2C3E50', mb: 3 }}
              >
                When did the loss occur?
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="dateOfLoss"
                    control={control}
                    render={({ field, fieldState }) => (
                      <DatePicker
                        label="Date of loss"
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
                        label="Site visit date"
                        value={field.value ? new Date(field.value) : null}
                        onChange={(date) => field.onChange(date?.toISOString().split('T')[0] || '')}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!fieldState.error,
                            helperText: fieldState.error?.message || 'When you inspected the property',
                            required: true,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Engineer Information */}
            <Box>
              <Typography 
                variant="h6" 
                fontWeight={500} 
                gutterBottom
                sx={{ color: '#2C3E50', mb: 3 }}
              >
                Who conducted the inspection?
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={8}>
                  <Controller
                    name="engineerName"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Engineer name"
                        placeholder="Jane Smith, P.E."
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message || "Include professional designation if applicable"}
                        required
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Controller
                    name="licenseNumber"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="License number"
                        placeholder="PE-12345"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message || "Optional"}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Helper Alert */}
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
                <strong>Tip:</strong> Double-check the property address and claim numbers. These will appear throughout your report.
              </Typography>
            </Alert>
          </Stack>
        </Box>
      </LocalizationProvider>
    );
  }
);