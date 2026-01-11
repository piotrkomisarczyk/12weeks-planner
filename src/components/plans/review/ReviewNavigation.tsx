/**
 * Review Navigation Component
 * Navigation controls for switching between weeks in weekly review
 */

import React from 'react';
import { Button } from '../../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ReviewNavigationProps {
  currentWeek: number;
  planId: string;
}

export default function ReviewNavigation({ currentWeek, planId }: ReviewNavigationProps) {
  const handleWeekChange = (week: number) => {
    // Navigate to the selected week
    window.location.href = `/plans/${planId}/review/${week}`;
  };

  const handlePreviousWeek = () => {
    if (currentWeek > 1) {
      handleWeekChange(currentWeek - 1);
    }
  };

  const handleNextWeek = () => {
    if (currentWeek < 12) {
      handleWeekChange(currentWeek + 1);
    }
  };

  // Generate week options
  const weekOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePreviousWeek}
        disabled={currentWeek <= 1}
        className="flex items-center"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>

      <Select
        value={currentWeek.toString()}
        onValueChange={(value) => handleWeekChange(parseInt(value))}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Week" />
        </SelectTrigger>
        <SelectContent>
          {weekOptions.map((week) => (
            <SelectItem key={week} value={week.toString()}>
              Week {week}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={handleNextWeek}
        disabled={currentWeek >= 12}
        className="flex items-center"
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}