/**
 * MilestoneManager Component
 * Manages milestones for a goal with lazy loading
 */

import { useEffect, useRef } from 'react';
import { useMilestones } from '../hooks/useMilestones';
import { MilestoneList } from './MilestoneList';
import { MilestoneForm } from './MilestoneForm';
import type { PlanContext } from '@/types';
import { toast } from 'sonner';

interface MilestoneManagerProps {
  goalId: string;
  planContext: PlanContext;
  isGoalExpanded: boolean;
}

/**
 * Container for milestone management
 * Lazy loads milestones when goal is expanded
 */
export function MilestoneManager({ goalId, planContext, isGoalExpanded }: MilestoneManagerProps) {
  const {
    milestones,
    isLoading,
    error,
    fetchMilestones,
    addMilestone,
    toggleMilestone,
    deleteMilestone,
    canAddMilestone,
  } = useMilestones(goalId);

  // Track if milestones have been fetched for this goal
  const hasFetchedRef = useRef(false);

  // Lazy load milestones when goal is expanded (only once)
  useEffect(() => {
    if (isGoalExpanded && !hasFetchedRef.current && !isLoading) {
      hasFetchedRef.current = true;
      fetchMilestones();
    }
  }, [isGoalExpanded, fetchMilestones, isLoading]);

  const handleAddMilestone = async (data: {
    title: string;
    due_date: string | null;
    position: number;
  }) => {
    try {
      await addMilestone(data);
      toast.success('Milestone added');
    } catch (error) {
      // Let the form component handle error display for validation errors
      // Only show toast for unexpected errors (not validation-related)
      throw error;
    }
  };

  const handleToggleMilestone = async (id: string, isCompleted: boolean) => {
    // Prevent operations if no milestones exist
    if (milestones.length === 0) return;
    
    try {
      await toggleMilestone(id, isCompleted);
    } catch (error) {
      toast.error('Failed to update milestone');
      throw error;
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    // Prevent operations if no milestones exist
    if (milestones.length === 0) return;
    
    try {
      await deleteMilestone(id);
      toast.success('Milestone deleted');
    } catch (error) {
      toast.error('Failed to delete milestone');
      throw error;
    }
  };

  const isDisabled = planContext.isArchived;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold mb-3">Milestones</h4>

        {/* Loading State */}
        {isLoading && milestones.length === 0 && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Loading milestones...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="py-4 text-center">
            <p className="text-sm text-destructive mb-2">Failed to load milestones</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        )}

        {/* Milestone List */}
        {!isLoading && !error && (
          <MilestoneList
            milestones={milestones}
            onToggle={handleToggleMilestone}
            onDelete={handleDeleteMilestone}
            disabled={isDisabled}
          />
        )}
      </div>

      {/* Add Milestone Form */}
      {!isDisabled && (
        <MilestoneForm
          onAdd={handleAddMilestone}
          planStartDate={planContext.startDate}
          planEndDate={planContext.endDate}
          currentMilestonesCount={milestones.length}
          disabled={!canAddMilestone}
        />
      )}

      {/* Milestone Count */}
      <div className="text-xs text-muted-foreground">
        {milestones.length} / 5 milestones
      </div>
    </div>
  );
}

