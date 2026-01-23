/**
 * Review Completion Status Component
 * Shows completion status and button to mark review as complete
 */

import React from 'react';
import { Button } from '../../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { CheckCircle, Circle } from 'lucide-react';
import { getDisabledTooltip, isPlanReadOnly, isPlanReady } from '../../../lib/utils';
import type { PlanStatus } from '../../../types';

interface ReviewCompletionStatusProps {
  isCompleted: boolean;
  onToggleComplete: () => void;
  planStatus: PlanStatus;
}

export default function ReviewCompletionStatus({
  isCompleted,
  onToggleComplete,
  planStatus
}: ReviewCompletionStatusProps) {
  // Compute read-only state for review (ready or completed/archived)
  const isReadOnly = isPlanReadOnly(planStatus) || isPlanReady(planStatus);
  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isCompleted ? (
            <CheckCircle className="h-6 w-6 text-green-500 dark:text-green-400" />
          ) : (
            <Circle className="h-6 w-6 text-muted-foreground" />
          )}
          <div>
            <h3 className="font-medium text-foreground">
              {isCompleted ? 'Review Completed' : 'Mark Review as Complete'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isCompleted
                ? 'This weekly review has been marked as complete.'
                : 'Mark this review as complete when you\'ve finished reflecting and updating goal progress.'
              }
            </p>
          </div>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onToggleComplete}
              variant={isCompleted ? 'outline' : 'default'}
              className="flex items-center space-x-2"
              disabled={isReadOnly}
            >
              {isCompleted ? (
                <>
                  <Circle className="h-4 w-4" />
                  <span>Mark as Incomplete</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Mark as Complete</span>
                </>
              )}
            </Button>
          </TooltipTrigger>
          {isReadOnly && (
            <TooltipContent>
              <p>Review completion cannot be changed - plan is {planStatus === 'ready' ? 'in ready state' : planStatus === 'completed' ? 'completed' : 'archived'}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </div>
  );
}