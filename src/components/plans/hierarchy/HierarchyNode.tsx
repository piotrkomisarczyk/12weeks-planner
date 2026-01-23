import { useState } from 'react';
import { CircleX, BookOpen, ChevronRight, ChevronDown, Target, Flag, Calendar, CheckCircle, Circle, CircleSlash, CircleArrowRight, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HierarchyTreeNode, NodeType } from '@/types';

interface HierarchyNodeProps {
  node: HierarchyTreeNode;
  onNavigate?: (url: string) => void;
}

const ICONS: Record<NodeType, React.ComponentType<{ className?: string }>> = {
  plan: BookOpen,
  goal: Target,
  milestone: Flag,
  weekly_goal: Calendar,
  task: Square,
  ad_hoc_group: Target,
};

const STATUS_COLORS = {
  todo: 'text-muted-foreground',
  in_progress: 'text-blue-600 dark:text-blue-400 font-medium',
  completed: 'text-green-700 dark:text-green-600 font-medium',
  cancelled: 'text-muted-foreground line-through',
  postponed: 'text-amber-600 dark:text-amber-400 font-medium',
};

export function HierarchyNode({ node, onNavigate }: HierarchyNodeProps) {
  const [isExpanded, setIsExpanded] = useState(node.indent < 2); // Default expanded for first 2 levels

  const Icon = ICONS[node.type];
  const hasChildren = node.children.length > 0;
  
  // Use inline style for indentation to support dynamic values
  // Each level gets 1.5rem (24px) of indentation
  const indentationStyle = { paddingLeft: `${node.indent * 1.5}rem` };

  const getStatusIcon = () => {
    if (node.isCompleted) {
      return <CheckCircle className="text-green-700 dark:text-green-600" />;
    }
    if (node.status === 'in_progress') {
      return <CircleSlash className="text-blue-500 dark:text-blue-400" />;
    }
    if (node.status === 'cancelled') {
      return <CircleX className="text-muted-foreground" />;
    }
    if (node.status === 'postponed') {
      return <CircleArrowRight className="text-amber-500 dark:text-amber-400" />;
    }
    return <Circle className="text-muted-foreground" />;
  };

  const getStatusTextColor = () => {
    if (node.status && STATUS_COLORS[node.status as keyof typeof STATUS_COLORS]) {
      return STATUS_COLORS[node.status as keyof typeof STATUS_COLORS];
    }
    return 'text-foreground';
  };

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    } else if (onNavigate) {
      onNavigate(node.metadata.linkUrl);
    }
  };

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNavigate) {
      onNavigate(node.metadata.linkUrl);
    }
  };

  return (
    <div>
      <div
        className="flex items-center py-2 px-2 hover:bg-muted/50 cursor-pointer rounded-md transition-colors"
        style={indentationStyle}
        onClick={handleClick}
      >
        {/* Expand/Collapse Chevron */}
        <div className="w-4 h-4 mr-2 flex items-center justify-center">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )
          ) : null}
        </div>

        {/* Type Icon */}
        <div className="w-4 h-4 mr-2 flex items-center justify-center">
          <Icon className="text-muted-foreground" />
        </div>

        {/* Status Icon */}
        <div className="w-4 h-4 mr-2 flex items-center justify-center">
          {getStatusIcon()}
        </div>

        {/* Title */}
        <div
          className={cn(
            'flex-1 text-sm font-medium truncate',
            getStatusTextColor(),
            !hasChildren && 'cursor-pointer hover:underline'
          )}
          onClick={handleTitleClick}
          title={node.title}
        >
          {node.title}
        </div>

        {/* Progress for goals */}
        {node.progress !== undefined && (
          <div className="ml-2 text-xs text-muted-foreground">
            {node.progress}%
          </div>
        )}

        {/* Priority for tasks */}
        {node.metadata.priority && (
          <div className="ml-2 text-xs px-1 py-0.5 bg-muted rounded text-muted-foreground">
            {node.metadata.priority}
          </div>
        )}

        {/* Day name for tasks */}
        {node.type === 'task' && node.metadata.date && (
          <div className="ml-2 text-xs text-muted-foreground">
            {node.metadata.date}
          </div>
        )}

        {/* Week number */}
        {node.weekNumber && (
          <div className="ml-2 text-xs text-muted-foreground">
            Week {node.weekNumber}
          </div>
        )}


      </div>

      {/* Children */}
      {hasChildren && (
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          {node.children.map((child) => (
            <HierarchyNode
              key={child.id}
              node={child}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
