import { useEffect, useRef, useCallback } from "react";
import { useFormPersistence } from "./use-form-persistence";

export function useAutoSave(
  reportId: number | null,
  stepNumber: number,
  formData: any,
  delay: number = 2000 // Auto-save after 2 seconds of inactivity
) {
  const { saveFormData, isSaving } = useFormPersistence(reportId);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedDataRef = useRef<string>("");

  const debouncedSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const currentData = JSON.stringify(formData);
      
      // Only save if data has actually changed
      if (currentData !== lastSavedDataRef.current && formData && Object.keys(formData).length > 0) {
        saveFormData(stepNumber, formData, false);
        lastSavedDataRef.current = currentData;
      }
    }, delay);
  }, [formData, stepNumber, saveFormData, delay]);

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