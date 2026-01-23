/**
 * Goal Progress Item Component
 * Individual goal with slider and input for progress tracking
 */

import React, { useState, useEffect } from 'react';
import { Slider } from '../../ui/slider';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import { Checkbox } from '../../ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { GOAL_CATEGORIES, GOAL_CATEGORY_COLORS } from '../../../types';
import { formatTextWithLineBreaks, getDisabledTooltip, isPlanReadOnly, isPlanReady } from '../../../lib/utils';
import type { GoalCategory, GoalReviewViewModel, PlanStatus } from '../../../types';

interface GoalProgressItemProps {
  goal: GoalReviewViewModel;
  onProgressUpdate: (goalId: string, progress: number) => void;
  onMilestoneToggle?: (milestoneId: string, isCompleted: boolean) => void;
  planStatus: PlanStatus;
}

export default function GoalProgressItem({ goal, onProgressUpdate, onMilestoneToggle, planStatus }: GoalProgressItemProps) {
  const [localProgress, setLocalProgress] = useState(goal.progress_percentage);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const categoryKey = goal.category as GoalCategory | null;
  const categoryLabel = categoryKey
    ? GOAL_CATEGORIES.find((category) => category.value === categoryKey)?.label ?? categoryKey
    : null;

  // Compute read-only state for review (ready or completed/archived)
  const isReadOnly = isPlanReadOnly(planStatus) || isPlanReady(planStatus);

  // Sync with prop changes
  useEffect(() => {
    setLocalProgress(goal.progress_percentage);
  }, [goal.progress_percentage]);

  // Track theme changes for proper spinner styling
  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    };

    // Set initial theme
    updateTheme();

    // Watch for theme changes - this is needed for the spinner to work correctly during theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const handleSliderChange = (value: number[]) => {
    const newProgress = value[0];
    setLocalProgress(newProgress);
  };

  const handleSliderCommit = (value: number[]) => {
    const newProgress = value[0];
    onProgressUpdate(goal.id, newProgress);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    const clampedValue = Math.max(0, Math.min(100, value));
    setLocalProgress(clampedValue);
  };

  const handleInputBlur = () => {
    onProgressUpdate(goal.id, localProgress);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  return (
    <div className="bg-card rounded-lg p-4 border border-border space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-xl text-foreground">{goal.title}</h3>
          {goal.isUpdating && (
            <div className="flex items-center text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-muted-foreground mr-1"></div>
              Updating...
            </div>
          )}
        </div>
        {categoryKey && categoryLabel && (
          <Badge className={` ${GOAL_CATEGORY_COLORS[categoryKey]}`}>
            {categoryLabel}
          </Badge>
        )}
      </div>

      {goal.description && (
        <div>
          <Label className="text-base font-medium text-foreground mb-1">Why is it important? / How will you measure your success?</Label>
          <p
            className="text-sm text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: formatTextWithLineBreaks(goal.description) }}
          />
        </div>
      )}

      {/* Milestones Checklist */}
      {goal.milestones && goal.milestones.length > 0 && (
        <div className="space-y-2">
          <Label className="text-base font-medium text-foreground">Milestones:</Label>
          <div className="space-y-2 pl-2">
            {goal.milestones.map((milestone) => (
              <div key={milestone.id} className="flex items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Checkbox
                        checked={milestone.is_completed}
                        onCheckedChange={(checked) =>
                          onMilestoneToggle?.(milestone.id, checked as boolean)
                        }
                        disabled={!onMilestoneToggle || isReadOnly}
                        aria-label={`Mark "${milestone.title}" as ${milestone.is_completed ? 'incomplete' : 'complete'}`}
                      />
                    </div>
                  </TooltipTrigger>
                  {isReadOnly && (
                    <TooltipContent>
                      <p>{getDisabledTooltip(planStatus, 'milestone')}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
                <span className={`text-sm ${milestone.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {milestone.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Slider
                  value={[localProgress]}
                  onValueChange={handleSliderChange}
                  onValueCommit={handleSliderCommit}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                  disabled={goal.isUpdating || isReadOnly}
                />
              </div>
            </TooltipTrigger>
            {isReadOnly && (
              <TooltipContent>
                <p>{getDisabledTooltip(planStatus, 'progress')}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        <div className="flex items-center space-x-2 min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Input
                type="number"
                value={localProgress}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                className="w-20 text-center"
                style={{ colorScheme: theme }}
                min={0}
                max={100}
                step={5}
                disabled={goal.isUpdating || isReadOnly}
              />
            </TooltipTrigger>
            {isReadOnly && (
              <TooltipContent>
                <p>{getDisabledTooltip(planStatus, 'progress')}</p>
              </TooltipContent>
            )}
          </Tooltip>
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      </div>
    </div>
  );
}