import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Loader2, AlertCircle } from 'lucide-react';
import { wordDocumentService } from '@/services/wordDocumentService';
import { useToast } from '@/hooks/use-toast';

interface DocumentGenerationProps {
  reportData: {
    title: string;
    content: string;
    images: Array<{
      originalFilename: string;
      googleDriveUrl?: string;
      publicUrl?: string;
      fileSize: number;
      description?: string;
    }>;
  };
  onGoogleDocsGenerate: (includePhotosInline: boolean) => Promise<void>;
  isGenerating?: boolean;
}

type DocumentFormat = 'google-docs' | 'word';

export function DocumentGeneration({ 
  reportData, 
  onGoogleDocsGenerate,
  isGenerating: externalIsGenerating = false 
}: DocumentGenerationProps) {
  const [documentFormat, setDocumentFormat] = useState<DocumentFormat>('google-docs');
  const [includePhotosInline, setIncludePhotosInline] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setError(null);
    
    if (documentFormat === 'google-docs') {
      await onGoogleDocsGenerate(includePhotosInline);
    } else {
      await generateWordDocument();
    }
  };

  const generateWordDocument = async () => {
    try {
      setIsGenerating(true);
      setProgress(0);
      setProgressMessage('Initializing...');

      // Check if client-side generation is feasible
      const canGenerateClientSide = await wordDocumentService.canGenerateClientSide(reportData.images);

      if (canGenerateClientSide) {
        // Client-side generation
        await wordDocumentService.generateDocument({
          ...reportData,
          includePhotosInline,
          onProgress: (progress, message) => {
            setProgress(progress);
            setProgressMessage(message);
          }
        });

        toast({
          title: "Success",
          description: "Word document generated and downloaded successfully",
        });
      } else {
        // Fallback to server-side generation
        await generateWordDocumentServerSide();
      }
    } catch (error) {
      console.error('Word generation error:', error);
      setError(error.message || 'Failed to generate Word document');
      
      // Try server-side as fallback
      if (error.message?.includes('50MB limit')) {
        try {
          await generateWordDocumentServerSide();
        } catch (serverError) {
          setError('Document too large for generation. Please reduce the number of images.');
        }
      }
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setProgressMessage('');
    }
  };

  const generateWordDocumentServerSide = async () => {
    setProgressMessage('Using server-side generation...');
    
    try {
      const response = await fetch('/api/reports/generate-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...reportData,
          includePhotosInline,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.fallback === false) {
          // Server says to use client-side, but we already tried
          throw new Error('Unable to generate document');
        }
        throw new Error(errorData.error || 'Server generation failed');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportData.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Word document generated and downloaded successfully (server-side)",
      });
    } catch (error) {
      throw error;
    }
  };

  const handleCancel = () => {
    wordDocumentService.cancelGeneration();
    setIsGenerating(false);
    setProgress(0);
    setProgressMessage('');
  };

  const imageWarning = includePhotosInline && reportData.images.length > 10;
  const totalImageSize = reportData.images.reduce((sum, img) => sum + (img.fileSize || 0), 0);
  const largeSizeWarning = includePhotosInline && totalImageSize > 20 * 1024 * 1024;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Generate Document</CardTitle>
        <CardDescription>
          Choose your document format and image handling preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Document Format Selection */}
        <div className="space-y-3">
          <Label>Document Format</Label>
          <RadioGroup 
            value={documentFormat} 
            onValueChange={(value) => setDocumentFormat(value as DocumentFormat)}
            disabled={isGenerating || externalIsGenerating}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="google-docs" id="google-docs" />
              <Label htmlFor="google-docs" className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Google Docs (Online)
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="word" id="word" />
              <Label htmlFor="word" className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Word Document (.docx)
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Image Handling Option */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="include-photos"
              checked={includePhotosInline}
              onCheckedChange={(checked) => setIncludePhotosInline(checked as boolean)}
              disabled={isGenerating || externalIsGenerating}
            />
            <Label 
              htmlFor="include-photos" 
              className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Include photos inline in document
            </Label>
          </div>
          <p className="text-sm text-muted-foreground ml-6">
            {includePhotosInline 
              ? `Images will be embedded directly in the document (${reportData.images.length} images)`
              : "Images will be listed as references with links"}
          </p>
        </div>

        {/* Warnings */}
        {(imageWarning || largeSizeWarning) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {imageWarning && "Including many images inline may make the document large and slow to load. "}
              {largeSizeWarning && "Total image size is large. Consider using image references instead."}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Progress */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{progressMessage}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isGenerating && !externalIsGenerating && (
            <Button 
              onClick={handleGenerate}
              className="flex-1"
            >
              {documentFormat === 'google-docs' ? (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Google Doc
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate Word Document
                </>
              )}
            </Button>
          )}
          
          {(isGenerating || externalIsGenerating) && (
            <>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                className="flex-1"
                disabled={externalIsGenerating}
              >
                Cancel
              </Button>
              <Button disabled className="flex-1">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </Button>
            </>
          )}
        </div>

        {/* Format Information */}
        <div className="text-xs text-muted-foreground space-y-1">
          {documentFormat === 'google-docs' ? (
            <>
              <p>• Document will be created in your Google Drive</p>
              <p>• Requires Google account authentication</p>
              <p>• Can be edited and shared online</p>
            </>
          ) : (
            <>
              <p>• Document will be downloaded to your device</p>
              <p>• No account required</p>
              <p>• Works offline once downloaded</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}