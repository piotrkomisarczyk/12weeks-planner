import { Button } from '@/components/ui/button';
import { Calendar, Target, Clock, ClipboardList, ListTree } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PlanDTO, DashboardMetrics, GoalDTO } from '@/types';

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
    id: 'today',
    label: 'Today',
    description: 'View today\'s tasks',
    icon: Clock,
    url: 'day',
    color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    id: 'current-week',
    label: 'Current Week',
    description: 'Plan this week\'s activities',
    icon: Calendar,
    url: 'week',
    color: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200',
  },
  {
    id: 'hierarchy-tree',
    label: 'Hierarchy Tree',
    description: 'See tasks hierarchy',
    icon: ListTree,
    url: 'hierarchy',
    color: 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200',
  },
  {
    id: 'goals',
    label: 'Goals View',
    description: 'Manage your long-term goals',
    icon: Target,
    url: 'goals',
    color: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200',
  },
  {
    id: 'summary',
    label: 'Review',
    description: 'View review for this week',
    icon: ClipboardList,
    url: 'summary',
    color: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200',
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
        <CardTitle className="text-2xl font-bold text-gray-900">
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
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{metrics.total_tasks}</div>
            <div className="text-sm text-blue-700">Total Tasks</div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{metrics.completed_tasks}</div>
            <div className="text-sm text-green-700">Completed Tasks</div>
          </div>

          <div className="text-center p-4 bg-teal-50 rounded-lg">
            <div className="text-2xl font-bold text-teal-600">
              {metrics.total_tasks === 0
                ? '0.0%'
                : `${((metrics.completed_tasks * 100) / metrics.total_tasks).toFixed(1)} %`}
            </div>
            <div className="text-sm text-teal-700">Task Progress</div>
          </div>

          <div className="text-center p-4 bg-violet-50 rounded-lg">
            <div className="text-2xl font-bold text-violet-600">{metrics.total_goals}</div>
            <div className="text-sm text-violet-700">Total Goals</div>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{metrics.completed_goals}</div>
            <div className="text-sm text-orange-700">Completed Goals</div>
          </div>
        </div>

        {/* Goals Overview */}
        {goals.length > 0 && (
          <div className="space-y-4">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.slice(0, 6).map((goal) => (
                <div key={goal.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 truncate" title={goal.title}>
                      {goal.title}
                    </h4>
                    <span className="text-sm text-gray-500">{goal.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${goal.progress_percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goals Completion Progress */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Overall Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}