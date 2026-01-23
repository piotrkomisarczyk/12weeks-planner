/**
 * Goal Progress List Component
 * Displays list of goals with progress sliders for weekly review
 */

import React from 'react';
import GoalProgressItem from './GoalProgressItem';
import type { GoalReviewViewModel, PlanStatus } from '../../../types';

interface GoalProgressListProps {
  goals: GoalReviewViewModel[];
  onProgressUpdate: (goalId: string, progress: number) => void;
  onMilestoneToggle?: (milestoneId: string, isCompleted: boolean) => void;
  planStatus: PlanStatus;
}

export default function GoalProgressList({ goals, onProgressUpdate, onMilestoneToggle, planStatus }: GoalProgressListProps) {
  if (goals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No goals found for this plan.</p>
        <p className="text-sm mt-1">Add goals in the goals section to track progress here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => (
        <GoalProgressItem
          key={goal.id}
          goal={goal}
          onProgressUpdate={onProgressUpdate}
          onMilestoneToggle={onMilestoneToggle}
          planStatus={planStatus}
        />
      ))}
    </div>
  );
}