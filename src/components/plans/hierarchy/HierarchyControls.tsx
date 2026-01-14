import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { DashboardFilterState } from '@/types';

interface HierarchyControlsProps {
  filters: DashboardFilterState;
  onFilterChange: (filters: DashboardFilterState) => void;
}

export function HierarchyControls({ filters, onFilterChange }: HierarchyControlsProps) {
  const handleShowCompletedChange = (checked: boolean) => {
    onFilterChange({ ...filters, showCompleted: checked });
  };

  const handleShowAllWeeksChange = (checked: boolean) => {
    onFilterChange({ ...filters, showAllWeeks: checked });
  };

  return (
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
  );
}
