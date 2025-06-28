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
  Button,
  CircularProgress,
} from '@mui/material';
import {
  PhotoCamera,
  Business,
  Home,
  Description,
  Satellite,
  Download,
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
  projectInfo?: {
    insuredAddress?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
  };
}

export const BuildingAndSiteStepTurboTax = forwardRef<StepRef<BuildingAndSite>, BuildingAndSiteProps>(
  ({ initialData, onSubmit = () => {}, reportId, projectInfo }, ref) => {
    const [buildingImages, setBuildingImages] = useState<UploadedImage[]>([]);
    const [exteriorImages, setExteriorImages] = useState<UploadedImage[]>([]);
    const [interiorImages, setInteriorImages] = useState<UploadedImage[]>([]);
    const [documentImages, setDocumentImages] = useState<UploadedImage[]>([]);
    const [aerialLoading, setAerialLoading] = useState(false);
    const [aerialError, setAerialError] = useState<string | null>(null);

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

    // Function to get aerial view with specific zoom level
    const getAerialView = async (zoomLevel: number = 20, zoomLabel: string = '') => {
      if (!projectInfo) {
        setAerialError('Project information not available');
        return;
      }

      setAerialLoading(true);
      setAerialError(null);

      try {
        // Build address from project info
        const addressParts = [];
        if (projectInfo.insuredAddress) addressParts.push(projectInfo.insuredAddress);
        if (projectInfo.city) addressParts.push(projectInfo.city);
        if (projectInfo.state) addressParts.push(projectInfo.state);
        if (projectInfo.zipCode) addressParts.push(projectInfo.zipCode);

        const requestData = {
          address: projectInfo.latitude && projectInfo.longitude 
            ? undefined 
            : addressParts.join(', '),
          latitude: projectInfo.latitude,
          longitude: projectInfo.longitude,
          zoom: zoomLevel,
          mapType: 'satellite'
        };

        console.log('Requesting aerial image with:', requestData);

        const response = await fetch('/api/aerial/image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        // Convert response to blob and download
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        // Create download link with zoom level in filename
        const link = document.createElement('a');
        link.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = zoomLabel 
          ? `aerial_view_${zoomLabel}_${dateStr}.jpg`
          : `aerial_view_zoom${zoomLevel}_${dateStr}.jpg`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the object URL
        URL.revokeObjectURL(url);
        
      } catch (error: any) {
        console.error('Error fetching aerial image:', error);
        setAerialError(error.message || 'Failed to fetch aerial image');
      } finally {
        setAerialLoading(false);
      }
    };

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

          {/* Aerial View */}
          <Card sx={{ bgcolor: '#E8F5E8', border: '1px solid #4CAF50' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Satellite sx={{ color: '#0070BA' }} />
                <Typography variant="h6" fontWeight={500} sx={{ color: '#2C3E50' }}>
                  Aerial View
                </Typography>
                <Chip label="Optional" size="small" variant="outlined" />
              </Stack>
              <Typography variant="body2" sx={{ color: '#5E6C84', mb: 3 }}>
                Get high-resolution satellite views of the property from Google Maps. Choose your preferred zoom level:
              </Typography>
              
              <Box sx={{ mb: 3, p: 2, bgcolor: '#F5F5F5', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ color: '#333', mb: 1 }}>
                  <strong>📍 Close-Up View (Zoom 21):</strong> Focuses directly on the specific property address
                </Typography>
                <Typography variant="body2" sx={{ color: '#333', mb: 1 }}>
                  <strong>🏠 Property View (Zoom 19):</strong> Shows the property and immediate surroundings
                </Typography>
                <Typography variant="body2" sx={{ color: '#333' }}>
                  <strong>🏘️ Neighborhood (Zoom 17):</strong> Shows broader area including nearby streets
                </Typography>
              </Box>
              
              {aerialError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {aerialError}
                </Alert>
              )}
              
              {projectInfo && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                    <strong>Property Address:</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#333' }}>
                    {[
                      projectInfo.insuredAddress,
                      projectInfo.city,
                      projectInfo.state,
                      projectInfo.zipCode
                    ].filter(Boolean).join(', ') || 'Address not specified'}
                  </Typography>
                  {projectInfo.latitude && projectInfo.longitude && (
                    <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                      Coordinates: {projectInfo.latitude}, {projectInfo.longitude}
                    </Typography>
                  )}
                </Box>
              )}
              
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  onClick={() => getAerialView(21, 'close_up')}
                  disabled={aerialLoading || !projectInfo}
                  startIcon={aerialLoading ? <CircularProgress size={20} /> : <Download />}
                  sx={{
                    bgcolor: '#4CAF50',
                    '&:hover': { bgcolor: '#45A049' },
                    '&:disabled': { bgcolor: '#ccc' }
                  }}
                >
                  {aerialLoading ? 'Getting...' : 'Close-Up View'}
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => getAerialView(19, 'property')}
                  disabled={aerialLoading || !projectInfo}
                  startIcon={aerialLoading ? <CircularProgress size={20} /> : <Download />}
                  sx={{
                    borderColor: '#4CAF50',
                    color: '#4CAF50',
                    '&:hover': { bgcolor: '#E8F5E8', borderColor: '#45A049' },
                    '&:disabled': { borderColor: '#ccc', color: '#ccc' }
                  }}
                >
                  {aerialLoading ? 'Getting...' : 'Property View'}
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => getAerialView(17, 'neighborhood')}
                  disabled={aerialLoading || !projectInfo}
                  startIcon={aerialLoading ? <CircularProgress size={20} /> : <Download />}
                  sx={{
                    borderColor: '#4CAF50',
                    color: '#4CAF50',
                    '&:hover': { bgcolor: '#E8F5E8', borderColor: '#45A049' },
                    '&:disabled': { borderColor: '#ccc', color: '#ccc' }
                  }}
                >
                  {aerialLoading ? 'Getting...' : 'Neighborhood'}
                </Button>
              </Stack>
              
              {!projectInfo && (
                <Typography variant="body2" sx={{ color: '#666', mt: 2, fontStyle: 'italic' }}>
                  Complete the Project Information step to enable aerial view download.
                </Typography>
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