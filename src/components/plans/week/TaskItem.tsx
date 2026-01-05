/**
 * TaskItem Component
 * 
 * Displays a single task with checkbox, title, priority badge, milestone info, and day assignment.
 * Supports inline editing and context menu for actions.
 */

import { useState, useRef, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import type { TaskViewModel, TaskPriority, TaskStatus, SimpleMilestone } from '@/types';
import { MoreVertical, Flag, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  task: TaskViewModel;
  isAdHoc?: boolean;
  availableMilestones: SimpleMilestone[];
  onUpdate: (id: string, updates: Partial<TaskViewModel>) => void;
  onDelete: (id: string) => void;
  onAssignDay: (id: string, day: number | null) => void;
  onLinkMilestone: (id: string, milestoneId: string | null) => void;
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  A: 'bg-red-500 hover:bg-red-600',
  B: 'bg-yellow-500 hover:bg-yellow-600',
  C: 'bg-blue-500 hover:bg-blue-600',
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function TaskItem({
  task,
  isAdHoc = false,
  availableMilestones,
  onUpdate,
  onDelete,
  onAssignDay,
  onLinkMilestone,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStatusChange = (checked: boolean) => {
    const newStatus: TaskStatus = checked ? 'completed' : 'todo';
    onUpdate(task.id, { status: newStatus });
  };

  const handleTitleClick = () => {
    if (task.status !== 'completed') {
      setIsEditing(true);
    }
  };

  const handleTitleSave = () => {
    if (editValue.trim() && editValue !== task.title) {
      onUpdate(task.id, { title: editValue.trim() });
    } else {
      setEditValue(task.title);
    }
    setIsEditing(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditValue(task.title);
      setIsEditing(false);
    }
  };

  const handlePriorityChange = (priority: TaskPriority) => {
    onUpdate(task.id, { priority });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
  };

  const getMilestoneTitle = (milestoneId: string | null) => {
    if (!milestoneId) return null;
    return availableMilestones.find(m => m.id === milestoneId)?.title;
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-md border bg-card p-2 hover:bg-accent/50 transition-colors',
        task.status === 'completed' && 'opacity-60',
        task.isSaving && 'opacity-50 pointer-events-none'
      )}
    >
      {/* Checkbox */}
      <Checkbox
        checked={task.status === 'completed'}
        onCheckedChange={handleStatusChange}
        disabled={task.isSaving}
        aria-label={`Mark task ${task.title} as ${task.status === 'completed' ? 'incomplete' : 'complete'}`}
      />

      {/* Title */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            className="h-7 text-sm"
            disabled={task.isSaving}
          />
        ) : (
          <button
            onClick={handleTitleClick}
            className={cn(
              'text-left text-sm w-full truncate hover:text-primary transition-colors',
              task.status === 'completed' && 'line-through'
            )}
            disabled={task.status === 'completed'}
          >
            {task.title}
          </button>
        )}
      </div>

      {/* Priority Badge */}
      <Badge
        className={cn('text-xs font-semibold text-white cursor-pointer', PRIORITY_COLORS[task.priority as TaskPriority])}
        onClick={() => {
          const priorities: TaskPriority[] = ['A', 'B', 'C'];
          const currentIndex = priorities.indexOf(task.priority as TaskPriority);
          const nextPriority = priorities[(currentIndex + 1) % priorities.length] as TaskPriority;
          handlePriorityChange(nextPriority);
        }}
      >
        {task.priority}
      </Badge>

      {/* Milestone Indicator */}
      {task.milestone_id && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Flag className="h-3 w-3" />
          <span className="truncate max-w-[100px]" title={getMilestoneTitle(task.milestone_id) || undefined}>
            {getMilestoneTitle(task.milestone_id)}
          </span>
        </div>
      )}

      {/* Day Indicator */}
      {task.due_day && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{DAY_NAMES[task.due_day - 1]}</span>
        </div>
      )}

      {/* Context Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded transition-opacity"
            aria-label="Task options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Assign to Day */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Calendar className="mr-2 h-4 w-4" />
              Assign to Day
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {DAY_NAMES.map((day, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={() => onAssignDay(task.id, index + 1)}
                >
                  {day}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAssignDay(task.id, null)}>
                Clear Day
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Link to Milestone */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Flag className="mr-2 h-4 w-4" />
              Link Milestone
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto">
              {availableMilestones.length === 0 ? (
                <DropdownMenuItem disabled>No milestones available</DropdownMenuItem>
              ) : (
                <>
                  {availableMilestones.map((milestone) => (
                    <DropdownMenuItem
                      key={milestone.id}
                      onClick={() => onLinkMilestone(task.id, milestone.id)}
                    >
                      <span className="truncate">{milestone.title}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onLinkMilestone(task.id, null)}>
                    Clear Milestone
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Priority */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Priority</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handlePriorityChange('A')}>
                <Badge className={cn('mr-2', PRIORITY_COLORS.A)}>A</Badge>
                High Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePriorityChange('B')}>
                <Badge className={cn('mr-2', PRIORITY_COLORS.B)}>B</Badge>
                Medium Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePriorityChange('C')}>
                <Badge className={cn('mr-2', PRIORITY_COLORS.C)}>C</Badge>
                Low Priority
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {/* Delete */}
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            Delete Task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

