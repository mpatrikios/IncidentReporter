import { useEffect, useRef, useCallback } from "react";
import { useFormPersistence } from "./use-form-persistence";

export function useAutoSave(
  reportId: string | null | undefined,
  stepNumber: number,
  formData: any,
  delay: number = 2000 // Auto-save after 2 seconds of inactivity
) {
  const { saveFormData, isSaving } = useFormPersistence(reportId);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedDataRef = useRef<string>("");

  const debouncedSave = useCallback(() => {
    if (!reportId) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const currentData = JSON.stringify(formData);
      
      // Only save if data has actually changed and is not empty
      if (currentData !== lastSavedDataRef.current && formData && Object.keys(formData).length > 0) {
        // Check if any field has meaningful content
        const hasContent = Object.values(formData).some(value => 
          value !== "" && value !== null && value !== undefined && 
          (Array.isArray(value) ? value.length > 0 : true)
        );
        
        if (hasContent) {
          saveFormData(stepNumber, formData, false);
          lastSavedDataRef.current = currentData;
        }
      }
    }, delay);
  }, [formData, stepNumber, saveFormData, delay, reportId]);

  useEffect(() => {
    debouncedSave();
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [debouncedSave]);

  return { isSaving };
}