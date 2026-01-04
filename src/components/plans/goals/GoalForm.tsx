/**
 * GoalForm Component
 * Editable form for goal properties with auto-save
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { GoalCategory } from '@/types';
import type { SaveStatus } from './types';

interface GoalFormProps {
  title: string;
  category: GoalCategory | null;
  description: string | null;
  onUpdate: (data: { title?: string; category?: GoalCategory | null; description?: string | null }) => Promise<void>;
  disabled?: boolean;
}

const GOAL_CATEGORIES: { value: GoalCategory; label: string }[] = [
  { value: 'work', label: 'Work' },
  { value: 'finance', label: 'Finance' },
  { value: 'hobby', label: 'Hobby' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'health', label: 'Health' },
  { value: 'development', label: 'Growth' },
];

/**
 * Auto-saving form for goal editing
 * - Debounces text inputs (500ms)
 * - Immediate save for select inputs
 * - Shows save status indicator
 */
export function GoalForm({ title, category, description, onUpdate, disabled = false }: GoalFormProps) {
  const [localTitle, setLocalTitle] = useState(title);
  const [localDescription, setLocalDescription] = useState(description || '');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  
  // Separate refs for title and description debounce timers
  const titleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const descriptionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveStatusTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with external changes
  useEffect(() => {
    setLocalTitle(title);
    setLocalDescription(description || '');
  }, [title, description]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
      if (descriptionTimerRef.current) clearTimeout(descriptionTimerRef.current);
      if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    };
  }, []);

  // Debounced save function
  const debouncedSave = useCallback(
    async (field: 'title' | 'description', value: string, timerRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
      // Clear existing timer for this field
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Clear save status timer if exists
      if (saveStatusTimerRef.current) {
        clearTimeout(saveStatusTimerRef.current);
      }

      setSaveStatus('saving');

      // Set new timer (500ms debounce)
      timerRef.current = setTimeout(async () => {
        try {
          await onUpdate({ [field]: value || null });
          setSaveStatus('saved');
          
          // Auto-hide "saved" message after 2 seconds
          saveStatusTimerRef.current = setTimeout(() => {
            setSaveStatus('idle');
          }, 2000);
        } catch (error) {
          console.error('Failed to save:', error);
          setSaveStatus('error');
          
          // Auto-hide error message after 3 seconds
          saveStatusTimerRef.current = setTimeout(() => {
            setSaveStatus('idle');
          }, 3000);
        }
      }, 500);
    },
    [onUpdate]
  );

  // Handle title change
  const handleTitleChange = (value: string) => {
    setLocalTitle(value);
    debouncedSave('title', value, titleTimerRef);
  };

  // Handle description change
  const handleDescriptionChange = (value: string) => {
    setLocalDescription(value);
    debouncedSave('description', value, descriptionTimerRef);
  };

  // Handle category change (immediate save)
  const handleCategoryChange = async (value: string) => {
    setSaveStatus('saving');
    try {
      await onUpdate({ category: value as GoalCategory });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save category:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
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
        <Select
          value={category || undefined}
          onValueChange={handleCategoryChange}
          disabled={disabled}
        >
          <SelectTrigger id="goal-category" className="w-full">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {GOAL_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="goal-description">
          Description <span className="text-muted-foreground text-xs">(Optional)</span>
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
        {saveStatus === 'saving' && (
          <span className="text-muted-foreground">Saving...</span>
        )}
        {saveStatus === 'saved' && (
          <span className="text-green-600 dark:text-green-400">✓ Saved</span>
        )}
        {saveStatus === 'error' && (
          <span className="text-destructive">Failed to save</span>
        )}
      </div>
    </div>
  );
}

