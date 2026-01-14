import { useState, useCallback } from 'react';
import type {
  PlanDashboardResponse,
  ErrorResponse,
  ValidationErrorResponse,
} from '@/types';

interface UsePlanDashboardState {
  data: PlanDashboardResponse | null;
  isLoading: boolean;
  error: string | null;
}

interface UsePlanDashboardReturn extends UsePlanDashboardState {
  fetchDashboard: (planId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function usePlanDashboard(): UsePlanDashboardReturn {
  const [state, setState] = useState<UsePlanDashboardState>({
    data: null,
    isLoading: false,
    error: null,
  });

  // Store last successful planId for refetch
  const [lastPlanId, setLastPlanId] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (planId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simple API call - no query parameters, always fetch all data
      const url = `/api/v1/plans/${planId}/dashboard`;
      const response = await fetch(url);

      if (!response.ok) {
        let errorMessage = 'Failed to fetch dashboard data';
        try {
          const errorData: ErrorResponse | ValidationErrorResponse = await response.json();
          if ('error' in errorData) {
            errorMessage = errorData.error;
            if ('message' in errorData && errorData.message) {
              errorMessage += `: ${errorData.message}`;
            }
          }
        } catch {
          // If we can't parse the error response, use default message
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      const data: PlanDashboardResponse = result.data;

      setState({ data, isLoading: false, error: null });
      setLastPlanId(planId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load dashboard data';
      setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const refetch = useCallback(async () => {
    if (lastPlanId) {
      await fetchDashboard(lastPlanId);
    }
  }, [fetchDashboard, lastPlanId]);

  return {
    ...state,
    fetchDashboard,
    refetch,
  };
}