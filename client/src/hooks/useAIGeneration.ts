import { useState, useCallback } from 'react';
import { useAIProgress } from '@/contexts/AIProgressContext';
import { useToast } from '@/hooks/use-toast';

interface AIGenerationOptions {
  bulletPoints: string;
  fieldType: string;
  context?: string;
}

interface AIBatchGenerationOptions {
  tasks: Array<{
    bulletPoints: string;
    fieldType: string;
    fieldName: string;
    context?: string;
  }>;
}

export function useAIGeneration() {
  const { startGeneration, updateProgress, completeTask, setError, reset } = useAIProgress();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSingleText = useCallback(async (options: AIGenerationOptions): Promise<string> => {
    const { bulletPoints, fieldType, context } = options;
    
    try {
      const response = await fetch('/api/ai/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bulletPoints,
          fieldType,
          context: context || 'Civil engineering property inspection report'
        }),
      });

      if (!response.ok) {
        throw new Error(`AI generation failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.generatedText || bulletPoints;
    } catch (error) {
      console.error('AI generation error:', error);
      throw error;
    }
  }, []);

  const generateBatchText = useCallback(async (options: AIBatchGenerationOptions) => {
    const { tasks } = options;
    setIsGenerating(true);
    
    try {
      startGeneration(tasks.length, `Starting AI generation for ${tasks.length} fields...`);
      
      const results: Record<string, string> = {};
      
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const progressPercent = ((i / tasks.length) * 100);
        
        updateProgress(
          progressPercent, 
          `Generating ${task.fieldName} (${i + 1}/${tasks.length})...`,
          `Processing: ${task.fieldType}`
        );

        try {
          // Add a small delay to make progress visible
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const result = await generateSingleText({
            bulletPoints: task.bulletPoints,
            fieldType: task.fieldType,
            context: task.context,
          });
          
          results[task.fieldName] = result;
          
          completeTask(
            task.fieldName, 
            `✓ Generated ${task.fieldName} (${result.length} characters)`
          );
          
        } catch (error) {
          // Log error but continue with other tasks
          console.error(`Failed to generate ${task.fieldName}:`, error);
          results[task.fieldName] = task.bulletPoints; // Keep original text
          
          completeTask(
            task.fieldName, 
            `⚠ Failed to generate ${task.fieldName}, kept original text`
          );
        }
      }
      
      updateProgress(100, 'AI generation completed successfully');
      
      toast({
        title: "AI Generation Complete",
        description: `Successfully processed ${tasks.length} fields with AI enhancement.`,
      });
      
      return results;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`AI generation failed: ${errorMessage}`);
      
      toast({
        title: "AI Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [startGeneration, updateProgress, completeTask, setError, generateSingleText, toast]);

  return {
    generateSingleText,
    generateBatchText,
    isGenerating,
    reset,
  };
}