/**
 * DailyTaskSlot Component
 * 
 * Represents a single priority-based slot in the day view.
 * Displays tasks, handles drag-and-drop reordering within the slot,
 * and provides inline task addition with limit enforcement.
 */

import { useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InlineAddTask } from '../week/InlineAddTask';
import { TaskCard } from './TaskCard';
import type {
  DaySlot,
  DayTaskViewModel,
  TaskStatus,
  TaskPriority,
  SimpleGoal,
  SimpleMilestone,
  PlanStatus,
} from '@/types';

interface DailyTaskSlotProps {
  slot: DaySlot;
  title: string;
  limit: number;
  tasks: DayTaskViewModel[];
  availableLongTermGoals: SimpleGoal[];
  availableMilestones: SimpleMilestone[];
  availableWeeklyGoals: Array<{
    id: string;
    title: string;
    long_term_goal_id: string | null;
    milestone_id: string | null;
  }>;
  weekNumber: number;
  dayNumber: number;
  planStatus: PlanStatus;
  isReadOnly: boolean;
  onAddTask: (title: string) => void;
  onUpdateTask: (id: string, updates: Partial<DayTaskViewModel>) => void;
  onDeleteTask: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onPriorityChange: (id: string, priority: TaskPriority) => void;
  onAssignDay: (id: string, day: number | null) => void;
  onCopyTask: (id: string, targetWeek?: number, targetDay?: number) => void;
  onMoveTask: (id: string, targetWeek?: number, targetDay?: number) => void;
  onLinkGoalMilestone: (taskId: string, goalId: string | null, milestoneId: string | null) => void;
  onAssignToWeeklyGoal: (taskId: string, weeklyGoalId: string) => void;
  onUnassignFromWeeklyGoal: (taskId: string) => void;
}

const SLOT_COLORS: Record<DaySlot, { bg: string; border: string; headerBg: string }> = {
  most_important: {
    bg: 'bg-card',
    border: 'border-red-200 dark:border-red-900/40',
    headerBg: 'bg-red-100 dark:bg-red-950/50',
  },
  secondary: {
    bg: 'bg-card',
    border: 'border-yellow-200 dark:border-yellow-900/60',
    headerBg: 'bg-yellow-100 dark:bg-yellow-950/50',
  },
  additional: {
    bg: 'bg-card',
    border: 'border-blue-200 dark:border-blue-900/60',
    headerBg: 'bg-blue-100 dark:bg-blue-950/50',
  },
};

export function DailyTaskSlot({
  slot,
  title,
  limit,
  tasks,
  availableLongTermGoals,
  availableMilestones,
  availableWeeklyGoals,
  weekNumber,
  dayNumber,
  planStatus,
  isReadOnly,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onStatusChange,
  onPriorityChange,
  onAssignDay,
  onCopyTask,
  onMoveTask,
  onLinkGoalMilestone,
  onAssignToWeeklyGoal,
  onUnassignFromWeeklyGoal,
}: DailyTaskSlotProps) {
  const [isAdding, setIsAdding] = useState(false);
  
  const isFull = tasks.length >= limit;
  const colors = SLOT_COLORS[slot];

  const handleAdd = (title: string) => {
    onAddTask(title);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
  };

  return (
    <div
      className={cn(
        'rounded-lg border-2 overflow-hidden',
        colors.border,
        colors.bg
      )}
    >
      <Accordion type="single" collapsible defaultValue="open">
        <AccordionItem value="open" className="border-0">
          {/* Header - Now as AccordionTrigger */}
          <AccordionTrigger
            className={cn(
              'px-4 py-3 hover:no-underline',
              colors.headerBg,
              '[&[data-state=open]]:border-b',
              colors.border
            )}
          >
            <div className="flex items-center justify-between w-full pr-2">
              <h3 className="font-semibold text-sm uppercase tracking-wide">
                {title}
              </h3>
              <span
                className={cn(
                  'text-xs font-medium px-2 py-1 rounded-full',
                  isFull
                    ? 'bg-red-700 text-white dark:bg-red-900/80'
                    : 'bg-card/80 text-muted-foreground dark:bg-card/80'
                )}
              >
                {tasks.length} / {limit}
              </span>
            </div>
          </AccordionTrigger>

          {/* Collapsible Content */}
          <AccordionContent className="pb-0">
            {/* Tasks List */}
            <div className="p-4 space-y-2">
              <SortableContext
                items={tasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    variant="day"
                    availableLongTermGoals={availableLongTermGoals}
                    availableMilestones={availableMilestones}
                    availableWeeklyGoals={availableWeeklyGoals}
                    weekNumber={weekNumber}
                    dayNumber={dayNumber}
                    planStatus={planStatus}
                    isReadOnly={isReadOnly}
                    onUpdate={onUpdateTask}
                    onDelete={onDeleteTask}
                    onStatusChange={onStatusChange}
                    onPriorityChange={onPriorityChange}
                    onAssignDay={onAssignDay}
                    onCopy={onCopyTask}
                    onMove={onMoveTask}
                    onLinkGoalMilestone={onLinkGoalMilestone}
                    onAssignToWeeklyGoal={onAssignToWeeklyGoal}
                    onUnassignFromWeeklyGoal={onUnassignFromWeeklyGoal}
                  />
                ))}
              </SortableContext>

              {/* Inline Add Task */}
              {isAdding && (
                <div className="mt-2">
                  <InlineAddTask
                    onAdd={handleAdd}
                    onCancel={handleCancel}
                    placeholder="Enter task title..."
                  />
                </div>
              )}
            </div>

            {/* Add Button */}
            <div className="px-4 pb-4">
              {!isAdding && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdding(true)}
                  disabled={isFull || isReadOnly}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isFull ? `Slot Full (max ${limit})` : 'Add Task'}
                </Button>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

