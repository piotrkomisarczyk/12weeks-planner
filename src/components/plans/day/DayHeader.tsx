/**
 * DayHeader Component
 *
 * Navigation header for day view showing day number, date, week number, and navigation controls.
 * Includes date picker for jumping to specific dates.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { cn, computeDayNumberFromDate, getPlanDateRange, normalizeDateToMidnight, parseDateString } from "@/lib/utils";
import { DAY_NAMES } from "@/types";

interface DayHeaderProps {
  planName: string;
  planId: string;
  dayNumber: number;
  weekNumber: number;
  computedDate: string; // YYYY-MM-DD format
  planStartDate: Date;
  onNavigate: (dayNumber: number) => void;
}

export function DayHeader({ planId, dayNumber, weekNumber, computedDate, planStartDate, onNavigate }: DayHeaderProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const currentDate = parseDateString(computedDate);
  const { start: planStart, end: planEnd } = getPlanDateRange(planStartDate);

  // Format date for display
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const result = computeDayNumberFromDate(date, planStartDate);
    if (!result) {
      return; // Out of range
    }

    // Navigate to the new day
    if (result.weekNumber !== weekNumber) {
      // Different week - navigate to that week and day
      window.location.href = `/plans/${planId}/week/${result.weekNumber}/day/${result.dayNumber}`;
    } else {
      // Same week - just navigate to the day
      onNavigate(result.dayNumber);
    }

    setDatePickerOpen(false);
  };

  const handlePreviousDay = () => {
    if (dayNumber === 1 && weekNumber > 1) {
      // Go to last day of previous week
      window.location.href = `/plans/${planId}/week/${weekNumber - 1}/day/7`;
    } else if (dayNumber > 1) {
      onNavigate(dayNumber - 1);
    }
  };

  const handleNextDay = () => {
    if (dayNumber === 7 && weekNumber < 12) {
      // Go to first day of next week
      window.location.href = `/plans/${planId}/week/${weekNumber + 1}/day/1`;
    } else if (dayNumber < 7) {
      onNavigate(dayNumber + 1);
    }
  };

  const handleWeekBadgeClick = () => {
    window.location.href = `/plans/${planId}/week/${weekNumber}`;
  };

  return (
    <Card className="rounded-lg">
      <CardContent>
        {/* Day Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">Day {dayNumber + (weekNumber - 1) * 7}</h1>

            <Badge
              variant="default"
              className="text-sm cursor-pointer hover:bg-primary/80 transition-colors"
              onClick={handleWeekBadgeClick}
            >
              Week {weekNumber}
            </Badge>

            {/* Date Display with Picker */}
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("text-left font-normal", !currentDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formattedDate}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={currentDate}
                  defaultMonth={currentDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => {
                    const normalizedDate = normalizeDateToMidnight(date);
                    return normalizedDate < planStart || normalizedDate > planEnd;
                  }}
                  weekStartsOn={1}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousDay}
              disabled={weekNumber === 1 && dayNumber === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous Day
            </Button>

            <div className="text-sm text-muted-foreground px-2">Day {dayNumber} / 7</div>

            <Button variant="outline" size="sm" onClick={handleNextDay} disabled={weekNumber === 12 && dayNumber === 7}>
              Next Day
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Day of Week Progress Indicator */}
        <div className="mt-3">
          <div className="flex gap-2">
            {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => (
              <button
                key={day}
                onClick={() => onNavigate(day)}
                className={cn(
                  "flex-1 py-0.75 px-1 text-center rounded-md transition-all text-xs font-medium",
                  day === dayNumber
                    ? "bg-primary text-primary-foreground"
                    : day < dayNumber
                      ? "bg-primary/20 text-primary hover:bg-primary/30"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
                title={DAY_NAMES[day - 1]}
              >
                {DAY_NAMES[day - 1]}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
