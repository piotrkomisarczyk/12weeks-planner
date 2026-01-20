/**
 * Goal Progress Item Component
 * Individual goal with slider and input for progress tracking
 */

import React, { useState, useEffect } from 'react';
import { Slider } from '../../ui/slider';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import { GOAL_CATEGORIES, GOAL_CATEGORY_COLORS } from '../../../types';
import type { GoalCategory, GoalReviewViewModel } from '../../../types';

interface GoalProgressItemProps {
  goal: GoalReviewViewModel;
  onProgressUpdate: (goalId: string, progress: number) => void;
}

export default function GoalProgressItem({ goal, onProgressUpdate }: GoalProgressItemProps) {
  const [localProgress, setLocalProgress] = useState(goal.progress_percentage);
  const categoryKey = goal.category as GoalCategory | null;
  const categoryLabel = categoryKey
    ? GOAL_CATEGORIES.find((category) => category.value === categoryKey)?.label ?? categoryKey
    : null;

  // Sync with prop changes
  useEffect(() => {
    setLocalProgress(goal.progress_percentage);
  }, [goal.progress_percentage]);

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
          <h3 className="font-semibold text-base text-foreground">{goal.title}</h3>
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
        <p className="text-sm text-muted-foreground">{goal.description}</p>
      )}

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Slider
            value={[localProgress]}
            onValueChange={handleSliderChange}
            onValueCommit={handleSliderCommit}
            max={100}
            min={0}
            step={5}
            className="w-full"
            disabled={goal.isUpdating}
          />
        </div>

        <div className="flex items-center space-x-2 min-w-0">
          <Input
            type="number"
            value={localProgress}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="w-20 text-center"
            min={0}
            max={100}
            step={5}
            disabled={goal.isUpdating}
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      </div>
    </div>
  );
}