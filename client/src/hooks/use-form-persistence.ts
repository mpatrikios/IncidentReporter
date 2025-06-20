import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function useFormPersistence(reportId: string | null | undefined) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const saveFormData = async (stepNumber: number, data: any, isCompleted: boolean = false) => {
    if (!reportId) return;

    // Saving step data to backend
    setIsSaving(true);
    try {
      const response = await fetch(`/api/reports/${reportId}/steps/${stepNumber}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data,
          isCompleted
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Save failed, keeping console.error for debugging
        throw new Error("Failed to save");
      }
      
      const result = await response.json();
      // Save successful
      
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "steps"] });
      
      // Only show toast for manual saves, not auto-saves
      if (isCompleted) {
        toast({
          title: "Progress saved",
          description: "Your changes have been saved.",
        });
      }
    } catch (error) {
      if (isCompleted) {
        toast({
          title: "Save failed",
          description: "Failed to save your progress. Please try again.",
          variant: "destructive",
        });
      }
      // Keep console.error for debugging save failures
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
