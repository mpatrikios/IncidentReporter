import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reviewAttachmentsSchema, type ReviewAttachments } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Image, Calculator, FileImage } from "lucide-react";

interface ReviewAttachmentsProps {
  initialData?: Partial<ReviewAttachments>;
  onSubmit: (data: ReviewAttachments) => void;
  onPrevious: () => void;
}

export function ReviewAttachmentsStep({ initialData, onSubmit, onPrevious }: ReviewAttachmentsProps) {
  const form = useForm<ReviewAttachments>({
    resolver: zodResolver(reviewAttachmentsSchema),
    defaultValues: {
      drawings: [],
      specifications: [],
      calculations: [],
      photos: [],
      additionalDocuments: [],
      ...initialData,
    },
  });

  const handleFileUpload = (fieldName: keyof ReviewAttachments, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileNames = Array.from(files).map(file => file.name);
      const currentFiles = form.getValues(fieldName) || [];
      form.setValue(fieldName, [...currentFiles, ...fileNames]);
    }
  };

  const removeFile = (fieldName: keyof ReviewAttachments, index: number) => {
    const currentFiles = form.getValues(fieldName) || [];
    const updatedFiles = currentFiles.filter((_, i) => i !== index);
    form.setValue(fieldName, updatedFiles);
  };

  const FileUploadCard = ({ 
    title, 
    description, 
    fieldName, 
    icon: Icon,
    acceptedTypes 
  }: {
    title: string;
    description: string;
    fieldName: keyof ReviewAttachments;
    icon: any;
    acceptedTypes: string;
  }) => {
    const files = form.watch(fieldName) || [];
    
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Icon className="mr-2 h-5 w-5 text-primary-600" />
            {title}
          </CardTitle>
          <p className="text-sm text-slate-600">{description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
            <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <label className="cursor-pointer">
              <span className="text-sm font-medium text-primary-600 hover:text-primary-700">
                Click to upload
              </span>
              <span className="text-sm text-slate-600"> or drag and drop</span>
              <input
                type="file"
                multiple
                accept={acceptedTypes}
                className="hidden"
                onChange={(e) => handleFileUpload(fieldName, e)}
              />
            </label>
            <p className="text-xs text-slate-500 mt-1">{acceptedTypes}</p>
          </div>
          
          {files.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-700">Uploaded Files:</h4>
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <span className="text-sm text-slate-700">{file}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(fieldName, index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUploadCard
              title="Technical Drawings"
              description="Upload CAD drawings, blueprints, and technical schematics"
              fieldName="drawings"
              icon={FileText}
              acceptedTypes=".dwg,.pdf,.png,.jpg"
            />

            <FileUploadCard
              title="Specifications"
              description="Project specifications and detailed requirements"
              fieldName="specifications"
              icon={FileText}
              acceptedTypes=".pdf,.doc,.docx,.txt"
            />

            <FileUploadCard
              title="Calculations"
              description="Engineering calculation sheets and analysis files"
              fieldName="calculations"
              icon={Calculator}
              acceptedTypes=".pdf,.xls,.xlsx,.doc,.docx"
            />

            <FileUploadCard
              title="Site Photos"
              description="Photographs of the project site and existing conditions"
              fieldName="photos"
              icon={Image}
              acceptedTypes=".jpg,.jpeg,.png,.gif"
            />
          </div>

          <FileUploadCard
            title="Additional Documents"
            description="Any other supporting documents (permits, reports, etc.)"
            fieldName="additionalDocuments"
            icon={FileImage}
            acceptedTypes=".pdf,.doc,.docx,.txt,.jpg,.png"
          />

          {/* Review Summary */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-blue-900">
                <i className="fas fa-info-circle mr-2"></i>
                Document Review Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-blue-800 space-y-2">
                <p>Please ensure all documents are:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Clearly labeled with project name and date</li>
                  <li>In PDF format when possible for best compatibility</li>
                  <li>Legible and properly oriented</li>
                  <li>Include professional engineer stamps where required</li>
                  <li>Comply with applicable building codes and standards</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              className="flex items-center px-6 py-3"
            >
              <i className="fas fa-chevron-left mr-2"></i>
              Previous: Calculations
            </Button>
            
            <Button
              type="submit"
              className="flex items-center px-8 py-3 bg-primary-600 hover:bg-primary-700"
            >
              Next: Submit Report
              <i className="fas fa-chevron-right ml-2"></i>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
