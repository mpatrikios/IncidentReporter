import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { buildingAndSiteSchema, type BuildingAndSite } from "@shared/schema";
import {
  Box,
  TextField,
  Grid,
  Typography,
  Stack,
  Alert,
  Divider,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  PhotoCamera,
  Business,
  Home,
  Description,
} from '@mui/icons-material';
import { useAutoSave } from "@/hooks/use-auto-save";
import { ImageUpload } from "@/components/ImageUpload";
import type { StepRef } from "@/lib/types";

interface UploadedImage {
  id: string;
  filename: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  s3Key?: string;
  s3Url?: string;
  publicUrl?: string;
  description?: string;
  category?: string;
  preview?: string;
  uploadProgress?: number;
  uploading?: boolean;
  error?: string;
}

interface BuildingAndSiteProps {
  initialData?: Partial<BuildingAndSite>;
  onSubmit?: (data: BuildingAndSite) => void;
  reportId?: string | null;
}

export const BuildingAndSiteStepTurboTax = forwardRef<StepRef<BuildingAndSite>, BuildingAndSiteProps>(
  ({ initialData, onSubmit = () => {}, reportId }, ref) => {
    const [buildingImages, setBuildingImages] = useState<UploadedImage[]>([]);
    const [exteriorImages, setExteriorImages] = useState<UploadedImage[]>([]);
    const [interiorImages, setInteriorImages] = useState<UploadedImage[]>([]);
    const [documentImages, setDocumentImages] = useState<UploadedImage[]>([]);

    const form = useForm<BuildingAndSite>({
      resolver: zodResolver(buildingAndSiteSchema),
      defaultValues: {
        buildingSystemDescription: "",
        exteriorObservations: "",
        interiorObservations: "",
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

    const { isSaving } = useAutoSave(reportId, 3, watch());

    useEffect(() => {
      if (initialData && Object.keys(initialData).length > 0) {
        reset({
          buildingSystemDescription: "",
          exteriorObservations: "",
          interiorObservations: "",
          ...initialData,
        });
      }
    }, [initialData, reset]);

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
              Tell us about the building and your observations
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ color: '#5E6C84' }}
            >
              Document the building's characteristics and your detailed observations from the site visit.
            </Typography>
          </Box>

          {/* Building System Description */}
          <Box>
            <Typography 
              variant="h6" 
              fontWeight={500} 
              gutterBottom
              sx={{ color: '#2C3E50', mb: 3 }}
            >
              What type of building system are we dealing with?
            </Typography>
            
            <Controller
              name="buildingSystemDescription"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={4}
                  label="Building system description"
                  placeholder="Describe the building type, construction, age, materials, and systems. For example:

• Single-family residential home, built in 1995
• Wood frame construction with brick veneer exterior
• Asphalt shingle roof with architectural shingles
• HVAC system: Central air conditioning with gas furnace
• Electrical: Updated panel, copper wiring throughout"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Provide an overview of the building's key characteristics"}
                  required
                />
              )}
            />
          </Box>

          {/* Building Photos */}
          <Card sx={{ bgcolor: '#F8F9FA', border: '1px solid #E8EAED' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Business sx={{ color: '#0070BA' }} />
                <Typography variant="h6" fontWeight={500} sx={{ color: '#2C3E50' }}>
                  Building Photos
                </Typography>
                <Chip label="Optional" size="small" variant="outlined" />
              </Stack>
              <Typography variant="body2" sx={{ color: '#5E6C84', mb: 3 }}>
                Upload photos of the overall building structure, architectural features, and building systems.
              </Typography>
              {reportId && (
                <ImageUpload
                  reportId={reportId}
                  stepNumber={3}
                  category="building"
                  images={buildingImages}
                  onImagesChange={setBuildingImages}
                  maxImages={10}
                />
              )}
            </CardContent>
          </Card>

          <Divider />

          {/* Exterior Observations */}
          <Box>
            <Typography 
              variant="h6" 
              fontWeight={500} 
              gutterBottom
              sx={{ color: '#2C3E50', mb: 3 }}
            >
              What did you observe on the building's exterior?
            </Typography>
            
            <Controller
              name="exteriorObservations"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={6}
                  label="Exterior observations"
                  placeholder="Detail your exterior findings, including any damage, conditions, or notable features:

• Roof condition and any visible damage
• Exterior walls, siding, or masonry condition
• Windows and doors condition
• Gutters, downspouts, and drainage
• Foundation and grading observations
• Any storm damage or weather-related impacts"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Document all relevant exterior conditions and damage"}
                  required
                />
              )}
            />
          </Box>

          {/* Exterior Photos */}
          <Card sx={{ bgcolor: '#F0F8FF', border: '1px solid #90CAF9' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Home sx={{ color: '#0070BA' }} />
                <Typography variant="h6" fontWeight={500} sx={{ color: '#2C3E50' }}>
                  Exterior Photos
                </Typography>
                <Chip label="Optional" size="small" variant="outlined" />
              </Stack>
              <Typography variant="body2" sx={{ color: '#5E6C84', mb: 3 }}>
                Upload photos of exterior damage, roof conditions, siding, windows, and other exterior elements.
              </Typography>
              {reportId && (
                <ImageUpload
                  reportId={reportId}
                  stepNumber={3}
                  category="exterior"
                  images={exteriorImages}
                  onImagesChange={setExteriorImages}
                  maxImages={15}
                />
              )}
            </CardContent>
          </Card>

          <Divider />

          {/* Interior Observations */}
          <Box>
            <Typography 
              variant="h6" 
              fontWeight={500} 
              gutterBottom
              sx={{ color: '#2C3E50', mb: 3 }}
            >
              What did you find inside the building?
            </Typography>
            
            <Controller
              name="interiorObservations"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={6}
                  label="Interior observations"
                  placeholder="Describe your interior findings and observations:

• Water intrusion or moisture damage
• Structural elements (beams, joists, supports)
• Interior finishes condition (drywall, flooring, ceilings)
• Electrical and plumbing systems
• HVAC equipment and ductwork
• Any interior damage related to the loss event"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Document all relevant interior conditions and damage"}
                  required
                />
              )}
            />
          </Box>

          {/* Interior Photos */}
          <Card sx={{ bgcolor: '#FFF8E1', border: '1px solid #FFB74D' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <PhotoCamera sx={{ color: '#0070BA' }} />
                <Typography variant="h6" fontWeight={500} sx={{ color: '#2C3E50' }}>
                  Interior Photos
                </Typography>
                <Chip label="Optional" size="small" variant="outlined" />
              </Stack>
              <Typography variant="body2" sx={{ color: '#5E6C84', mb: 3 }}>
                Upload photos of interior damage, water intrusion, structural elements, and other interior conditions.
              </Typography>
              {reportId && (
                <ImageUpload
                  reportId={reportId}
                  stepNumber={3}
                  category="interior"
                  images={interiorImages}
                  onImagesChange={setInteriorImages}
                  maxImages={15}
                />
              )}
            </CardContent>
          </Card>

          {/* Site Documents */}
          <Card sx={{ bgcolor: '#F3E5F5', border: '1px solid #CE93D8' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Description sx={{ color: '#0070BA' }} />
                <Typography variant="h6" fontWeight={500} sx={{ color: '#2C3E50' }}>
                  Site Documents & Additional Photos
                </Typography>
                <Chip label="Optional" size="small" variant="outlined" />
              </Stack>
              <Typography variant="body2" sx={{ color: '#5E6C84', mb: 3 }}>
                Upload site plans, permits, additional documentation, or other relevant photos not covered above.
              </Typography>
              {reportId && (
                <ImageUpload
                  reportId={reportId}
                  stepNumber={3}
                  category="documents"
                  images={documentImages}
                  onImagesChange={setDocumentImages}
                  maxImages={10}
                />
              )}
            </CardContent>
          </Card>

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
              <strong>Tip:</strong> Be specific and objective in your observations. Include measurements, locations, and extent of any damage you document.
            </Typography>
          </Alert>
        </Stack>
      </Box>
    );
  }
);