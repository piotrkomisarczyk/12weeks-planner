/**
 * Review Header Component
 * Contains the title and navigation for weekly review
 */

import React from 'react';
import ReviewNavigation from './ReviewNavigation';

interface ReviewHeaderProps {
  planId: string;
  weekNumber: number;
}

export default function ReviewHeader({ planId, weekNumber }: ReviewHeaderProps) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Weekly Review - Week {weekNumber}
          </h1>
          <p className="text-gray-600 mt-1">
            Reflect on your progress this week
          </p>
        </div>

        <ReviewNavigation
          currentWeek={weekNumber}
          planId={planId}
        />
      </div>
    </div>
  );
}