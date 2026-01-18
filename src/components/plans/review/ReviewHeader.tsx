/**
 * Review Header Component
 * Contains the title and navigation for weekly review
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ReviewNavigation from './ReviewNavigation';

interface ReviewHeaderProps {
  planId: string;
  weekNumber: number;
}

export default function ReviewHeader({ planId, weekNumber }: ReviewHeaderProps) {
  return (
    <Card className="rounded-lg">
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Weekly Review - Week {weekNumber}
            </h1>
            <p className="text-muted-foreground mt-1">
              Reflect on your progress this week
            </p>
          </div>

          <ReviewNavigation
            currentWeek={weekNumber}
            planId={planId}
          />
        </div>
      </CardContent>
    </Card>
  );
}