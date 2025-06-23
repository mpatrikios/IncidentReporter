import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { ReportCompletionStatus } from '@/components/ReportCompletionStatus';

interface CompletionResponse {
  completionStatus: ReportCompletionStatus;
  suggestedStatus: string;
}

export function useReportCompletion(reportId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['reportCompletion', reportId],
    queryFn: async (): Promise<CompletionResponse> => {
      if (!reportId) {
        throw new Error('Report ID is required');
      }

      const response = await apiRequest('GET', `/api/reports/${reportId}/completion`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch completion status: ${response.status}`);
      }

      return response.json();
    },
    enabled: enabled && !!reportId,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });
}