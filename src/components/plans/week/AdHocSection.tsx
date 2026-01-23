/**
 * AdHocSection Component
 * 
 * Displays standalone tasks that are not associated with any weekly goal.
 */

import { useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { TaskItem } from './TaskItem';
import { InlineAddTask } from './InlineAddTask';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { TaskViewModel, SimpleMilestone, WeeklyGoalViewModel, SimpleGoal } from '@/types';

interface AdHocSectionProps {
  tasks: TaskViewModel[];
  availableWeeklyGoals: WeeklyGoalViewModel[];
  availableMilestones: SimpleMilestone[];
  availableLongTermGoals: SimpleGoal[];
  planId: string;
  weekNumber: number;
  onAddTask: (title: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<TaskViewModel>) => void;
  onDeleteTask: (taskId: string) => void;
  onAssignDay: (taskId: string, day: number | null) => void;
  onAssignToWeeklyGoal: (taskId: string, goalId: string) => void;
}

const MAX_AD_HOC_TASKS = 100;

export function AdHocSection({
  tasks,
  availableWeeklyGoals,
  availableMilestones,
  availableLongTermGoals,
  planId,
  weekNumber,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAssignDay,
  onAssignToWeeklyGoal,
}: AdHocSectionProps) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [expandedValue, setExpandedValue] = useState<string>('other-tasks');
  const isAtTaskLimit = tasks.length >= MAX_AD_HOC_TASKS;

  const handleAddTask = (title: string) => {
    onAddTask(title);
    setIsAddingTask(false);
  };

  return (
    <Accordion
      type="single"
      collapsible
      value={expandedValue}
      onValueChange={setExpandedValue}
      className="bg-card border rounded-lg"
    >
      <AccordionItem value="other-tasks" className="border-none">
        <div className="p-4">
          <div className="flex items-start gap-4">
            {/* Left: Section Title */}
            <div className="flex-1 min-w-0">
              <AccordionTrigger className="hover:no-underline p-0">
                <div className="text-left space-y-1 w-full">
                  <h3 className="font-semibold text-base">Other Tasks</h3>
                  {expandedValue !== 'other-tasks' && (
                    <p className="text-sm text-muted-foreground">
                      {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                    </p>
                  )}
                </div>
              </AccordionTrigger>
            </div>
          </div>

          {/* Task count when collapsed */}
          {expandedValue !== 'other-tasks' && tasks.length > 0 && (
            <div className="mt-2 text-sm text-muted-foreground">
              Standalone tasks not linked to weekly goals
            </div>
          )}

          {/* Expanded Content */}
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Standalone tasks not linked to weekly goals
              </p>

              {/* Task List */}
              <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      isAdHoc={true}
                      availableMilestones={availableMilestones}
                      availableLongTermGoals={availableLongTermGoals}
                      availableWeeklyGoals={availableWeeklyGoals}
                      planId={planId}
                      weekNumber={weekNumber}
                      onUpdate={onUpdateTask}
                      onDelete={onDeleteTask}
                      onAssignDay={onAssignDay}
                      onAssignToWeeklyGoal={onAssignToWeeklyGoal}
                    />
                  ))}

                  {/* Empty State */}
                  {tasks.length === 0 && !isAddingTask && (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      No ad-hoc tasks yet. Add your first task below.
                    </div>
                  )}

                  {/* Add Task */}
                  {isAddingTask ? (
                    <InlineAddTask
                      onAdd={handleAddTask}
                      onCancel={() => setIsAddingTask(false)}
                      placeholder="Enter task title..."
                    />
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddingTask(true)}
                      disabled={isAtTaskLimit}
                      className="w-full mt-2"
                      title={isAtTaskLimit ? `Maximum ${MAX_AD_HOC_TASKS} ad-hoc tasks reached` : undefined}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Task {isAtTaskLimit && `(${tasks.length}/${MAX_AD_HOC_TASKS})`}
                    </Button>
                  )}

                  {/* Task Limit Warning */}
                  {isAtTaskLimit && (
                    <p className="text-xs text-amber-600 mt-2">
                      Maximum ad-hoc task limit reached ({MAX_AD_HOC_TASKS} tasks)
                    </p>
                  )}
                </div>
              </SortableContext>
            </div>
          </AccordionContent>
        </div>
      </AccordionItem>
    </Accordion>
  );
}

