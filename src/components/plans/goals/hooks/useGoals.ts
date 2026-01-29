/**
 * useGoals Hook
 * Manages goals for a specific plan
 * Handles CRUD operations and maintains local state
 */

import { useState, useCallback, useEffect } from "react";
import type { GoalDTO, CreateGoalCommand, UpdateGoalCommand, ListResponse, ItemResponse } from "@/types";

interface UseGoalsState {
  goals: GoalDTO[];
  isLoading: boolean;
  error: string | null;
}

interface UseGoalsReturn extends UseGoalsState {
  fetchGoals: () => Promise<void>;
  addGoal: (data: Omit<CreateGoalCommand, "plan_id">) => Promise<GoalDTO>;
  updateGoal: (id: string, data: UpdateGoalCommand) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  reorderGoals: (newOrder: GoalDTO[]) => Promise<void>;
  moveGoalUp: (id: string) => Promise<void>;
  moveGoalDown: (id: string) => Promise<void>;
  canAddGoal: boolean;
}

/**
 * Hook for managing goals for a specific plan
 *
 * @param planId - ID of the plan
 * @returns Goals state and CRUD operations
 *
 * @example
 * ```tsx
 * const { goals, isLoading, addGoal, updateGoal, deleteGoal, canAddGoal } = useGoals(planId);
 *
 * // Add a goal
 * await addGoal({
 *   title: 'New Goal',
 *   category: 'work',
 *   description: 'Description',
 *   progress_percentage: 0,
 *   position: 1
 * });
 *
 * // Update goal progress
 * await updateGoal(goalId, { progress_percentage: 50 });
 *
 * // Delete goal
 * await deleteGoal(goalId);
 * ```
 */
export function useGoals(planId: string): UseGoalsReturn {
  const [state, setState] = useState<UseGoalsState>({
    goals: [],
    isLoading: false,
    error: null,
  });

  // Check if user can add more goals (max 6)
  const canAddGoal = state.goals.length < 6;

  // Fetch all goals for the plan
  const fetchGoals = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/v1/plans/${planId}/goals`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch goals");
      }

      const data: ListResponse<GoalDTO> = await response.json();
      setState({ goals: data.data, isLoading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load goals";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [planId]);

  // Add a new goal
  const addGoal = useCallback(
    async (data: Omit<CreateGoalCommand, "plan_id">): Promise<GoalDTO> => {
      // Check limit before API call
      if (!canAddGoal) {
        throw new Error("Maximum 6 goals per plan exceeded");
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch("/api/v1/goals", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...data,
            plan_id: planId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create goal");
        }

        const result: ItemResponse<GoalDTO> = await response.json();

        // Add new goal to local state
        setState((prev) => ({
          goals: [...prev.goals, result.data],
          isLoading: false,
          error: null,
        }));

        return result.data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create goal";
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [planId, canAddGoal]
  );

  // Update an existing goal
  const updateGoal = useCallback(async (id: string, data: UpdateGoalCommand) => {
    try {
      const response = await fetch(`/api/v1/goals/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update goal");
      }

      const result: ItemResponse<GoalDTO> = await response.json();

      // Update goal in local state
      setState((prev) => ({
        ...prev,
        goals: prev.goals.map((goal) => (goal.id === id ? result.data : goal)),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update goal";
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Delete a goal
  const deleteGoal = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/v1/goals/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete goal");
      }

      // Remove goal from local state
      setState((prev) => ({
        goals: prev.goals.filter((goal) => goal.id !== id),
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete goal";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  // Reorder goals
  const reorderGoals = useCallback(
    async (newOrder: GoalDTO[]) => {
      const previousData = { ...state };

      // Update positions
      const goalsWithNewPositions = newOrder.map((goal, index) => ({
        ...goal,
        position: index + 1,
      }));

      setState((prev) => ({
        ...prev,
        goals: goalsWithNewPositions,
      }));

      try {
        // Update each goal's position
        await Promise.all(
          goalsWithNewPositions.map((goal) =>
            fetch(`/api/v1/goals/${goal.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ position: goal.position }),
            })
          )
        );
      } catch (err) {
        console.error("Error reordering goals:", err);
        // Rollback
        setState(previousData);
        throw err;
      }
    },
    [state]
  );

  // Move a goal up (decrease position)
  const moveGoalUp = useCallback(
    async (id: string) => {
      const currentIndex = state.goals.findIndex((g) => g.id === id);

      // Can't move up if already at the top
      if (currentIndex <= 0) return;

      const previousData = { ...state };
      const newOrder = [...state.goals];

      // Swap with previous goal
      [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];

      try {
        await reorderGoals(newOrder);
        // Refetch to ensure consistency
        await fetchGoals();
      } catch (err) {
        console.error("Error moving goal up:", err);
        setState(previousData);
        throw err;
      }
    },
    [state, reorderGoals, fetchGoals]
  );

  // Move a goal down (increase position)
  const moveGoalDown = useCallback(
    async (id: string) => {
      const currentIndex = state.goals.findIndex((g) => g.id === id);

      // Can't move down if already at the bottom
      if (currentIndex < 0 || currentIndex >= state.goals.length - 1) return;

      const previousData = { ...state };
      const newOrder = [...state.goals];

      // Swap with next goal
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];

      try {
        await reorderGoals(newOrder);
        // Refetch to ensure consistency
        await fetchGoals();
      } catch (err) {
        console.error("Error moving goal down:", err);
        setState(previousData);
        throw err;
      }
    },
    [state, reorderGoals, fetchGoals]
  );

  // Fetch goals on mount
  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return {
    ...state,
    fetchGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    reorderGoals,
    moveGoalUp,
    moveGoalDown,
    canAddGoal,
  };
}
