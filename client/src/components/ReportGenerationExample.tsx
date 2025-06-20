import React, { useState } from 'react';
import { DocumentGeneration } from './DocumentGeneration';
import { ImageUpload } from './ImageUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

// Example component showing how to integrate document generation with image upload
export function ReportGenerationExample() {
  const [reportId] = useState('example-report-id');
  const [images, setImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Example report data - in real implementation, this would come from your form data
  const reportData = {
    title: "Engineering Inspection Report - 123 Main Street",
    content: `# Executive Summary

This report presents the findings of a comprehensive engineering inspection conducted at 123 Main Street on ${new Date().toLocaleDateString()}.

## Property Overview

The subject property is a single-family residential structure built in 1985. The building features:
- Wood frame construction
- Composite shingle roofing
- Vinyl siding exterior
- Concrete foundation

## Inspection Findings

### Exterior Observations

The exterior inspection revealed the following conditions:
- Roof shingles show moderate wear consistent with age
- Gutters and downspouts are functional with minor debris
- Siding exhibits normal weathering with no significant damage
- Foundation shows no visible cracks or settlement issues

### Interior Observations

Interior areas were inspected with the following findings:
- No visible water damage or staining on ceilings
- Walls and floors are in good condition
- Windows and doors operate properly
- HVAC system appears to be well-maintained

## Conclusions

Based on our inspection, the property is in generally good condition with only minor maintenance items noted.`,
    images: images.map(img => ({
      originalFilename: img.originalFilename,
      s3Url: img.s3Url,
      publicUrl: img.publicUrl,
      fileSize: img.fileSize,
      description: img.description,
    })),
  };

  const handleGoogleDocsGenerate = async (includePhotosInline: boolean) => {
    try {
      setIsGenerating(true);
      
      // TODO: Replace with your actual Google Docs generation API call
      const response = await fetch(`/api/reports/${reportId}/generate-doc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          includePhotosInline,
          // Add other necessary data
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate Google Doc');
      }

      const { documentId, documentUrl } = await response.json();
      
      toast({
        title: "Success",
        description: "Google Doc generated successfully",
      });

      // Open the document in a new tab
      if (documentUrl) {
        window.open(documentUrl, '_blank');
      }
    } catch (error) {
      console.error('Google Docs generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate Google Doc",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Report Generation Example</CardTitle>
          <CardDescription>
            This example shows how to integrate Word document generation with image upload
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="images" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="generate">Generate Document</TabsTrigger>
            </TabsList>
            
            <TabsContent value="images" className="space-y-4">
              <ImageUpload
                reportId={reportId}
                stepNumber={3} // Example: Building observations step
                category="building"
                images={images}
                onImagesChange={setImages}
                maxImages={20}
                maxFileSize={10}
              />
            </TabsContent>
            
            <TabsContent value="generate" className="space-y-4">
              <DocumentGeneration
                reportData={reportData}
                onGoogleDocsGenerate={handleGoogleDocsGenerate}
                isGenerating={isGenerating}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Example of how to use in your existing form component
export function ExistingFormIntegration() {
  const [images, setImages] = useState([]);
  
  // In your form submit handler:
  const handleFormSubmit = async (formData: any) => {
    // Include images in your form data
    const completeData = {
      ...formData,
      images: images,
    };
    
    // Submit to your API
    await submitReport(completeData);
  };

  // Example function - replace with your actual API call
  async function submitReport(data: any) {
    // Your API call here
    console.log('Submitting report with images:', data);
  }

  return (
    <div>
      {/* Your existing form fields */}
      
      {/* Add image upload section */}
      <div className="my-6">
        <h3 className="text-lg font-semibold mb-4">Attach Images</h3>
        <ImageUpload
          reportId="your-report-id"
          images={images}
          onImagesChange={setImages}
        />
      </div>
      
      {/* Your form submit button */}
    </div>
  );
}