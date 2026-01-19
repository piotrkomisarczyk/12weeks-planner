/**
 * MilestoneList Component
 * Displays list of milestones for a goal
 */

import { MilestoneItem } from './MilestoneItem';
import type { MilestoneDTO } from '@/types';

interface MilestoneListProps {
  milestones: MilestoneDTO[];
  onToggle: (id: string, isCompleted: boolean) => Promise<void>;
  onUpdate: (id: string, data: { title?: string; due_date?: string | null }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  planStartDate: string;
  planEndDate: string;
  disabled?: boolean;
}

/**
 * List of milestones with toggle, edit and delete actions
 */
export function MilestoneList({
  milestones,
  onToggle,
  onUpdate,
  onDelete,
  planStartDate,
  planEndDate,
  disabled = false
}: MilestoneListProps) {
  if (milestones.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        No milestones yet. Add one to track progress.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {milestones.map((milestone) => (
        <MilestoneItem
          key={milestone.id}
          milestone={milestone}
          onToggle={onToggle}
          onUpdate={onUpdate}
          onDelete={onDelete}
          planStartDate={planStartDate}
          planEndDate={planEndDate}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

