import { useEffect, useState } from 'react';
import { usePlanDashboard } from '../hooks/usePlanDashboard';
import { DashboardHeader } from './DashboardHeader';
import { QuickActionsPanel } from './QuickActionsPanel';
import { HierarchySection } from './HierarchySection';
import { EmptyState } from './EmptyState';
import type { DashboardOptions } from '@/types';

interface DashboardContainerProps {
  planId: string;
  onNavigate?: (url: string) => void;
}

function calculateCurrentWeek(plan: any): number {
  const startDate = new Date(plan.start_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  let currentWeek = Math.floor(diffDays / 7) + 1;

  // Clamp to valid range
  if (currentWeek < 1) currentWeek = 1;
  if (currentWeek > 12) currentWeek = 12;

  return currentWeek;
}

function calculateCurrentDay(): number {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Convert to 1-7 format where Monday = 1
  return dayOfWeek === 0 ? 7 : dayOfWeek;
}

export function DashboardContainer({ planId, onNavigate }: DashboardContainerProps) {
  const { data, isLoading, error, fetchDashboard } = usePlanDashboard();
  const [currentWeek, setCurrentWeek] = useState<number | null>(null);

  const handleNavigate = (url: string) => {
    if (onNavigate) {
      onNavigate(url);
    } else {
      window.location.href = url;
    }
  };

  const handleWeekNavigate = (weekNumber: number) => {
    setCurrentWeek(weekNumber);
    fetchDashboard(planId, {
      weekView: 'all',
      statusView: 'all',
      weekNumber
    });
  };

  useEffect(() => {
    // Load dashboard data on mount - calculate current week and show current week initially
    if (data?.plan && currentWeek === null) {
      const calculatedCurrentWeek = calculateCurrentWeek(data.plan);
      setCurrentWeek(calculatedCurrentWeek);
      fetchDashboard(planId, {
        weekView: 'all',
        statusView: 'all',
        weekNumber: calculatedCurrentWeek
      });
    } else if (currentWeek === null) {
      // Initial load - fetch with all weeks to get plan data, then we'll switch to current week
      fetchDashboard(planId, { weekView: 'all', statusView: 'all' });
    }
  }, [planId, fetchDashboard, data?.plan, currentWeek]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-24 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <h3 className="text-lg font-semibold">Error loading dashboard</h3>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={() => {
            const weekNum = currentWeek || (data?.plan ? calculateCurrentWeek(data.plan) : 1);
            fetchDashboard(planId, { weekView: 'all', statusView: 'all', weekNumber: weekNum });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Check if dashboard is empty
  const isEmpty = data.goals.length === 0 && data.tasks.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardHeader
        plan={data.plan}
        metrics={data.metrics}
        currentWeek={currentWeek || calculateCurrentWeek(data.plan)}
        onWeekNavigate={handleWeekNavigate}
      />

    {/* Quick Actions */}
    <QuickActionsPanel planId={planId} currentWeek={currentWeek || calculateCurrentWeek(data.plan)} currentDay={calculateCurrentDay()} onNavigate={handleNavigate} />
      
      {/* Main Content */}
      {isEmpty ? (
        <EmptyState planName={data.plan.name} onNavigate={handleNavigate} />
      ) : (
        <div className="space-y-6">
          {/* Goals Overview */}
          {data.goals.length > 0 && (
            <div>
              {/* <h2 className="text-xl font-semibold mb-4 text-gray-900">Goals Overview</h2> */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.goals.slice(0, 6).map((goal) => (
                  <div key={goal.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 truncate" title={goal.title}>
                        {goal.title}
                      </h3>
                      <span className="text-sm text-gray-500">{goal.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${goal.progress_percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      {(goal as any).weekly_goals_count || 0} weekly goals • {(goal as any).tasks_count || 0} tasks
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hierarchy Tree */}
          <HierarchySection data={data} onNavigate={handleNavigate} />
        </div>
      )}
    </div>
  );
}