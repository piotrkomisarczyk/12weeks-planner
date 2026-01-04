/**
 * MilestoneItem Component
 * Individual milestone row with checkbox and delete action
 */

import { useState } from 'react';
import { Trash2, CalendarIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { MilestoneDTO } from '@/types';

interface MilestoneItemProps {
  milestone: MilestoneDTO;
  onToggle: (id: string, isCompleted: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  disabled?: boolean;
}

/**
 * Single milestone row
 * Shows checkbox, title, due date, and delete button
 */
export function MilestoneItem({ milestone, onToggle, onDelete, disabled = false }: MilestoneItemProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = async () => {
    if (isToggling || isDeleting) return;
    
    setIsToggling(true);
    try {
      await onToggle(milestone.id, !milestone.is_completed);
    } catch (error) {
      console.error('Failed to toggle milestone:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    if (isToggling || isDeleting) return;
    
    setIsDeleting(true);
    try {
      await onDelete(milestone.id);
    } catch (error) {
      console.error('Failed to delete milestone:', error);
      setIsDeleting(false);
    }
  };

  const isDisabled = disabled || isToggling || isDeleting;

  return (
    <div
      className={cn(
        'flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors group',
        milestone.is_completed && 'opacity-60'
      )}
    >
      {/* Checkbox */}
      <Checkbox
        checked={milestone.is_completed}
        onCheckedChange={handleToggle}
        disabled={isDisabled}
        aria-label={`Mark "${milestone.title}" as ${milestone.is_completed ? 'incomplete' : 'complete'}`}
      />

      {/* Title */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm truncate',
            milestone.is_completed && 'line-through text-muted-foreground'
          )}
        >
          {milestone.title}
        </p>
      </div>

      {/* Due Date */}
      {milestone.due_date && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <CalendarIcon className="size-3" />
          <span>{format(new Date(milestone.due_date), 'dd MMM yyyy')}</span>
        </div>
      )}

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={isDisabled}
        className="size-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        aria-label={`Delete milestone "${milestone.title}"`}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

