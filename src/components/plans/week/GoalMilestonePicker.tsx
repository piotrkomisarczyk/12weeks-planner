/**
 * GoalMilestonePicker Component
 * 
 * Two-step dialog for selecting goal and milestone associations.
 * Step 1: Select a Long-Term Goal
 * Step 2: Select a Milestone (or "Just the goal" option)
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Target, Flag, CheckCircle2 } from 'lucide-react';
import type { SimpleGoal, SimpleMilestone } from '@/types';
import { GOAL_CATEGORIES, GOAL_CATEGORY_COLORS } from '@/types';
import { cn } from '@/lib/utils';

interface GoalMilestonePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableGoals: SimpleGoal[];
  availableMilestones: SimpleMilestone[];
  currentGoalId?: string | null;
  currentMilestoneId?: string | null;
  onSelect: (goalId: string | null, milestoneId: string | null) => void;
  title?: string;
  description?: string;
}

type Step = 'goal' | 'milestone';

/**
 * Get the display label for a goal category
 */
const getCategoryLabel = (category: string): string => {
  const categoryItem = GOAL_CATEGORIES.find(cat => cat.value === category);
  return categoryItem?.label || category;
};

export function GoalMilestonePicker({
  open,
  onOpenChange,
  availableGoals,
  availableMilestones,
  currentGoalId,
  currentMilestoneId,
  onSelect,
  title = 'Link to Goal & Milestone',
  description = 'Select a long-term goal and optionally a milestone to link with this item.',
}: GoalMilestonePickerProps) {
  const [step, setStep] = useState<Step>('goal');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep('goal');
      setSelectedGoalId(currentGoalId || null);
    }
  }, [open, currentGoalId]);

  // Filter milestones for selected goal
  const filteredMilestones = selectedGoalId
    ? availableMilestones.filter(m => m.long_term_goal_id === selectedGoalId)
    : [];

  const selectedGoal = availableGoals.find(g => g.id === selectedGoalId);

  /**
   * Handle goal selection - move to milestone step
   */
  const handleGoalSelect = (goalId: string) => {
    setSelectedGoalId(goalId);
    setStep('milestone');
  };

  /**
   * Handle "Just the goal" option - link only to goal
   */
  const handleGoalOnly = () => {
    if (selectedGoalId) {
      onSelect(selectedGoalId, null);
      onOpenChange(false);
    }
  };

  /**
   * Handle milestone selection - link to both goal and milestone
   */
  const handleMilestoneSelect = (milestoneId: string) => {
    if (selectedGoalId) {
      onSelect(selectedGoalId, milestoneId);
      onOpenChange(false);
    }
  };

  /**
   * Handle unlink - remove both associations
   */
  const handleUnlink = () => {
    onSelect(null, null);
    onOpenChange(false);
  };

  /**
   * Handle back button - return to goal selection
   */
  const handleBack = () => {
    setStep('goal');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'milestone' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="h-6 w-6 p-0 mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {title}
          </DialogTitle>
          <DialogDescription>
            {step === 'goal' ? description : `Select a milestone for "${selectedGoal?.title}"`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {/* Step 1: Goal Selection */}
          {step === 'goal' && (
            <div className="space-y-2">
              {availableGoals.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No long-term goals available.</p>
                  <p className="text-xs mt-1">Create goals in the Goals view first.</p>
                </div>
              ) : (
                <>
                  {availableGoals.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => handleGoalSelect(goal.id)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg border-2 transition-all',
                        'hover:border-primary hover:bg-accent',
                        currentGoalId === goal.id
                          ? 'border-primary bg-accent'
                          : 'border-border'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <Target className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm mb-1">{goal.title}</div>
                          <Badge
                            className={GOAL_CATEGORY_COLORS[goal.category] || 'bg-gray-500 text-white'}
                          >
                            {getCategoryLabel(goal.category)}
                          </Badge>
                        </div>
                        {currentGoalId === goal.id && (
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Step 2: Milestone Selection */}
          {step === 'milestone' && (
            <div className="space-y-3">
              {/* "Just the goal" option */}
              <button
                onClick={handleGoalOnly}
                className={cn(
                  'w-full text-left p-3 rounded-lg border-2 transition-all',
                  'hover:border-primary hover:bg-accent',
                  currentGoalId === selectedGoalId && !currentMilestoneId
                    ? 'border-primary bg-accent'
                    : 'border-border'
                )}
              >
                <div className="flex items-start gap-2">
                  <Target className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Just the goal</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Link only to "{selectedGoal?.title}"
                    </div>
                  </div>
                  {currentGoalId === selectedGoalId && !currentMilestoneId && (
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  )}
                </div>
              </button>

              {/* Divider */}
              {filteredMilestones.length > 0 && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or select a milestone
                    </span>
                  </div>
                </div>
              )}

              {/* Milestone list */}
              {filteredMilestones.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  <Flag className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No milestones for this goal.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMilestones.map((milestone) => (
                    <button
                      key={milestone.id}
                      onClick={() => handleMilestoneSelect(milestone.id)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg border-2 transition-all',
                        'hover:border-primary hover:bg-accent',
                        currentMilestoneId === milestone.id
                          ? 'border-primary bg-accent'
                          : 'border-border'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <Flag className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm mb-1">{milestone.title}</div>
                          {milestone.due_date && (
                            <div className="text-xs text-muted-foreground">
                              Due: {new Date(milestone.due_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        {currentMilestoneId === milestone.id && (
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex justify-between pt-4 border-t">
          {(currentGoalId || currentMilestoneId) && step === 'goal' ? (
            <Button variant="outline" onClick={handleUnlink}>
              Unlink
            </Button>
          ) : (
            <div />
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

