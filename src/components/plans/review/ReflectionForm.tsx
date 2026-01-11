/**
 * Reflection Form Component
 * Form with three text areas for weekly reflection questions
 */

import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import type { WeeklyReviewViewModel } from '../../../types';

interface ReflectionFormProps {
  values: WeeklyReviewViewModel;
  onChange: (
    field: keyof Pick<WeeklyReviewViewModel, 'what_worked' | 'what_did_not_work' | 'what_to_improve'>,
    value: string
  ) => void;
  isSaving: boolean;
}

const reflectionFields = [
  {
    key: 'what_worked' as const,
    label: 'What worked well this week?',
    placeholder: 'Describe what went well and what you achieved...'
  },
  {
    key: 'what_did_not_work' as const,
    label: 'What didn\'t work or could be improved?',
    placeholder: 'Identify challenges, obstacles, or areas for improvement...'
  },
  {
    key: 'what_to_improve' as const,
    label: 'What will you focus on improving next week?',
    placeholder: 'List specific actions or changes you plan to make...'
  }
];

export default function ReflectionForm({ values, onChange, isSaving }: ReflectionFormProps) {
  const handleChange = (
    field: keyof Pick<WeeklyReviewViewModel, 'what_worked' | 'what_did_not_work' | 'what_to_improve'>,
    value: string
  ) => {
    onChange(field, value);
  };

  return (
    <div className="space-y-6">
      {reflectionFields.map((field) => (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={field.key} className="text-base font-medium">
            {field.label}
          </Label>
          <Textarea
            id={field.key}
            value={values[field.key] || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="min-h-24 resize-none"
            disabled={isSaving}
          />
        </div>
      ))}

      {/* Save status indicator */}
      <div className="flex justify-end text-sm text-gray-500">
        {isSaving ? (
          <span className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
            Saving...
          </span>
        ) : values.lastSavedAt ? (
          <span>
            Last saved: {values.lastSavedAt.toLocaleTimeString()}
          </span>
        ) : (
          <span>Unsaved changes</span>
        )}
      </div>
    </div>
  );
}