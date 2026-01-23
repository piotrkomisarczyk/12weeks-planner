/**
 * GoalCard Component
 * Expandable card displaying goal information
 * Uses accordion for expand/collapse functionality
 */

import { useState } from 'react';
import { Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GoalForm } from './GoalForm';
import { GoalProgress } from './GoalProgress';
import { MilestoneManager } from './milestones/MilestoneManager';
import { GOAL_CATEGORIES, GOAL_CATEGORY_COLORS } from '@/types';
import type { GoalDTO, GoalCategory } from '@/types';
import type { PlanContext } from '@/types';

interface GoalCardProps {
  goal: GoalDTO;
  planContext: PlanContext;
  onUpdate: (id: string, data: Partial<GoalDTO>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

/**
 * Expandable goal card with accordion
 * Collapsed: Shows title, category, progress bar
 * Expanded: Shows full form, progress slider, and milestones
 */
export function GoalCard({ goal, planContext, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst = false, isLast = false }: GoalCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedValue, setExpandedValue] = useState<string>('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const categoryKey = goal.category as GoalCategory | null;
  const categoryLabel = categoryKey
    ? GOAL_CATEGORIES.find((category) => category.value === categoryKey)?.label ?? categoryKey
    : null;

  const handleProgressChange = async (progress: number) => {
    await onUpdate(goal.id, { progress_percentage: progress });
  };

  const handleFormUpdate = async (data: Partial<GoalDTO>) => {
    await onUpdate(goal.id, data);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(goal.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Failed to delete goal:', error);
      setIsDeleting(false);
    }
  };

  const isDisabled = planContext.isArchived || isDeleting;

  return (
    <Accordion
      type="single"
      collapsible
      value={expandedValue}
      onValueChange={setExpandedValue}
      className="bg-card border rounded-lg"
    >
      <AccordionItem value={goal.id} className="border-none">
        <div className="p-4">
          <div className="flex items-start gap-4">
            {/* Left: Goal Info */}
            <div className="flex-1 min-w-0">
              <AccordionTrigger className="hover:no-underline p-0">
                <div className="text-left space-y-2 w-full">
                  {/* Title */}
                  <h3 className="font-semibold text-base">{goal.title}</h3>
                </div>
                {/* Category Badge inside AccordionTrigger */}
                <div className="flex items-center gap-2 shrink-0">
                  {expandedValue !== goal.id && categoryKey && categoryLabel && (
                    <Badge className={` ${GOAL_CATEGORY_COLORS[categoryKey]}`}>
                      {categoryLabel}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
            </div>

            {/* Position Controls and Actions Menu outside AccordionTrigger */}
            <div className="shrink-0 flex items-center gap-1">
              {/* Move Up Button */}
              {onMoveUp && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Move goal up"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveUp(goal.id);
                  }}
                  disabled={isFirst}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              )}

              {/* Move Down Button */}
              {onMoveDown && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Move goal down"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveDown(goal.id);
                  }}
                  disabled={isLast}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              )}

              {/* Delete Button */}
              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isDisabled}
                    aria-label="Delete goal"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Goal</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete "{goal.title}"? This will also delete all associated milestones. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteDialog(false)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Progress Bar (when collapsed) - Full width */}
          {expandedValue !== goal.id && (
            <div className="space-y-1 mt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span className="font-medium">{goal.progress_percentage}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${goal.progress_percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Expanded Content */}
          <AccordionContent>
            <div className="space-y-6 pt-4">
          {/* Goal Form */}
          <GoalForm
            title={goal.title}
            category={goal.category as GoalCategory | null}
            description={goal.description}
            onUpdate={handleFormUpdate}
            disabled={isDisabled}
          />

              {/* Progress Slider */}
              <GoalProgress
                progress={goal.progress_percentage}
                onChange={handleProgressChange}
                disabled={isDisabled}
              />

              {/* Divider */}
              <div className="border-t" />

              {/* Milestones Section */}
              <MilestoneManager
                goalId={goal.id}
                planContext={planContext}
                isGoalExpanded={expandedValue === goal.id}
              />
            </div>
          </AccordionContent>
        </div>
      </AccordionItem>
    </Accordion>
  );
}

