import { Button } from '@/components/ui/button';
import { Calendar, Target, Clock, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuickActionsPanelProps {
  planId: string;
  currentWeek: number;
  currentDay: number;
  onNavigate?: (url: string) => void;
}

const actions = [
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
    id: 'goals',
    label: 'Goals View',
    description: 'Manage your long-term goals',
    icon: Target,
    url: 'goals',
    color: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200',
  },
  {
    id: 'summary',
    label: 'Summary',
    description: 'View progress summary',
    icon: BarChart3,
    url: 'summary',
    color: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200',
  },
];

export function QuickActionsPanel({ planId, currentWeek, currentDay, onNavigate }: QuickActionsPanelProps) {
  const handleActionClick = (url: string) => {
    if (onNavigate) {
      onNavigate(url);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold text-gray-900">
            Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* <h3 className="text-lg font-semibold mb-4 text-gray-900">Quick Actions</h3> */}
        <div className="grid  lg:grid-cols-4 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            let url: string;

            switch (action.url) {
              case 'week':
                url = `/plans/${planId}/week/${currentWeek}`;
                break;
              case 'day':
                // Simplified - in real app calculate current day
                url = `/plans/${planId}/week/${currentWeek}/day/${currentDay}`;
                break;
              case 'goals':
                url = `/plans/${planId}/goals`;
                break;
              case 'summary':
                url = `/plans/${planId}/review/1`;
                break;
              default:
                url = `/plans/${planId}`;
            }

            return (
              <Button
                key={action.id}
                variant="outline"
                className={`h-auto p-4 flex flex-row items-center gap-2 ${action.color} border-2 transition-all duration-200 hover:scale-105`}
                onClick={() => handleActionClick(url)}
              >
                <Icon /> <span className="font-medium flex text-sm">  {action.label} </span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}