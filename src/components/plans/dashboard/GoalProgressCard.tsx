import { Target, TrendingUp, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { GoalDTO } from '@/types';

interface GoalProgressCardProps {
  goal: GoalDTO & {
    weekly_goals_count: number;
    tasks_count: number;
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  work: 'bg-blue-100 text-blue-800',
  finance: 'bg-green-100 text-green-800',
  hobby: 'bg-purple-100 text-purple-800',
  relationships: 'bg-pink-100 text-pink-800',
  health: 'bg-red-100 text-red-800',
  development: 'bg-orange-100 text-orange-800',
};

export function GoalProgressCard({ goal }: GoalProgressCardProps) {
  const isCompleted = goal.progress_percentage === 100;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-gray-500" />
            <CardTitle className="text-base font-medium truncate" title={goal.title}>
              {goal.title}
            </CardTitle>
          </div>
          {isCompleted && (
            <CheckCircle className="w-5 h-5 text-green-600" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge
            variant="secondary"
            className={goal.category ? CATEGORY_COLORS[goal.category] : 'bg-gray-100 text-gray-800'}
          >
            {goal.category || 'Uncategorized'}
          </Badge>
          <span className="text-sm text-gray-500">
            {goal.progress_percentage}% complete
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${goal.progress_percentage}%` }}
            />
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>{goal.weekly_goals_count} weekly goals</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              <span>{goal.tasks_count} tasks</span>
            </div>
          </div>

          {/* Description */}
          {goal.description && (
            <p className="text-sm text-gray-600 line-clamp-2" title={goal.description}>
              {goal.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}