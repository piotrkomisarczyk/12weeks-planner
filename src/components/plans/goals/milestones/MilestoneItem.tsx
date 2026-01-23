/**
 * MilestoneItem Component
 * Individual milestone row with checkbox and delete action
 */

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, CalendarIcon, Edit3, RotateCcw } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn, normalizeDateToMidnight } from '@/lib/utils';
import { DragHandle } from '../../week/DragHandle';
import type { MilestoneDTO } from '@/types';

interface MilestoneItemProps {
  milestone: MilestoneDTO;
  onToggle: (id: string, isCompleted: boolean) => Promise<void>;
  onUpdate: (id: string, data: { title?: string; due_date?: string | null }) => Promise<void>;
  onDelete: (id: string) => void;
  planStartDate: string;
  planEndDate: string;
  disabled?: boolean;
  isDeleting?: boolean;
  dragDisabled?: boolean;
}

/**
 * Single milestone row
 * Shows checkbox, title, due date, edit and delete buttons
 */
export function MilestoneItem({
  milestone,
  onToggle,
  onUpdate,
  onDelete,
  planStartDate,
  planEndDate,
  disabled = false,
  isDeleting = false,
  dragDisabled = false
}: MilestoneItemProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editTitle, setEditTitle] = useState(milestone.title);
  const [editDueDate, setEditDueDate] = useState<Date | undefined>(
    milestone.due_date ? new Date(milestone.due_date) : undefined
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [editError, setEditError] = useState<string>('');
  const milestoneRef = useRef<HTMLDivElement>(null);

  // Sortable hook for drag and drop
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: milestone.id, disabled: dragDisabled || disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Handle click outside to exit edit mode
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditing && milestoneRef.current && !milestoneRef.current.contains(event.target as Node)) {
        handleCancelEdit();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing]);

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

  const handleEdit = () => {
    if (isToggling || isDeleting || isUpdating) return;
    setIsEditing(true);
    setEditTitle(milestone.title);
    setEditDueDate(milestone.due_date ? new Date(milestone.due_date) : undefined);
    setEditError('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle(milestone.title);
    setEditDueDate(milestone.due_date ? new Date(milestone.due_date) : undefined);
    setEditError('');
  };

  const handleUpdate = async () => {
    if (isUpdating) return;

    setEditError('');

    // Validation
    if (!editTitle.trim()) {
      setEditError('Title is required');
      return;
    }

    // Date validation
    if (editDueDate) {
      const minDate = new Date(planStartDate);
      const maxDate = new Date(planEndDate);
      if (editDueDate < minDate || editDueDate > maxDate) {
        setEditError('Date must be within plan duration');
        return;
      }
    }

    setIsUpdating(true);

    try {
      await onUpdate(milestone.id, {
        title: editTitle.trim(),
        due_date: editDueDate ? format(editDueDate, 'yyyy-MM-dd') : null,
      });
      setIsEditing(false);
      setEditError('');
    } catch (error) {
      console.error('Failed to update milestone:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update milestone';
      setEditError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    if (isToggling || isDeleting || isUpdating) return;

    // onDelete now shows a confirmation dialog (synchronous operation)
    // The actual deletion state will be managed by the parent component
    onDelete(milestone.id);
  };

  const isDisabled = disabled || isToggling || isDeleting || isUpdating;

  const minDate = new Date(planStartDate);
  const maxDate = new Date(planEndDate);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        milestoneRef.current = node;
      }}
      style={style}
      className={cn(
        'flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors group',
        milestone.is_completed && 'opacity-60',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-primary'
      )}
    >
      {/* Drag Handle */}
      <DragHandle
        listeners={listeners}
        attributes={attributes}
        setActivatorNodeRef={setActivatorNodeRef}
        disabled={isDisabled}
        isDragging={isDragging}
      />

      {/* Checkbox */}
      <Checkbox
        checked={milestone.is_completed}
        onCheckedChange={handleToggle}
        disabled={isDisabled}
        aria-label={`Mark "${milestone.title}" as ${milestone.is_completed ? 'incomplete' : 'complete'}`}
      />

      {/* Edit Mode */}
      {isEditing ? (
        <>
          {/* Title Input */}
          <div className="flex-1 min-w-0">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              disabled={isDisabled}
              className="h-8 text-sm"
              placeholder="Milestone title..."
              maxLength={255}
            />
          </div>

          {/* Date Picker */}
          <Popover open={showCalendar} onOpenChange={setShowCalendar}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isDisabled}
                className={cn(
                  'h-8 w-[120px] justify-start text-left font-normal text-xs',
                  !editDueDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-1 size-3" />
                {editDueDate ? format(editDueDate, 'MMM dd, yyyy') : 'Due date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={editDueDate}
                onSelect={(date) => {
                  setEditDueDate(date);
                  setShowCalendar(false);
                }}
                disabled={(date) => {
                  const normalizedDate = normalizeDateToMidnight(date);
                  return normalizedDate < minDate || normalizedDate > maxDate;
                }}
                weekStartsOn={1}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Confirm Button */}
          <Button
            size="icon"
            onClick={handleUpdate}
            disabled={isDisabled || !editTitle.trim()}
            className="size-8 shrink-0"
            aria-label="Update milestone"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </>
      ) : (
        <>
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

          {/* Action Buttons */}
          <div className="flex gap-1 shrink-0">
            {/* Edit Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              disabled={isDisabled}
              className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`Edit milestone "${milestone.title}"`}
            >
              <Edit3 className="size-3.5" />
            </Button>

            {/* Delete Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={isDisabled}
              className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`Delete milestone "${milestone.title}"`}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </>
      )}

      {/* Error Message */}
      {editError && (
        <p className="text-xs text-destructive mt-1 col-span-full">{editError}</p>
      )}
    </div>
  );
}

