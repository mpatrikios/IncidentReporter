import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AIProgressState {
  isGenerating: boolean;
  currentTask: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  details: string[];
  error: string | null;
}

interface AIProgressContextType {
  state: AIProgressState;
  startGeneration: (totalTasks: number, initialTask: string) => void;
  updateProgress: (progress: number, task: string, detail?: string) => void;
  completeTask: (taskName: string, detail?: string) => void;
  setError: (error: string) => void;
  reset: () => void;
}

const defaultState: AIProgressState = {
  isGenerating: false,
  currentTask: '',
  progress: 0,
  totalTasks: 0,
  completedTasks: 0,
  details: [],
  error: null,
};

const AIProgressContext = createContext<AIProgressContextType | undefined>(undefined);

export function AIProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AIProgressState>(defaultState);

  const startGeneration = useCallback((totalTasks: number, initialTask: string) => {
    setState({
      isGenerating: true,
      currentTask: initialTask,
      progress: 0,
      totalTasks,
      completedTasks: 0,
      details: [initialTask],
      error: null,
    });
  }, []);

  const updateProgress = useCallback((progress: number, task: string, detail?: string) => {
    setState(prev => ({
      ...prev,
      progress: Math.min(progress, 100),
      currentTask: task,
      details: detail ? [...prev.details, detail] : prev.details,
    }));
  }, []);

  const completeTask = useCallback((taskName: string, detail?: string) => {
    setState(prev => {
      const newCompletedTasks = prev.completedTasks + 1;
      const newProgress = prev.totalTasks > 0 ? (newCompletedTasks / prev.totalTasks) * 100 : 100;
      
      return {
        ...prev,
        completedTasks: newCompletedTasks,
        progress: Math.min(newProgress, 100),
        currentTask: newCompletedTasks >= prev.totalTasks ? 'Completed' : prev.currentTask,
        details: detail ? [...prev.details, detail] : prev.details,
        isGenerating: newCompletedTasks < prev.totalTasks,
      };
    });
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      error,
      isGenerating: false,
    }));
  }, []);

  const reset = useCallback(() => {
    setState(defaultState);
  }, []);

  const value: AIProgressContextType = {
    state,
    startGeneration,
    updateProgress,
    completeTask,
    setError,
    reset,
  };

  return (
    <AIProgressContext.Provider value={value}>
      {children}
    </AIProgressContext.Provider>
  );
}

export function useAIProgress() {
  const context = useContext(AIProgressContext);
  if (context === undefined) {
    throw new Error('useAIProgress must be used within an AIProgressProvider');
  }
  return context;
}