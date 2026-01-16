import { useEffect, useState } from 'react';
import { usePlanDashboard } from '../hooks/usePlanDashboard';
import { DashboardOverviewCard } from './DashboardOverviewCard';
import { EmptyState } from './EmptyState';

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

  const handleNavigate = (url: string) => {
    if (onNavigate) {
      onNavigate(url);
    } else {
      window.location.href = url;
    }
  };

  useEffect(() => {
    // Load dashboard data on mount
    if (!data) {
      fetchDashboard(planId);
    }
  }, [planId, fetchDashboard, data]);

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
          onClick={() => fetchDashboard(planId)}
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
  
  // Calculate current week for display
  const displayWeek = calculateCurrentWeek(data.plan);

  return (
    <div className="space-y-6">

      {/* Dashboard Overview Card */}
      <DashboardOverviewCard
        plan={data.plan}
        metrics={data.metrics}
        goals={data.goals}
        currentWeek={displayWeek}
        currentDay={calculateCurrentDay()}
        onNavigate={handleNavigate}
      />

      {/* Main Content */}
      {isEmpty && (
        <EmptyState planId={planId} planName={data.plan.name} onNavigate={handleNavigate} />
      )}
    </div>
  );
}