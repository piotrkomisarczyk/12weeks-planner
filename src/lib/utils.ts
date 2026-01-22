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
