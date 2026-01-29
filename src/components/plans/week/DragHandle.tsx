/**
 * DragHandle Component
 *
 * Visual indicator and activator for drag-and-drop functionality.
 * Displays "=" icon that can be grabbed to drag the task.
 * Receives listeners and attributes from parent's useSortable hook.
 */

import { type DraggableAttributes, type DraggableSyntheticListeners } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface DragHandleProps {
  listeners?: DraggableSyntheticListeners;
  attributes?: DraggableAttributes;
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
  disabled?: boolean;
  isDragging?: boolean;
}

export function DragHandle({
  listeners,
  attributes,
  setActivatorNodeRef,
  disabled = false,
  isDragging = false,
}: DragHandleProps) {
  return (
    <button
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      type="button"
      disabled={disabled}
      className={cn(
        "flex items-center justify-center p-0.5 cursor-grab active:cursor-grabbing",
        "opacity-0 group-hover:opacity-100 transition-opacity",
        "hover:bg-accent rounded",
        disabled && "opacity-0 cursor-not-allowed",
        isDragging && "opacity-50"
      )}
      aria-label="Drag to reorder"
    >
      <GripVertical className="w-4 h-4 text-muted-foreground" />
    </button>
  );
}
