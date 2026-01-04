/**
 * View-specific types for Goals View
 * Extends base DTOs with UI-specific properties
 */

import type { GoalDTO, MilestoneDTO, PlanDTO, GoalCategory } from '@/types';

/**
 * Goal with milestones (loaded lazily)
 * UI extension to manage loading states
 */
export interface GoalWithMilestones extends GoalDTO {
  milestones?: MilestoneDTO[];
  isLoadingMilestones?: boolean;
}

/**
 * Plan context for the goals view
 * Provides plan metadata for validation and display
 */
export interface PlanContext {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isArchived: boolean;
  status: PlanDTO['status'];
}

/**
 * Goal form data for editing
 */
export interface GoalFormData {
  title: string;
  category: GoalCategory | null;
  description: string | null;
  progress_percentage: number;
}

/**
 * Milestone form data for creation
 */
export interface MilestoneFormData {
  title: string;
  due_date: string | null;
  description?: string | null;
}

/**
 * Save status for auto-save forms
 */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

