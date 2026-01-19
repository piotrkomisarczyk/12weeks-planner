import { MoreVertical, Play, Archive, Trash2, Edit } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { PlanViewModel } from '@/lib/plan-utils';
import { formatDate } from '@/lib/plan-utils';
import { cn } from '@/lib/utils';

export interface PlanActions {
  onActivate: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

interface PlanCardProps {
  plan: PlanViewModel;
  actions: PlanActions;
}

export function PlanCard({ plan, actions }: PlanCardProps) {
  const showActivateButton = plan.status !== 'active' && plan.status !== 'completed';
  const showArchiveButton = plan.status !== 'archived';

  // Truncate plan name to 64 characters with ellipsis if longer
  const truncatedName = plan.name.length > 64 ? `${plan.name.slice(0, 64)}...` : plan.name;

  // Determine card styling based on status
  const cardVariant = {
    active: 'border-primary bg-primary/5',
    ready: '',
    archived: 'bg-muted/50 opacity-75',
    completed: 'bg-muted/30',
  }[plan.status];

  // Determine badge styling based on status
  const badgeVariant = {
    active: 'default' as const,
    ready: 'secondary' as const,
    archived: 'outline' as const,
    completed: 'secondary' as const,
  }[plan.status];

  const handleCardClick = () => {
    // Navigate to plan dashboard
    window.location.href = `/plans/${plan.id}`;
  };

  const handleActionClick = (
    e: React.MouseEvent,
    action: () => void
  ) => {
    e.stopPropagation(); // Prevent card click navigation
    action();
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        cardVariant
      )}
      onClick={handleCardClick}
      role="article"
      aria-label={`Plan: ${plan.name}`}
    >
      <CardHeader>
        <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle className="text-lg cursor-default truncate">{truncatedName}</CardTitle>
                </TooltipTrigger>
                {plan.name.length > 64 && (
                  <TooltipContent>
                    <p>{plan.name}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
            <CardDescription>
              {formatDate(plan.start_date)} - {formatDate(plan.endDate)}
            </CardDescription>
            <Badge variant={badgeVariant}>{plan.displayStatus}</Badge>
          </div>

          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Plan actions menu"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {showActivateButton && (
                  <>
                    <DropdownMenuItem
                      onClick={(e) =>
                        handleActionClick(e, () => actions.onActivate(plan.id))
                      }
                    >
                      <Play className="size-4" />
                      Activate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/plans/${plan.id}/edit`;
                  }}
                >
                  <Edit className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {showArchiveButton && (
                  <DropdownMenuItem
                    onClick={(e) =>
                      handleActionClick(e, () => actions.onArchive(plan.id))
                    }
                  >
                    <Archive className="size-4" />
                    Archive
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(e) =>
                    handleActionClick(e, () => actions.onDelete(plan.id))
                  }
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        </div>
      </CardHeader>
      {plan.status === 'active' || plan.status === 'completed' && (
      <CardContent>
        <div className="space-y-2 text-sm">
          {plan.currentWeek !== null && (
            <div className="text-muted-foreground">
              Week {plan.currentWeek} of 12
            </div>
          )}
          {plan.isOverdue  && (
            <div className="text-destructive font-medium">Overdue</div>
          )}
          {plan.status === 'completed' && (
            <div className="text-muted-foreground">Completed</div>
          )}

          </div>
        </CardContent>
      )}
    </Card>
  );
}

