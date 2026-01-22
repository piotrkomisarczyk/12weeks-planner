import { BookOpen, Target, Flag, Calendar, Square, CheckCircle, Circle, CircleSlash, CircleX, CircleArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { NodeType } from '@/types';

const NODE_TYPES: Record<NodeType, { icon: React.ComponentType<{ className?: string }>, label: string }> = {
  plan: { icon: BookOpen, label: 'Plan' },
  goal: { icon: Target, label: 'Goal' },
  milestone: { icon: Flag, label: 'Milestone' },
  weekly_goal: { icon: Calendar, label: 'Weekly Goal' },
  task: { icon: Square, label: 'Task' },
  ad_hoc_group: { icon: Target, label: 'Other Tasks' },
};

const STATUS_TYPES = [
  { key: 'todo', icon: Circle, label: 'To Do', color: 'text-muted-foreground' },
  { key: 'in_progress', icon: CircleSlash, label: 'In Progress', color: 'text-blue-500 dark:text-blue-400' },
  { key: 'completed', icon: CheckCircle, label: 'Completed', color: 'text-green-700 dark:text-green-600' },
  { key: 'cancelled', icon: CircleX, label: 'Cancelled', color: 'text-muted-foreground' },
  { key: 'postponed', icon: CircleArrowRight, label: 'Postponed', color: 'text-amber-500 dark:text-amber-400' },
];

export function Legend() {
  return (
    <Card>
      {/* <CardHeader>
        <CardTitle>Legend</CardTitle>
      </CardHeader> */}
      <CardContent className="space-y-4">
        {/* Node Types Row */}
        <div>
          
          <div className="flex flex-wrap gap-4">
            {Object.entries(NODE_TYPES).map(([type, { icon: Icon, label }]) => (
              <div key={type} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Types Row */}
        <div>
          <div className="flex flex-wrap gap-4">
            {STATUS_TYPES.map(({ key, icon: Icon, label, color }) => (
              <div key={key} className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className={`text-sm ${color}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}