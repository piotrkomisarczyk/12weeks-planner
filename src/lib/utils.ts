import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates the current week number (1-12) based on plan start date and today's date
 * Clamps the result to be within the valid range of 1-12
 */
export function calculateCurrentWeek(plan: { start_date: string }): number {
  const startDate = new Date(plan.start_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  let currentWeek = Math.floor(diffDays / 7) + 1;

  // Clamp to valid range
  if (currentWeek < 1) currentWeek = 1;
  if (currentWeek > 12) currentWeek = 12;

  return currentWeek;
}

/**
 * Calculates the current day of the week (1-7) where Monday = 1, Sunday = 7
 */
export function calculateCurrentDay(): number {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Convert to 1-7 format where Monday = 1
  return dayOfWeek === 0 ? 7 : dayOfWeek;
}

/**
 * Converts newlines (\n) to HTML line breaks (<br>) for display in React components
 * This preserves line breaks when text is stored with newlines but displayed as HTML
 */
export function formatTextWithLineBreaks(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/\n/g, '<br>');
}

/**
 * Normalizes a date to midnight (00:00:00.000) to avoid timezone issues in comparisons
 * @param date - The date to normalize
 * @returns A new Date object set to midnight
 */
export function normalizeDateToMidnight(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Get valid date range for a 12-week plan
 * Normalizes dates to midnight to avoid timezone issues
 * @param planStartDate - The start date of the plan
 * @returns Object with start and end dates (start at midnight, end at 23:59:59.999)
 */
export function getPlanDateRange(planStartDate: Date): { start: Date; end: Date } {
  const start = normalizeDateToMidnight(planStartDate);
  const end = new Date(start);
  end.setDate(end.getDate() + (12 * 7) - 1);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Calculate the Monday offset for a given date
 * Used to align plan dates to start on Monday
 * @param date - The date to calculate offset for
 * @returns The number of days to add to get to the nearest Monday
 */
export function getMondayOffset(date: Date): number {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  return dayOfWeek === 0 ? 1 : 1 - dayOfWeek;
}

/**
 * Compute the actual date for a specific week and day within a plan
 * Adjusts for the fact that day 1 should always be Monday
 * @param planStartDate - The start date of the plan
 * @param weekNumber - Week number (1-12)
 * @param dayNumber - Day number (1-7, Monday=1)
 * @returns ISO date string (YYYY-MM-DD)
 */
export function computePlanDate(planStartDate: Date, weekNumber: number, dayNumber: number): string {
  const date = new Date(planStartDate);
  const mondayOffset = getMondayOffset(date);
  const daysToAdd = (weekNumber - 1) * 7 + (dayNumber - 1) + mondayOffset;
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Compute week and day number from a date relative to plan start
 * @param date - The date to convert
 * @param planStartDate - The start date of the plan
 * @returns Object with weekNumber and dayNumber, or null if out of plan range (12 weeks)
 */
export function computeDayNumberFromDate(
  date: Date,
  planStartDate: Date
): { weekNumber: number; dayNumber: number } | null {
  const normalizedDate = normalizeDateToMidnight(date);
  const normalizedPlanStart = normalizeDateToMidnight(planStartDate);

  const daysDiff = Math.floor(
    (normalizedDate.getTime() - normalizedPlanStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff < 0 || daysDiff >= 12 * 7) {
    return null; // Out of plan range
  }

  const weekNumber = Math.floor(daysDiff / 7) + 1;
  const dayNumber = (daysDiff % 7) + 1;

  return { weekNumber, dayNumber };
}
