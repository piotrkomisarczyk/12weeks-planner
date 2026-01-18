import { HierarchyNode } from './HierarchyNode';
import type { HierarchyTreeNode } from '@/types';

interface HierarchyTreeProps {
  nodes: HierarchyTreeNode[];
  onNavigate?: (url: string) => void;
}

export function HierarchyTree({ nodes, onNavigate }: HierarchyTreeProps) {
  if (nodes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No plan items to display. Try adjusting the filters above.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <HierarchyNode
          key={node.id}
          node={node}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}
