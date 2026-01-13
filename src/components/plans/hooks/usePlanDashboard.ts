import { useState, useCallback, useEffect } from 'react';
import type {
  PlanDashboardResponse,
  DashboardOptions,
  ErrorResponse,
  ValidationErrorResponse,
} from '@/types';

interface UsePlanDashboardState {
  data: PlanDashboardResponse | null;
  isLoading: boolean;
  error: string | null;
}

interface UsePlanDashboardReturn extends UsePlanDashboardState {
  fetchDashboard: (planId: string, options?: DashboardOptions) => Promise<void>;
  refetch: () => Promise<void>;
}

export function usePlanDashboard(): UsePlanDashboardReturn {
  const [state, setState] = useState<UsePlanDashboardState>({
    data: null,
    isLoading: false,
    error: null,
  });

  // Store last successful parameters for refetch
  const [lastParams, setLastParams] = useState<{
    planId: string;
    options?: DashboardOptions;
  } | null>(null);

  const fetchDashboard = useCallback(async (planId: string, options?: DashboardOptions) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams();
      if (options?.weekView) {
        params.append('week_view', options.weekView);
      }
      if (options?.statusView) {
        params.append('status_view', options.statusView);
      }
      if (options?.weekNumber) {
        params.append('week_number', options.weekNumber.toString());
      }

      const url = `/api/v1/plans/${planId}/dashboard${params.toString() ? `?${params.toString()}` : ''}`;
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
      setLastParams({ planId, options });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load dashboard data';
      setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const refetch = useCallback(async () => {
    if (lastParams) {
      await fetchDashboard(lastParams.planId, lastParams.options);
    }
  }, [fetchDashboard, lastParams]);

  return {
    ...state,
    fetchDashboard,
    refetch,
  };
}