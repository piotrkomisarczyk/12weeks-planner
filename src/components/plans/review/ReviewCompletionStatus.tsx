/**
 * Review Completion Status Component
 * Shows completion status and button to mark review as complete
 */

import React from 'react';
import { Button } from '../../ui/button';
import { CheckCircle, Circle } from 'lucide-react';

interface ReviewCompletionStatusProps {
  isCompleted: boolean;
  onToggleComplete: () => void;
}

export default function ReviewCompletionStatus({
  isCompleted,
  onToggleComplete
}: ReviewCompletionStatusProps) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isCompleted ? (
            <CheckCircle className="h-6 w-6 text-green-500" />
          ) : (
            <Circle className="h-6 w-6 text-gray-400" />
          )}
          <div>
            <h3 className="font-medium text-gray-900">
              {isCompleted ? 'Review Completed' : 'Mark Review as Complete'}
            </h3>
            <p className="text-sm text-gray-600">
              {isCompleted
                ? 'This weekly review has been marked as complete.'
                : 'Mark this review as complete when you\'ve finished reflecting and updating goal progress.'
              }
            </p>
          </div>
        </div>

        <Button
          onClick={onToggleComplete}
          variant={isCompleted ? 'outline' : 'default'}
          className="flex items-center space-x-2"
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
      </div>
    </div>
  );
}