import { Button } from '@/components/ui/button';
import { Calendar, Target, Clock, ClipboardList, ListTree } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GOAL_CATEGORIES, GOAL_CATEGORY_COLORS } from '@/types';
import type { PlanDTO, DashboardMetrics, GoalDTO, GoalCategory } from '@/types';

interface DashboardOverviewCardProps {
  plan: PlanDTO;
  metrics: DashboardMetrics;
  goals: GoalDTO[];
  currentWeek: number;
  currentDay: number;
  onNavigate?: (url: string) => void;
}

const quickActions = [
  {
    id: 'goals',
    label: 'Goals View',
    description: 'Manage your long-term goals',
    icon: Target,
    url: 'goals',
    color: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:hover:bg-purple-950/60 dark:text-purple-200 dark:border-purple-900/60',
  },
  {
    id: 'hierarchy-tree',
    label: 'Hierarchy Tree',
    description: 'See tasks hierarchy',
    icon: ListTree,
    url: 'hierarchy',
    color: 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:hover:bg-teal-950/60 dark:text-teal-200 dark:border-teal-900/60',
  },
  {
    id: 'current-week',
    label: 'Current Week',
    description: 'Plan this week\'s activities',
    icon: Calendar,
    url: 'week',
    color: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:hover:bg-green-950/60 dark:text-green-200 dark:border-green-900/60',
  },
  {
    id: 'today',
    label: 'Today',
    description: 'View today\'s tasks',
    icon: Clock,
    url: 'day',
    color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 dark:text-blue-200 dark:border-blue-900/60',
  },
  {
    id: 'summary',
    label: 'Review',
    description: 'View review for this week',
    icon: ClipboardList,
    url: 'summary',
    color: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:hover:bg-orange-950/60 dark:text-orange-200 dark:border-orange-900/60',
  },
];

export function DashboardOverviewCard({
  plan,
  metrics,
  goals,
  currentWeek,
  currentDay,
  onNavigate
}: DashboardOverviewCardProps) {
  const handleActionClick = (url: string) => {
    if (onNavigate) {
      onNavigate(url);
    }
  };

  const progressPercentage = metrics.total_goals > 0
    ? Math.round((metrics.completed_goals / metrics.total_goals) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground">
          Dashboard
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Actions */}
        <div className="grid lg:grid-cols-5 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            let url: string;

            switch (action.url) {
              case 'week':
                url = `/plans/${plan.id}/week/${currentWeek}`;
                break;
              case 'day':
                url = `/plans/${plan.id}/week/${currentWeek}/day/${currentDay}`;
                break;
              case 'hierarchy':
                url = `/plans/${plan.id}/hierarchy`;
                break;
              case 'goals':
                url = `/plans/${plan.id}/goals`;
                break;
              case 'summary':
                url = `/plans/${plan.id}/review/1`;
                break;
              default:
                url = `/plans/${plan.id}`;
            }

            return (
              <Button
                key={action.id}
                variant="outline"
                className={`h-auto p-4 flex flex-row items-center gap-2 ${action.color} border-2 transition-all duration-200 hover:scale-105`}
                onClick={() => handleActionClick(url)}
              >
                <Icon /> <span className="font-medium flex text-sm">{action.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Goals and Task Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Total Goals */}
          <div className="text-center p-4 bg-violet-50 rounded-lg dark:bg-violet-950/40">
            <div className="text-2xl font-bold text-violet-600 dark:text-violet-200">{metrics.total_goals}</div>
            <div className="text-sm text-violet-700 dark:text-violet-300">Total Goals</div>
          </div>

          {/* Total Tasks */}
          <div className="text-center p-4 bg-teal-50 rounded-lg dark:bg-teal-950/40">
            <div className="text-2xl font-bold text-teal-600 dark:text-teal-200">{metrics.total_tasks}</div>
            <div className="text-sm text-teal-600 dark:text-teal-200">Total Tasks</div>
          </div>

          {/* Completed Tasks */}
          <div className="text-center p-4 bg-green-50 rounded-lg dark:bg-green-950/40">
            <div className="text-2xl font-bold text-green-600 dark:text-green-200">{metrics.completed_tasks}</div>
            <div className="text-sm text-green-700 dark:text-green-300">Completed Tasks</div>
          </div>

          {/* Task Progress */}
          <div className="text-center p-4 bg-blue-50 rounded-lg dark:bg-blue-950/40">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-200">
              {metrics.total_tasks === 0
                ? '0.0%'
                : `${((metrics.completed_tasks * 100) / metrics.total_tasks).toFixed(1)} %`}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-200">Task Progress</div>
          </div>

          {/* Completed Goals */}
          <div className="text-center p-4 bg-orange-50 rounded-lg dark:bg-orange-950/40">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-200">{metrics.completed_goals}</div>
            <div className="text-sm text-orange-700 dark:text-orange-300">Completed Goals</div>
          </div>
        </div>

        {/* Goals Overview */}
        {goals.length > 0 && (
          <div className="space-y-4">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {goals.slice(0, 6).map((goal) => {
                const categoryKey = goal.category as GoalCategory | null;
                const categoryLabel = categoryKey
                  ? GOAL_CATEGORIES.find((category) => category.value === categoryKey)?.label ?? categoryKey
                  : null;

                return (
                <div key={goal.id} className="bg-card p-4 rounded-lg border border-border hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground truncate min-w-0" title={goal.title}>
                      {goal.title}
                    </h4>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {categoryKey && categoryLabel && (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 ${GOAL_CATEGORY_COLORS[categoryKey]}`}
                        >
                          {categoryLabel}
                        </span>
                      )}
                      <span className="text-sm text-muted-foreground">{goal.progress_percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mb-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${goal.progress_percentage}%` }}
                    />
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Goals Completion Progress */}
        <div>
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Overall Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}