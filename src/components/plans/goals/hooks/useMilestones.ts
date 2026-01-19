/**
 * useMilestones Hook
 * Manages milestones for a specific goal
 * Handles CRUD operations and maintains local state
 */

import { useState, useCallback } from 'react';
import type {
  MilestoneDTO,
  CreateMilestoneCommand,
  UpdateMilestoneCommand,
  ListResponse,
  ItemResponse,
} from '@/types';

interface UseMilestonesState {
  milestones: MilestoneDTO[];
  isLoading: boolean;
  error: string | null;
}

interface UseMilestonesReturn extends UseMilestonesState {
  fetchMilestones: () => Promise<void>;
  addMilestone: (data: Omit<CreateMilestoneCommand, 'long_term_goal_id'>) => Promise<MilestoneDTO>;
  updateMilestone: (id: string, data: UpdateMilestoneCommand) => Promise<void>;
  toggleMilestone: (id: string, isCompleted: boolean) => Promise<void>;
  deleteMilestone: (id: string) => Promise<void>;
  canAddMilestone: boolean;
}

/**
 * Hook for managing milestones for a specific goal
 * Lazy loading - fetch is called manually when goal is expanded
 * 
 * @param goalId - ID of the goal
 * @returns Milestones state and CRUD operations
 * 
 * @example
 * ```tsx
 * const { milestones, isLoading, fetchMilestones, addMilestone, toggleMilestone, deleteMilestone } = useMilestones(goalId);
 * 
 * // Fetch milestones when goal is expanded
 * await fetchMilestones();
 * 
 * // Add milestone
 * await addMilestone({
 *   title: 'Milestone title',
 *   due_date: '2025-02-15',
 *   position: 1
 * });
 * 
 * // Toggle completion
 * await toggleMilestone(milestoneId, true);
 * ```
 */
export function useMilestones(goalId: string): UseMilestonesReturn {
  const [state, setState] = useState<UseMilestonesState>({
    milestones: [],
    isLoading: false,
    error: null,
  });

  // Check if user can add more milestones (max 5)
  const canAddMilestone = state.milestones.length < 5;

  // Fetch milestones for the goal (lazy loading)
  const fetchMilestones = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/v1/goals/${goalId}/milestones`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch milestones');
      }

      const data: ListResponse<MilestoneDTO> = await response.json();
      setState({ milestones: data.data, isLoading: false, error: null });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load milestones';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [goalId]);

  // Add a new milestone
  const addMilestone = useCallback(
    async (data: Omit<CreateMilestoneCommand, 'long_term_goal_id'>): Promise<MilestoneDTO> => {
      // Check limit before API call
      if (!canAddMilestone) {
        throw new Error('Maximum 5 milestones per goal exceeded');
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch('/api/v1/milestones', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            long_term_goal_id: goalId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          // For validation errors, extract the specific message from details[0].message
          const errorMessage = errorData.details?.[0]?.message || errorData.error || 'Failed to create milestone';
          throw new Error(errorMessage);
        }

        const result: ItemResponse<MilestoneDTO> = await response.json();

        // Add new milestone to local state
        setState((prev) => ({
          milestones: [...prev.milestones, result.data],
          isLoading: false,
          error: null,
        }));

        return result.data;
      } catch (error) {
        // Don't set global error state for validation errors during creation
        // Only set loading back to false, let the form handle the error display
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));
        throw error;
      }
    },
    [goalId, canAddMilestone]
  );

  // Update a milestone
  const updateMilestone = useCallback(
    async (id: string, data: UpdateMilestoneCommand) => {
      try {
        const response = await fetch(`/api/v1/milestones/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          // For validation errors, extract the specific message from details[0].message
          const errorMessage = errorData.details?.[0]?.message || errorData.error || 'Failed to update milestone';
          throw new Error(errorMessage);
        }

        const result: ItemResponse<MilestoneDTO> = await response.json();

        // Update milestone in local state
        setState((prev) => ({
          ...prev,
          milestones: prev.milestones.map((milestone) =>
            milestone.id === id ? result.data : milestone
          ),
        }));
      } catch (error) {
        // Don't set global error state for validation/update errors
        // Let the calling component handle error display
        throw error;
      }
    },
    []
  );

  // Toggle milestone completion status
  const toggleMilestone = useCallback(
    async (id: string, isCompleted: boolean) => {
      await updateMilestone(id, { is_completed: isCompleted });
    },
    [updateMilestone]
  );

  // Delete a milestone
  const deleteMilestone = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/v1/milestones/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        // For validation errors, extract the specific message from details[0].message
        const errorMessage = errorData.details?.[0]?.message || errorData.error || 'Failed to delete milestone';
        throw new Error(errorMessage);
      }

      // Remove milestone from local state
      setState((prev) => ({
        milestones: prev.milestones.filter((milestone) => milestone.id !== id),
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      // Don't set global error state for delete errors
      // Let the calling component handle error display
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
      throw error;
    }
  }, []);

  return {
    ...state,
    fetchMilestones,
    addMilestone,
    updateMilestone,
    toggleMilestone,
    deleteMilestone,
    canAddMilestone,
  };
}

