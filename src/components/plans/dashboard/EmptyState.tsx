import { Target, Plus, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { PlanStatus } from '@/types';
import { isPlanReadOnly, getDisabledTooltip } from '@/lib/utils';

interface EmptyStateProps {
  planId: string;
  planName: string;
  planStatus: PlanStatus;
  onNavigate?: (url: string) => void;
}

export function EmptyState({ planId, planName, planStatus, onNavigate }: EmptyStateProps) {
  const handleCreateGoal = () => {
    if (onNavigate) {
      onNavigate(`/plans/${planId}/goals`);
    }
  };

  const handleViewWizard = () => {
    if (onNavigate) {
      onNavigate('/plans/new');
    }
  };

  const isArchived = isPlanReadOnly(planStatus);
  const tooltipMessage = isArchived ? getDisabledTooltip(planStatus, 'general') : '';

  return (
    <Card className="border-dashed border-2 border-gray-300">
      <CardContent className="pt-6">
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Target className="w-12 h-12 text-gray-400" />
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome to {planName}!
          </h3>

          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Your 12-week planner is ready. Start by creating your first goal or milestone to begin your journey toward achieving your objectives.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button 
                    onClick={handleCreateGoal} 
                    disabled={isArchived}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Your First Goal
                  </Button>
                </span>
              </TooltipTrigger>
              {isArchived && (
                <TooltipContent>
                  <p>{tooltipMessage}</p>
                </TooltipContent>
              )}
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button 
                    variant="outline" 
                    onClick={handleViewWizard} 
                    disabled={isArchived}
                    className="flex items-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    View Planning Wizard
                  </Button>
                </span>
              </TooltipTrigger>
              {isArchived && (
                <TooltipContent>
                  <p>{tooltipMessage}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p className="mb-2">💡 <strong>Tips to get started:</strong></p>
            <ul className="text-left max-w-sm mx-auto space-y-1">
              <li>• Start with 1-3 main goals for your 12-week period</li>
              <li>• Break them down into milestones</li>
              <li>• Plan weekly activities to achieve your goals</li>
              <li>• Review your progress weekly</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}