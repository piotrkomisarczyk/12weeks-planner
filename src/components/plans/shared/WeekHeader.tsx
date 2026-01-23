/**
 * WeekHeader Component
 * 
 * Navigation header for week view showing week number, date range, and navigation controls.
 */

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface WeekHeaderProps {
  weekNumber: number;
  startDate: Date;
  planName: string;
  onNavigate: (weekNumber: number) => void;
}

function getWeekDateRange(startDate: Date, weekNumber: number): { start: Date; end: Date } {
  const weekStart = new Date(startDate);
  weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  return { start: weekStart, end: weekEnd };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function WeekHeader({ weekNumber, startDate, planName, onNavigate }: WeekHeaderProps) {
  const { start, end } = getWeekDateRange(startDate, weekNumber);
  const canGoPrev = weekNumber > 1;
  const canGoNext = weekNumber < 12;

  return (
    <Card className="rounded-lg">
      <CardContent>

        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">
              Week {weekNumber}
            </h1>
            <div className="text-base text-muted-foreground">
              {formatDate(start)} - {formatDate(end)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate(weekNumber - 1)}
              disabled={!canGoPrev}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="text-sm text-muted-foreground px-2">
              {weekNumber} / 12
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate(weekNumber + 1)}
              disabled={!canGoNext}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-3">
          <div className="flex gap-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => (
              <button
                key={week}
                onClick={() => onNavigate(week)}
                className={cn(
                  'flex-1 py-0.75 px-1 text-center rounded-md transition-all text-xs font-medium',
                  week === weekNumber
                    ? 'bg-primary text-primary-foreground'
                    : week < weekNumber
                    ? 'bg-primary/20 text-primary hover:bg-primary/30'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
                title={`Week ${week}`}
              >
                {week}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

