import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function useFormPersistence(reportId: number | null) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const saveFormData = async (stepNumber: number, data: any, isCompleted: boolean = false) => {
    if (!reportId) return;

    setIsSaving(true);
    try {
      await apiRequest("PATCH", `/api/reports/${reportId}/steps/${stepNumber}`, {
        data,
        isCompleted
      });
      
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "steps"] });
      
      toast({
        title: "Progress saved",
        description: "Your changes have been automatically saved.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to save form data:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return "Not saved yet";
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSaved.getTime()) / 60000);
    
    if (diffInMinutes === 0) return "Just saved";
    if (diffInMinutes === 1) return "Saved 1 minute ago";
    if (diffInMinutes < 60) return `Saved ${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return "Saved 1 hour ago";
    return `Saved ${diffInHours} hours ago`;
  };

  return {
    saveFormData,
    lastSaved,
    isSaving,
    formatLastSaved,
  };
}
