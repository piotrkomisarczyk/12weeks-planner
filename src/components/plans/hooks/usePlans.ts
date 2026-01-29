import { useState, useCallback } from "react";
import type { PlanDTO, CreatePlanCommand, PlanStatus, ListResponse } from "@/types";

interface UsePlansState {
  plans: PlanDTO[];
  isLoading: boolean;
  error: string | null;
}

interface UsePlansReturn extends UsePlansState {
  fetchPlans: (filter?: { status?: PlanStatus }) => Promise<void>;
  createPlan: (data: CreatePlanCommand) => Promise<void>;
  activatePlan: (id: string) => Promise<void>;
  archivePlan: (id: string) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
}

export function usePlans(): UsePlansReturn {
  const [state, setState] = useState<UsePlansState>({
    plans: [],
    isLoading: false,
    error: null,
  });

  const fetchPlans = useCallback(async (filter?: { status?: PlanStatus }) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams();
      if (filter?.status) {
        params.append("status", filter.status);
      }

      const url = `/api/v1/plans${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch plans");
      }

      const data: ListResponse<PlanDTO> = await response.json();
      setState({ plans: data.data, isLoading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load plans";
      setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
    }
  }, []);

  const createPlan = useCallback(
    async (data: CreatePlanCommand) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch("/api/v1/plans", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create plan");
        }

        // Refresh the plans list after creation
        await fetchPlans();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create plan";
        setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
        throw error;
      }
    },
    [fetchPlans]
  );

  const activatePlan = useCallback(
    async (id: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`/api/v1/plans/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "active" }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to activate plan");
        }

        // Refresh the plans list after activation (backend changes other plans' statuses)
        await fetchPlans();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to activate plan";
        setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
        throw error;
      }
    },
    [fetchPlans]
  );

  const archivePlan = useCallback(
    async (id: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`/api/v1/plans/${id}/archive`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to archive plan");
        }

        // Refresh the plans list after archiving
        await fetchPlans();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to archive plan";
        setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
        throw error;
      }
    },
    [fetchPlans]
  );

  const deletePlan = useCallback(
    async (id: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`/api/v1/plans/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete plan");
        }

        // Refresh the plans list after deletion
        await fetchPlans();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete plan";
        setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
        throw error;
      }
    },
    [fetchPlans]
  );

  return {
    ...state,
    fetchPlans,
    createPlan,
    activatePlan,
    archivePlan,
    deletePlan,
  };
}
