import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Loader2, 
  AlertCircle,
  Trash2,
  Eye,
  Edit2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UploadedImage {
  id: string;
  filename: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  googleDriveUrl?: string;
  publicUrl?: string;
  description?: string;
  category?: string;
  preview?: string;
  uploadProgress?: number;
  uploading?: boolean;
  error?: string;
}

interface ImageUploadProps {
  reportId: string;
  stepNumber?: number;
  category?: 'building' | 'exterior' | 'interior' | 'documents' | 'other';
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  maxFileSize?: number; // in MB
}

export function ImageUpload({
  reportId,
  stepNumber,
  category,
  images,
  onImagesChange,
  maxImages = 20,
  maxFileSize = 10, // 10MB default
}: ImageUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(new Map());
  const [editingImage, setEditingImage] = useState<UploadedImage | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const { toast } = useToast();

  const uploadImage = async (file: File, tempId: string) => {
    const formData = new FormData();
    formData.append('image', file);
    if (stepNumber) formData.append('stepNumber', stepNumber.toString());
    if (category) formData.append('category', category);

    try {
      // Update progress
      setUploadingFiles(prev => new Map(prev).set(tempId, 10));

      const response = await fetch(`/api/reports/${reportId}/images`, {
        method: 'POST',
        body: formData,
        // Note: Don't set Content-Type header - browser will set it with boundary
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const uploadedImage = await response.json();

      // Update images list with uploaded image
      onImagesChange(
        images.map(img => 
          img.id === tempId 
            ? { ...uploadedImage, preview: img.preview }
            : img
        )
      );

      toast({
        title: "Success",
        description: `${file.name} uploaded successfully`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      
      // Mark image as failed
      onImagesChange(
        images.map(img => 
          img.id === tempId 
            ? { ...img, uploading: false, error: error.message }
            : img
        )
      );

      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(tempId);
        return newMap;
      });
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Check max images limit
    if (images.length + acceptedFiles.length > maxImages) {
      toast({
        title: "Too many images",
        description: `Maximum ${maxImages} images allowed`,
        variant: "destructive",
      });
      return;
    }

    // Process each file
    const newImages: UploadedImage[] = [];
    
    for (const file of acceptedFiles) {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds ${maxFileSize}MB limit`,
          variant: "destructive",
        });
        continue;
      }

      // Create temporary entry
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const preview = URL.createObjectURL(file);
      
      const tempImage: UploadedImage = {
        id: tempId,
        filename: file.name,
        originalFilename: file.name,
        fileSize: file.size,
        mimeType: file.type,
        preview,
        uploading: true,
        uploadProgress: 0,
      };

      newImages.push(tempImage);
    }

    // Add temporary images to list
    onImagesChange([...images, ...newImages]);

    // Upload each file
    for (let i = 0; i < acceptedFiles.length && i < newImages.length; i++) {
      uploadImage(acceptedFiles[i], newImages[i].id);
    }
  }, [images, maxImages, maxFileSize, onImagesChange, reportId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    maxFiles: maxImages - images.length,
    disabled: images.length >= maxImages,
  });

  const deleteImage = async (imageId: string) => {
    try {
      // If it's a temp image, just remove from list
      if (imageId.startsWith('temp-')) {
        onImagesChange(images.filter(img => img.id !== imageId));
        return;
      }

      // Delete from server
      const response = await fetch(`/api/reports/${reportId}/images/${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      onImagesChange(images.filter(img => img.id !== imageId));
      
      toast({
        title: "Image deleted",
        description: "Image removed successfully",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateImageDescription = async () => {
    if (!editingImage || editingImage.id.startsWith('temp-')) return;

    try {
      const response = await fetch(`/api/reports/${reportId}/images/${editingImage.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: editDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update image');
      }

      const updated = await response.json();
      
      onImagesChange(
        images.map(img => 
          img.id === editingImage.id 
            ? { ...img, description: editDescription }
            : img
        )
      );

      setEditingImage(null);
      setEditDescription('');
      
      toast({
        title: "Updated",
        description: "Image description updated",
      });
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400",
          images.length >= maxImages && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-sm">Drop the images here...</p>
        ) : (
          <>
            <p className="text-sm">Drag & drop images here, or click to select</p>
            <p className="text-xs text-gray-500 mt-2">
              {images.length}/{maxImages} images • Max {maxFileSize}MB per file
            </p>
          </>
        )}
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="relative group overflow-hidden">
              <CardContent className="p-2">
                <div className="aspect-square relative bg-gray-100 rounded overflow-hidden">
                  {image.preview ? (
                    <img
                      src={image.preview}
                      alt={image.originalFilename}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {image.googleDriveUrl && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open(image.googleDriveUrl, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditingImage(image);
                        setEditDescription(image.description || '');
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteImage(image.id)}
                      disabled={image.uploading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Upload progress */}
                  {image.uploading && (
                    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mb-2" />
                      <Progress 
                        value={uploadingFiles.get(image.id) || 0} 
                        className="w-3/4 h-1"
                      />
                    </div>
                  )}

                  {/* Error state */}
                  {image.error && (
                    <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center p-2">
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    </div>
                  )}
                </div>
                
                <p className="text-xs mt-1 truncate" title={image.originalFilename}>
                  {image.originalFilename}
                </p>
                {image.description && (
                  <p className="text-xs text-gray-500 truncate" title={image.description}>
                    {image.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Description Dialog */}
      <Dialog open={!!editingImage} onOpenChange={() => setEditingImage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Image Details</DialogTitle>
            <DialogDescription>
              Add a description for {editingImage?.originalFilename}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter image description..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingImage(null)}>
              Cancel
            </Button>
            <Button onClick={updateImageDescription}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}