import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reviewAttachmentsSchema, type ReviewAttachments } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useEffect, forwardRef, useImperativeHandle } from "react";
import type { StepRef } from "@/lib/types";
import type { UseFormReturn } from "react-hook-form";

interface ReviewAttachmentsProps {
  initialData?: Partial<ReviewAttachments>;
  onSubmit: (data: ReviewAttachments) => void;
  onPrevious?: () => void;
  reportId?: number | null;
}

export const ReviewAttachmentsStep = forwardRef<StepRef<ReviewAttachments>, ReviewAttachmentsProps>(({ 
  initialData, 
  onSubmit, 
  onPrevious,
  reportId 
}, ref) => {
  const form: UseFormReturn<ReviewAttachments> = useForm<ReviewAttachments>({
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

  // Expose save method to parent
  useImperativeHandle(ref, () => ({
    save: async () => {
      const isValid = await form.trigger();
      if (isValid) {
        const values = form.getValues();
        onSubmit(values);
      }
    },
    getValues: () => form.getValues(),
  }));

  // Auto-save form data as user types
  const { isSaving } = useAutoSave(reportId, 5, form.watch());

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      form.reset({
        drawings: [],
        specifications: [],
        calculations: [],
        photos: [],
        additionalDocuments: [],
        ...initialData,
      });
    }
  }, [initialData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="drawings"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Drawings</FormLabel>
              <FormControl>
                <Input type="file" multiple {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specifications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Specifications</FormLabel>
              <FormControl>
                <Input type="file" multiple {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="calculations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Calculations</FormLabel>
              <FormControl>
                <Input type="file" multiple {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="photos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Photos</FormLabel>
              <FormControl>
                <Input type="file" multiple {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="additionalDocuments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Documents</FormLabel>
              <FormControl>
                <Input type="file" multiple {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between">
          {onPrevious && (
            <Button type="button" variant="outline" onClick={onPrevious}>
              Previous
            </Button>
          )}
          <Button 
            type="submit"
            className="flex items-center px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Submit Report"}
            <i className="fas fa-chevron-right ml-2"></i>
          </Button>
        </div>
      </form>
    </Form>
  );
});
