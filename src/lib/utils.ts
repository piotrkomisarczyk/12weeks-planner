import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { DAY_NAMES, type PlanStatus, type ErrorResponse } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates the current week number (1-12) based on plan start date and today's date
 * Uses UTC-based calendar day calculations to avoid DST issues
 * Clamps the result to be within the valid range of 1-12
 */
export function calculateCurrentWeek(plan: { start_date: string }): number {
  const startDate = parseDateString(plan.start_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);

  // Use UTC to calculate calendar days to avoid DST issues
  const utc1 = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const utc2 = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  
  const diffDays = Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
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
 * Parses a YYYY-MM-DD string to a Date in local timezone
 * This avoids timezone issues that occur when using new Date(string)
 * which treats the string as UTC and can shift to the previous day
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object in local timezone at midnight
 */
export function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
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
 * @returns ISO date string (YYYY-MM-DD) in local timezone
 */
export function computePlanDate(planStartDate: Date, weekNumber: number, dayNumber: number): string {
  const date = new Date(planStartDate);
  const mondayOffset = getMondayOffset(date);
  const daysToAdd = (weekNumber - 1) * 7 + (dayNumber - 1) + mondayOffset;
  date.setDate(date.getDate() + daysToAdd);
  
  // Format as YYYY-MM-DD in local timezone (don't use toISOString which converts to UTC)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Compute week and day number from a date relative to plan start
 * Uses UTC-based calendar day calculations to avoid DST issues
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

  // Use UTC to calculate calendar days to avoid DST issues
  const utc1 = Date.UTC(
    normalizedPlanStart.getFullYear(),
    normalizedPlanStart.getMonth(),
    normalizedPlanStart.getDate()
  );
  const utc2 = Date.UTC(
    normalizedDate.getFullYear(),
    normalizedDate.getMonth(),
    normalizedDate.getDate()
  );

  const daysDiff = Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));

  if (daysDiff < 0 || daysDiff >= 12 * 7) {
    return null; // Out of plan range
  }

  const weekNumber = Math.floor(daysDiff / 7) + 1;
  const dayNumber = (daysDiff % 7) + 1;

  return { weekNumber, dayNumber };
}

/**
 * Get the day name from a day number (1-7, Monday=1)
 * @param dayNumber - Day number (1-7, where 1=Monday, 7=Sunday)
 * @returns Day name (e.g., "Monday", "Tuesday", etc.) or null if invalid day number
 */
export function getDayName(dayNumber: number): string | null {
  if (dayNumber < 1 || dayNumber > 7) {
    return null;
  }
  return DAY_NAMES[dayNumber - 1];
}

// ============================================================================
// PLAN STATUS MANAGEMENT UTILITIES
// ============================================================================

/**
 * Determines if plan is in read-only mode
 * Read-only mode applies to 'completed' and 'archived' plans
 */
export function isPlanReadOnly(status: PlanStatus): boolean {
  return status === 'completed' || status === 'archived';
}

/**
 * Determines if plan is in ready state
 * Ready state applies to 'ready' plans
 */
export function isPlanReady(status: PlanStatus): boolean {
  return status === 'ready';
}

/**
 * Determines if task status can be changed
 * Task status can only be changed in 'active' plans
 */
export function canChangeTaskStatus(status: PlanStatus): boolean {
  return status === 'active';
}

/**
 * Determines if goal progress can be changed
 * Goal progress can only be changed in 'active' plans
 * In 'ready' state, goal form fields remain editable but progress is disabled
 */
export function canChangeGoalProgress(status: PlanStatus): boolean {
  return status === 'active';
}

/**
 * Gets tooltip message for disabled component
 * @param status - The plan status
 * @param context - The context for the tooltip message
 */
export function getDisabledTooltip(status: PlanStatus, context: 'task_status' | 'progress' | 'milestone' | 'reflection' | 'general'): string {
  if (status === 'ready') {
    switch (context) {
      case 'task_status':
        return 'Task status cannot be changed - plan is in ready state';
      case 'progress':
        return 'Progress cannot be changed - plan is in ready state';
      case 'milestone':
        return 'Milestone completion cannot be changed - plan is in ready state';
      case 'reflection':
        return 'Reflection cannot be edited - plan is in ready state';
      default:
        return 'This action is disabled - plan is in ready state';
    }
  }

  if (status === 'completed') {
    return 'Plan is completed - editing disabled';
  }

  if (status === 'archived') {
    return 'Plan is archived - editing disabled';
  }

  return '';
}

// ============================================================================
// API RESPONSE UTILITIES
// ============================================================================

/**
 * Returns a standardized 401 Unauthorized response
 * Used when user authentication is required but not provided
 * @returns Response object with 401 status and error message
 */
export function GetUnauthorizedResponse(): Response {
  return new Response(
    JSON.stringify({
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource'
    } as ErrorResponse),
    {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
