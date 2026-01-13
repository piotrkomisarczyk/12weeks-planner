import { useState, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { HierarchyNode } from './HierarchyNode';
import { buildHierarchyTree } from '@/lib/dashboard-utils';
import type { PlanDashboardResponse, DashboardFilterState, HierarchyTreeNode } from '@/types';

interface HierarchySectionProps {
  data: PlanDashboardResponse;
  onNavigate?: (url: string) => void;
}

export function HierarchySection({ data, onNavigate }: HierarchySectionProps) {
  const [filters, setFilters] = useState<DashboardFilterState>({
    showCompleted: true,
    showAllWeeks: true,
  });

  const hierarchyTree = useMemo(() => {
    return buildHierarchyTree(data, filters);
  }, [data, filters]);

  const handleShowCompletedChange = (checked: boolean) => {
    setFilters(prev => ({ ...prev, showCompleted: checked }));
  };

  const handleShowAllWeeksChange = (checked: boolean) => {
    setFilters(prev => ({ ...prev, showAllWeeks: checked }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Plan Hierarchy</span>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-completed"
                checked={filters.showCompleted}
                onCheckedChange={handleShowCompletedChange}
              />
              <Label htmlFor="show-completed">Show completed</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-all-weeks"
                checked={filters.showAllWeeks}
                onCheckedChange={handleShowAllWeeksChange}
              />
              <Label htmlFor="show-all-weeks">Show all weeks</Label>
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-1">
          {hierarchyTree.length > 0 ? (
            hierarchyTree.map((node) => (
              <HierarchyNode
                key={node.id}
                node={node}
                onNavigate={onNavigate}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No plan items to display. Try adjusting the filters above.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}