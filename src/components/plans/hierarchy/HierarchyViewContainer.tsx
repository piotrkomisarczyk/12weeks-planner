import { useEffect, useState, useMemo } from 'react';
import { usePlanDashboard } from '../hooks/usePlanDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeekHeader } from '../shared/WeekHeader';
import { HierarchyControls } from './HierarchyControls';
import { HierarchyTree } from './HierarchyTree';
import { Legend } from './Legend';
import { buildHierarchyTree } from '@/lib/dashboard-utils';
import { calculateCurrentWeek } from '@/lib/utils';
import type { DashboardFilterState } from '@/types';

interface HierarchyViewContainerProps {
  planId: string;
  onNavigate?: (url: string) => void;
}


export function HierarchyViewContainer({ planId, onNavigate }: HierarchyViewContainerProps) {
  const { data, isLoading, error, fetchDashboard } = usePlanDashboard();
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [filters, setFilters] = useState<DashboardFilterState>({
    showCompleted: false, // Default: hide completed
    showAllWeeks: false,  // Default: show only current week
  });

  const handleNavigate = (url: string) => {
    if (onNavigate) {
      onNavigate(url);
    } else {
      window.location.href = url;
    }
  };

  const handleWeekNavigate = (weekNumber: number) => {
    setSelectedWeek(weekNumber);
  };

  const handleFilterChange = (newFilters: DashboardFilterState) => {
    setFilters(newFilters);
  };

  useEffect(() => {
    // Load dashboard data on mount - fetch once and calculate current week
    if (data?.plan && selectedWeek === null) {
      const calculatedCurrentWeek = calculateCurrentWeek(data.plan);
      setSelectedWeek(calculatedCurrentWeek);
    } else if (!data) {
      // Initial load - fetch all data once
      fetchDashboard(planId);
    }
  }, [planId, fetchDashboard, data, selectedWeek]);

  // Build hierarchy tree with memoization
  const displayWeek = selectedWeek || 1;
  const hierarchyTree = useMemo(() => {
    if (!data) return [];
    return buildHierarchyTree(data, filters, displayWeek);
  }, [data, filters, displayWeek]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-24 bg-muted rounded-lg mb-6"></div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <h3 className="text-lg font-semibold">Error loading hierarchy</h3>
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

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <WeekHeader
        weekNumber={displayWeek}
        startDate={new Date(data.plan.start_date)}
        planName={data.plan.name}
        onNavigate={handleWeekNavigate}
      />

      {/* Legend Card */}
      <Legend />

      {/* Hierarchy Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Plan Hierarchy</span>
            <HierarchyControls
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </CardTitle>
        </CardHeader>

        <CardContent>
          <HierarchyTree
            nodes={hierarchyTree}
            onNavigate={handleNavigate}
          />
        </CardContent>
      </Card>
    </div>
  );
}
