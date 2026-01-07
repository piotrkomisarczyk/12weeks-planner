/**
 * TaskStatusControl Component
 * 
 * Specialized control for task status with 5 states.
 * - Click cycles through: todo -> in_progress -> completed -> todo
 * - Chevron/Menu opens popover with all 5 options (including cancelled, postponed)
 * 
 * Icons:
 * - todo: Empty square (black border, white background)
 * - in_progress: Half-filled square (diagonal from top-left)
 * - completed: Full square with checkmark (white check on black)
 * - cancelled: Two diagonal lines (X)
 * - postponed: Right arrow
 */

import { useState } from 'react';
import { Check, X, ArrowRight, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import type { TaskStatus } from '@/types';
import { cn } from '@/lib/utils';

interface TaskStatusControlProps {
  status: TaskStatus;
  onChange: (status: TaskStatus) => void;
  disabled?: boolean;
}

// Status cycle for click interaction (excludes cancelled and postponed)
const STATUS_CYCLE: TaskStatus[] = ['todo', 'in_progress', 'completed'];

// All available statuses
const ALL_STATUSES: { value: TaskStatus; label: string; icon: React.ReactNode }[] = [
  { value: 'todo', label: 'To Do', icon: <StatusIconTodo /> },
  { value: 'in_progress', label: 'In Progress', icon: <StatusIconInProgress /> },
  { value: 'completed', label: 'Completed', icon: <StatusIconCompleted /> },
  { value: 'cancelled', label: 'Cancelled', icon: <StatusIconCancelled /> },
  { value: 'postponed', label: 'Postponed', icon: <StatusIconPostponed /> },
];

/**
 * Empty square icon for 'todo' status
 */
function StatusIconTodo() {
  return (
    <div className="w-5 h-5 border-2 border-foreground bg-background rounded-sm" />
  );
}

/**
 * Half-filled square for 'in_progress' status
 * Diagonal fill from top-left corner
 */
function StatusIconInProgress() {
  return (
    <div className="w-5 h-5 border-2 border-foreground rounded-sm relative overflow-hidden bg-background">
      <div 
        className="absolute inset-0 bg-foreground"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 0 100%)'
        }}
      />
    </div>
  );
}

/**
 * Full square with checkmark for 'completed' status
 */
function StatusIconCompleted() {
  return (
    <div className="w-5 h-5 bg-foreground rounded-sm flex items-center justify-center">
      <Check className="w-4 h-4 text-background" strokeWidth={3} />
    </div>
  );
}

/**
 * Two diagonal lines (X) for 'cancelled' status
 */
function StatusIconCancelled() {
  return (
    <div className="w-5 h-5 border-2 border-foreground bg-background rounded-sm flex items-center justify-center">
      <X className="w-3.5 h-3.5" strokeWidth={2.5} />
    </div>
  );
}

/**
 * Right arrow for 'postponed' status
 */
function StatusIconPostponed() {
  return (
    <div className="w-5 h-5 border-2 border-foreground bg-background rounded-sm flex items-center justify-center">
      <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
    </div>
  );
}

/**
 * Get icon component for a given status
 */
function getStatusIcon(status: TaskStatus): React.ReactNode {
  const statusConfig = ALL_STATUSES.find(s => s.value === status);
  return statusConfig?.icon || <StatusIconTodo />;
}

export function TaskStatusControl({ status, onChange, disabled = false }: TaskStatusControlProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  /**
   * Handle click on the status icon - cycles through todo -> in_progress -> completed
   */
  const handleIconClick = () => {
    if (disabled) return;

    const currentIndex = STATUS_CYCLE.indexOf(status);
    let nextIndex: number;

    if (currentIndex === -1) {
      // If current status is cancelled or postponed, start from todo
      nextIndex = 0;
    } else {
      // Cycle through the main statuses
      nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
    }

    onChange(STATUS_CYCLE[nextIndex]);
  };

  /**
   * Handle selection from the popover menu
   */
  const handleStatusSelect = (newStatus: TaskStatus) => {
    onChange(newStatus);
    setIsPopoverOpen(false);
  };

  return (
    <div className="flex items-center gap-0.5">
      {/* Status Icon - Click to cycle */}
      <button
        type="button"
        onClick={handleIconClick}
        disabled={disabled}
        className={cn(
          'flex items-center justify-center transition-opacity',
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-70 cursor-pointer'
        )}
        aria-label={`Current status: ${status}. Click to cycle status.`}
      >
        {getStatusIcon(status)}
      </button>

      {/* Chevron - Opens popover with all options */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'flex items-center justify-center transition-opacity',
              disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-70 cursor-pointer'
            )}
            aria-label="Open status menu"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1" align="start">
          <div className="space-y-0.5">
            {ALL_STATUSES.map(({ value, label, icon }) => (
              <Button
                key={value}
                variant={status === value ? 'secondary' : 'ghost'}
                size="sm"
                className="w-full justify-start gap-2 h-9"
                onClick={() => handleStatusSelect(value)}
              >
                {icon}
                <span className="text-sm">{label}</span>
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

