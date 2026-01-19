import { useState, useCallback, useEffect } from 'react';
import type {
  PlanDTO,
  GoalDTO,
  CreateGoalCommand,
  UpdateGoalCommand,
  UpdatePlanCommand,
  ItemResponse,
  ListResponse,
} from '@/types';

interface EditPlanState {
  step: 1 | 2;
  plan: PlanDTO | null;
  goals: GoalDTO[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  formErrors: Record<string, string>;
}

interface UseEditPlanReturn extends EditPlanState {
  fetchData: () => Promise<void>;
  updatePlanDetails: (name: string) => Promise<void>;
  addGoal: (data: CreateGoalCommand) => Promise<void>;
  updateGoal: (id: string, data: UpdateGoalCommand) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  nextStep: () => void;
  prevStep: () => void;
  finish: () => void;
  setFormErrors: (errors: Record<string, string>) => void;
  clearFormErrors: () => void;
}

export function useEditPlan(planId: string): UseEditPlanReturn {
  const [state, setState] = useState<EditPlanState>({
    step: 1,
    plan: null,
    goals: [],
    isLoading: false,
    isSaving: false,
    error: null,
    formErrors: {},
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch plan and goals in parallel
      const [planResponse, goalsResponse] = await Promise.all([
        fetch(`/api/v1/plans/${planId}`),
        fetch(`/api/v1/goals?plan_id=${planId}`),
      ]);

      // Check plan response
      if (!planResponse.ok) {
        const errorData = await planResponse.json();
        throw new Error(errorData.error || 'Failed to load plan');
      }

      // Check goals response
      if (!goalsResponse.ok) {
        const errorData = await goalsResponse.json();
        throw new Error(errorData.error || 'Failed to load goals');
      }

      const planData: ItemResponse<PlanDTO> = await planResponse.json();
      const goalsData: ListResponse<GoalDTO> = await goalsResponse.json();

      setState((prev) => ({
        ...prev,
        plan: planData.data,
        goals: goalsData.data,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load data';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [planId]);

  const updatePlanDetails = useCallback(
    async (name: string) => {
      if (!state.plan) {
        throw new Error('No plan loaded');
      }

      setState((prev) => ({ ...prev, isSaving: true }));

      try {
        const response = await fetch(`/api/v1/plans/${planId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name } as UpdatePlanCommand),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update plan');
        }

        const data: ItemResponse<PlanDTO> = await response.json();

        setState((prev) => ({
          ...prev,
          plan: data.data,
          isSaving: false,
          step: 2, // Move to goals step after successful update
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update plan';
        setState((prev) => ({
          ...prev,
          isSaving: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [planId, state.plan]
  );

  const addGoal = useCallback(
    async (data: CreateGoalCommand) => {
      setState((prev) => ({ ...prev, isSaving: true }));

      try {
        const response = await fetch('/api/v1/goals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create goal');
        }

        const result: ItemResponse<GoalDTO> = await response.json();

        setState((prev) => ({
          ...prev,
          goals: [...prev.goals, result.data],
          isSaving: false,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create goal';
        setState((prev) => ({
          ...prev,
          isSaving: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    []
  );

  const updateGoal = useCallback(
    async (id: string, data: UpdateGoalCommand) => {
      setState((prev) => ({ ...prev, isSaving: true }));

      try {
        const response = await fetch(`/api/v1/goals/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update goal');
        }

        const result: ItemResponse<GoalDTO> = await response.json();

        setState((prev) => ({
          ...prev,
          goals: prev.goals.map((goal) =>
            goal.id === id ? result.data : goal
          ),
          isSaving: false,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update goal';
        setState((prev) => ({
          ...prev,
          isSaving: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    []
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      setState((prev) => ({ ...prev, isSaving: true }));

      try {
        const response = await fetch(`/api/v1/goals/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete goal');
        }

        setState((prev) => ({
          ...prev,
          goals: prev.goals.filter((goal) => goal.id !== id),
          isSaving: false,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete goal';
        setState((prev) => ({
          ...prev,
          isSaving: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    []
  );

  const nextStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: prev.step === 1 ? 2 : prev.step,
    }));
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: prev.step === 2 ? 1 : prev.step,
    }));
  }, []);

  const finish = useCallback(() => {
    // Navigate to plans list - this will be handled by the component
    window.location.href = '/plans';
  }, []);

  const setFormErrors = useCallback((errors: Record<string, string>) => {
    setState((prev) => ({ ...prev, formErrors: errors }));
  }, []);

  const clearFormErrors = useCallback(() => {
    setState((prev) => ({ ...prev, formErrors: {} }));
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    fetchData,
    updatePlanDetails,
    addGoal,
    updateGoal,
    deleteGoal,
    nextStep,
    prevStep,
    finish,
    setFormErrors,
    clearFormErrors,
  };
}