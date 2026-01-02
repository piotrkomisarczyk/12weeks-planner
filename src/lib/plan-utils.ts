import type { PlanDTO, PlanStatus } from '@/types';

/**
 * PlanViewModel extends PlanDTO with computed fields for frontend display
 */
export interface PlanViewModel extends PlanDTO {
  endDate: Date;
  currentWeek: number | null;
  isOverdue: boolean;
  displayStatus: string;
}

/**
 * Checks if a date is a Monday
 */
export function isMonday(date: Date): boolean {
  return date.getDay() === 1;
}

/**
 * Calculates the end date (start_date + 12 weeks)
 */
function calculateEndDate(startDate: string): Date {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 12 * 7); // 12 weeks = 84 days
  return end;
}

/**
 * Calculates the current week number (1-12) based on today's date
 * Returns null if current date is outside the plan's time range
 */
function calculateCurrentWeek(startDate: string, endDate: Date): number | null {
  const start = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time for accurate comparison
  start.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  // If today is before start date or after end date, return null
  if (today < start || today > endDate) {
    return null;
  }

  // Calculate weeks elapsed since start
  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(diffDays / 7) + 1;

  return weekNumber >= 1 && weekNumber <= 12 ? weekNumber : null;
}

/**
 * Checks if the plan's end date has passed
 */
function checkIsOverdue(endDate: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return today > end;
}

/**
 * Formats the status for display (capitalize first letter)
 */
function formatDisplayStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Transforms a PlanDTO into a PlanViewModel with computed fields
 */
export function transformPlanToViewModel(plan: PlanDTO): PlanViewModel {
  const endDate = calculateEndDate(plan.start_date);
  const currentWeek = calculateCurrentWeek(plan.start_date, endDate);
  const isOverdue = checkIsOverdue(endDate);
  const displayStatus = formatDisplayStatus(plan.status);

  return {
    ...plan,
    endDate,
    currentWeek,
    isOverdue,
    displayStatus,
  };
}

/**
 * Transforms an array of PlanDTOs into PlanViewModels
 */
export function transformPlansToViewModels(plans: PlanDTO[]): PlanViewModel[] {
  return plans.map(transformPlanToViewModel);
}

/**
 * Formats a date to a readable string (e.g., "Jan 1, 2024")
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

