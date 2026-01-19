/**
 * MilestoneManager Component
 * Manages milestones for a goal with lazy loading
 */

import { useEffect, useRef, useState } from 'react';
import { useMilestones } from '../hooks/useMilestones';
import { MilestoneList } from './MilestoneList';
import { MilestoneForm } from './MilestoneForm';
import type { PlanContext } from '@/types';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  variant?: 'default' | 'destructive';
}

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
    updateMilestone,
    toggleMilestone,
    deleteMilestone,
    canAddMilestone,
  } = useMilestones(goalId);

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const [deletingMilestoneId, setDeletingMilestoneId] = useState<string | null>(null);

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

  const handleUpdateMilestone = async (id: string, data: { title?: string; due_date?: string | null }) => {
    // Prevent operations if no milestones exist
    if (milestones.length === 0) return;

    try {
      await updateMilestone(id, data);
      toast.success('Milestone updated');
    } catch (error) {
      // Let the form component handle error display for validation errors
      // Only show toast for unexpected errors (not validation-related)
      throw error;
    }
  };

  const handleConfirmDeleteMilestone = async (id: string) => {
    // Prevent operations if no milestones exist
    if (milestones.length === 0) return;

    setDeletingMilestoneId(id);
    try {
      await deleteMilestone(id);
      toast.success('Milestone deleted');
    } catch (error) {
      toast.error('Failed to delete milestone');
      throw error;
    } finally {
      setDeletingMilestoneId(null);
    }
  };

  const handleDeleteMilestone = (id: string) => {
    const milestone = milestones.find((m) => m.id === id);
    if (!milestone) return;

    // Helper function to truncate milestone titles for modal display
    const truncateTitle = (title: string, maxLength: number = 50) => {
      return title.length > maxLength ? `${title.slice(0, maxLength)}...` : title;
    };

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Milestone',
      description: `Are you sure you want to delete "${truncateTitle(milestone.title)}"? This action cannot be undone.`,
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await handleConfirmDeleteMilestone(id);
        } catch (error) {
          // Error handling is done in handleConfirmDeleteMilestone
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
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
            onUpdate={handleUpdateMilestone}
            onDelete={handleDeleteMilestone}
            planStartDate={planContext.startDate}
            planEndDate={planContext.endDate}
            disabled={isDisabled}
            deletingMilestoneId={deletingMilestoneId}
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

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription className="break-words">{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
              }
            >
              Cancel
            </Button>
            <Button
              variant={confirmDialog.variant === 'destructive' ? 'destructive' : 'default'}
              onClick={confirmDialog.onConfirm}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

