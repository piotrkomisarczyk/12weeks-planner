/**
 * EmptyState Component
 * Displayed when there are no goals
 */

interface EmptyStateProps {
  onAddGoal: () => void;
  disabled?: boolean;
}

/**
 * Empty state for when no goals exist
 */
export function EmptyState({ onAddGoal, disabled = false }: EmptyStateProps) {
  return (
    <div className="border-2 border-dashed rounded-lg p-12 text-center">
      <div className="max-w-sm mx-auto space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
          <p className="text-sm text-muted-foreground">
            Get started by adding your first long-term goal for this 12-week plan.
          </p>
        </div>

        <button
          onClick={onAddGoal}
          disabled={disabled}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Add Your First Goal
        </button>
      </div>
    </div>
  );
}

