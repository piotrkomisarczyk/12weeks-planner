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
import type { TaskViewModel, SimpleMilestone } from '@/types';

interface AdHocSectionProps {
  tasks: TaskViewModel[];
  availableMilestones: SimpleMilestone[];
  onAddTask: (title: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<TaskViewModel>) => void;
  onDeleteTask: (taskId: string) => void;
  onAssignDay: (taskId: string, day: number | null) => void;
  onLinkMilestone: (taskId: string, milestoneId: string | null) => void;
}

const MAX_AD_HOC_TASKS = 10;

export function AdHocSection({
  tasks,
  availableMilestones,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAssignDay,
  onLinkMilestone,
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Ad-hoc Tasks</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Standalone tasks not linked to weekly goals
            </p>
          </div>
          {!isAddingTask && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingTask(true)}
              disabled={isAtTaskLimit}
              title={isAtTaskLimit ? `Maximum ${MAX_AD_HOC_TASKS} ad-hoc tasks reached` : undefined}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Task {isAtTaskLimit && `(${tasks.length}/${MAX_AD_HOC_TASKS})`}
            </Button>
          )}
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
                onUpdate={onUpdateTask}
                onDelete={onDeleteTask}
                onAssignDay={onAssignDay}
                onLinkMilestone={onLinkMilestone}
              />
            ))}

            {/* Empty State */}
            {tasks.length === 0 && !isAddingTask && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No ad-hoc tasks yet. Add tasks that don't belong to a specific goal.
              </div>
            )}

            {/* Add Task Input */}
            {isAddingTask && (
              <InlineAddTask
                onAdd={handleAddTask}
                onCancel={() => setIsAddingTask(false)}
                placeholder="Enter task title..."
              />
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

