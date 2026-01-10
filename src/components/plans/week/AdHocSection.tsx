/**
 * AdHocSection Component
 * 
 * Displays standalone tasks that are not associated with any weekly goal.
 */

import { useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskItem } from './TaskItem';
import { InlineAddTask } from './InlineAddTask';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import type { TaskViewModel, SimpleMilestone, WeeklyGoalViewModel, SimpleGoal } from '@/types';

interface AdHocSectionProps {
  tasks: TaskViewModel[];
  availableWeeklyGoals: WeeklyGoalViewModel[];
  availableMilestones: SimpleMilestone[];
  availableLongTermGoals: SimpleGoal[];
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
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAssignDay,
  onAssignToWeeklyGoal,
}: AdHocSectionProps) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const isAtTaskLimit = tasks.length >= MAX_AD_HOC_TASKS;

  const handleAddTask = (title: string) => {
    onAddTask(title);
    setIsAddingTask(false);
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Other Tasks</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Standalone tasks not linked to weekly goals
          </p>
        </div>
      </CardHeader>

      <CardContent>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {/* Task List */}
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isAdHoc={true}
                availableMilestones={availableMilestones}
                availableLongTermGoals={availableLongTermGoals}
                availableWeeklyGoals={availableWeeklyGoals}
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
      </CardContent>
    </Card>
  );
}

