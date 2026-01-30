/**
 * GoalForm Component
 * Editable form for goal properties with auto-save
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GOAL_CATEGORIES, GOAL_CATEGORY_COLORS } from "@/types";
import type { GoalCategory } from "@/types";
import type { SaveStatus } from "@/types";

interface GoalFormProps {
  title: string;
  category: GoalCategory | null;
  description: string | null;
  onUpdate: (data: { title?: string; category?: GoalCategory | null; description?: string | null }) => Promise<void>;
  disabled?: boolean;
}

/**
 * Auto-saving form for goal editing
 * - Debounces text inputs (500ms)
 * - Immediate save for select inputs
 * - Shows save status indicator
 */
export function GoalForm({ title, category, description, onUpdate, disabled = false }: GoalFormProps) {
  const [localTitle, setLocalTitle] = useState(title);
  const [localDescription, setLocalDescription] = useState(description || "");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // Separate refs for title and description debounce timers
  const titleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const descriptionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveStatusTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with external changes
  useEffect(() => {
    setLocalTitle(title);
    setLocalDescription(description || "");
  }, [title, description]);

  // Cleanup timers on unmount
  useEffect(() => {
    const titleTimer = titleTimerRef.current;
    const descriptionTimer = descriptionTimerRef.current;
    const saveStatusTimer = saveStatusTimerRef.current;

    return () => {
      if (titleTimer) clearTimeout(titleTimer);
      if (descriptionTimer) clearTimeout(descriptionTimer);
      if (saveStatusTimer) clearTimeout(saveStatusTimer);
    };
  }, []);

  // Debounced save function
  const debouncedSave = useCallback(
    async (field: "title" | "description", value: string, timerRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
      // Clear existing timer for this field
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Clear save status timer if exists
      if (saveStatusTimerRef.current) {
        clearTimeout(saveStatusTimerRef.current);
      }

      setSaveStatus("saving");

      // Set new timer (500ms debounce)
      timerRef.current = setTimeout(async () => {
        try {
          await onUpdate({ [field]: value || null });
          setSaveStatus("saved");

          // Auto-hide "saved" message after 2 seconds
          saveStatusTimerRef.current = setTimeout(() => {
            setSaveStatus("idle");
          }, 2000);
        } catch {
          setSaveStatus("error");

          // Auto-hide error message after 3 seconds
          saveStatusTimerRef.current = setTimeout(() => {
            setSaveStatus("idle");
          }, 3000);
        }
      }, 500);
    },
    [onUpdate]
  );

  // Handle title change
  const handleTitleChange = (value: string) => {
    setLocalTitle(value);
    debouncedSave("title", value, titleTimerRef);
  };

  // Handle description change
  const handleDescriptionChange = (value: string) => {
    setLocalDescription(value);
    debouncedSave("description", value, descriptionTimerRef);
  };

  // Handle category change (immediate save)
  const handleCategoryChange = async (value: string) => {
    setSaveStatus("saving");
    try {
      await onUpdate({ category: value as GoalCategory });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  return (
    <div className="space-y-4 p-1">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="goal-title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="goal-title"
          value={localTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g., Launch new product"
          maxLength={255}
          disabled={disabled}
          aria-label="Goal title"
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="goal-category">Category</Label>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button id="goal-category" variant="outline" className="w-full justify-between" disabled={disabled}>
              {category ? (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 ${GOAL_CATEGORY_COLORS[category]}`}>
                  {GOAL_CATEGORIES.find((cat) => cat.value === category)?.label}
                </span>
              ) : (
                <span className="text-muted-foreground">Select category</span>
              )}
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
            <DropdownMenuRadioGroup value={category || undefined} onValueChange={handleCategoryChange}>
              {GOAL_CATEGORIES.map((cat) => (
                <DropdownMenuRadioItem key={cat.value} value={cat.value}>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 ${GOAL_CATEGORY_COLORS[cat.value]}`}
                  >
                    {cat.label}
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="goal-description">
          Why is it important? / How will you measure your success?{" "}
          <span className="text-muted-foreground text-xs">(Optional)</span>
        </Label>
        <Textarea
          id="goal-description"
          value={localDescription}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="Why is this goal important to you?"
          rows={3}
          disabled={disabled}
          aria-label="Goal description"
        />
      </div>

      {/* Save Status Indicator */}
      <div className="flex items-center gap-2 text-xs">
        {saveStatus === "saving" && <span className="text-muted-foreground">Saving...</span>}
        {saveStatus === "saved" && <span className="text-green-600 dark:text-green-400">✓ Saved</span>}
        {saveStatus === "error" && <span className="text-destructive">Failed to save</span>}
      </div>
    </div>
  );
}
