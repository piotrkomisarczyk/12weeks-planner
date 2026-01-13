import { Calendar, Target, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeekHeader } from '../week/WeekHeader';
import type { PlanDTO, DashboardMetrics } from '@/types';

interface DashboardHeaderProps {
  plan: PlanDTO;
  metrics: DashboardMetrics;
  currentWeek: number;
  onWeekNavigate: (weekNumber: number) => void;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function DashboardHeader({ plan, metrics, currentWeek, onWeekNavigate }: DashboardHeaderProps) {
  const endDate = new Date(plan.start_date);
  endDate.setDate(endDate.getDate() + (12 * 7) - 1); // 12 weeks after start (12 weeks total - 1 day = 83 days)

  const progressPercentage = metrics.total_goals > 0
    ? Math.round((metrics.completed_goals / metrics.total_goals) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <WeekHeader
        weekNumber={currentWeek}
        startDate={new Date(plan.start_date)}
        planName={plan.name}
        onNavigate={onWeekNavigate}
      />

      <Card>
      <CardHeader>
        {<CardTitle className="text-2xl font-bold text-gray-900">
          {plan.name}
        </CardTitle> }
        {/* <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(plan.start_date)} - {formatDate(endDate.toISOString().split('T')[0])}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Week {currentWeek} of 12</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            <span>{progressPercentage}% Complete</span>
          </div>
        </div> */}
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{metrics.total_goals}</div>
            <div className="text-sm text-blue-700">Total Goals</div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{metrics.completed_goals}</div>
            <div className="text-sm text-green-700">Completed Goals</div>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{metrics.total_tasks}</div>
            <div className="text-sm text-purple-700">Total Tasks</div>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{metrics.completed_tasks}</div>
            <div className="text-sm text-orange-700">Completed Tasks</div>
          </div>
        </div>

        {/* Progress bar for overall completion */}
        {/* <div className="mt-6">
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
        </div> */}
      </CardContent>
    </Card>
    </div>
  );
}