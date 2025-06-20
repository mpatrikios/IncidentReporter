import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Cloud, 
  Wind, 
  CloudRain, 
  Tornado
} from "lucide-react";

export interface ReportTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "hail",
    name: "Hail",
    icon: <Cloud className="w-5 h-5" />
  },
  {
    id: "wind",
    name: "Wind", 
    icon: <Wind className="w-5 h-5" />
  },
  {
    id: "storm",
    name: "Storm",
    icon: <CloudRain className="w-5 h-5" />
  },
  {
    id: "tornado",
    name: "Tornado",
    icon: <Tornado className="w-5 h-5" />
  }
];

interface ReportTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateSelect: (template: ReportTemplate) => void;
}

export function ReportTemplateDialog({ 
  open, 
  onOpenChange, 
  onTemplateSelect 
}: ReportTemplateDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template);
  };

  const handleContinue = () => {
    if (selectedTemplate) {
      onTemplateSelect(selectedTemplate);
      onOpenChange(false);
      setSelectedTemplate(null);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedTemplate(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Choose Report Type
          </DialogTitle>
          <DialogDescription>
            Select the type of report you want to create.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {REPORT_TEMPLATES.map((template) => {
            const isSelected = selectedTemplate?.id === template.id;
            
            return (
              <div 
                key={template.id}
                className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                onClick={() => handleTemplateSelect(template)}
              >
                <input
                  type="radio"
                  id={template.id}
                  name="template"
                  checked={isSelected}
                  onChange={() => handleTemplateSelect(template)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2 flex-1">
                  {template.icon}
                  <label 
                    htmlFor={template.id} 
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    {template.name}
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleContinue}
            disabled={!selectedTemplate}
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}