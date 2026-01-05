/**
 * InlineAddTask Component
 * 
 * Simple inline input for quickly adding tasks to a weekly goal or ad-hoc section.
 */

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface InlineAddTaskProps {
  onAdd: (title: string) => void;
  onCancel: () => void;
  placeholder?: string;
}

export function InlineAddTask({
  onAdd,
  onCancel,
  placeholder = 'Enter task title...',
}: InlineAddTaskProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (value.trim()) {
      onAdd(value.trim());
      setValue('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-9"
      />
      
      <Button
        type="submit"
        size="sm"
        disabled={!value.trim()}
        className="shrink-0"
      >
        <Plus className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onCancel}
        className="shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </form>
  );
}

