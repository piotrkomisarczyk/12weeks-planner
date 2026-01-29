import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import type { WeeklyReviewViewModel, GoalReviewViewModel, WeeklyReviewDTO } from "../../../../types";

interface UseWeeklyReviewState {
  review: WeeklyReviewViewModel;
  goals: GoalReviewViewModel[];
  error: string | null;
}

interface UseWeeklyReviewReturn extends UseWeeklyReviewState {
  updateReflection: (
    field: keyof Pick<WeeklyReviewViewModel, "what_worked" | "what_did_not_work" | "what_to_improve">,
    value: string
  ) => void;
  updateGoalProgress: (goalId: string, progress: number) => void;
  toggleMilestone: (milestoneId: string, isCompleted: boolean) => void;
  toggleCompletion: () => Promise<void>;
}

interface UseWeeklyReviewProps {
  planId: string;
  weekNumber: number;
  initialReview: WeeklyReviewViewModel;
  initialGoals: GoalReviewViewModel[];
}

const DEBOUNCE_DELAY = 1000; // 1 second for auto-save

export function useWeeklyReview({
  planId,
  weekNumber,
  initialReview,
  initialGoals,
}: UseWeeklyReviewProps): UseWeeklyReviewReturn {
  const [state, setState] = useState<UseWeeklyReviewState>({
    review: initialReview,
    goals: initialGoals,
    error: null,
  });

  // Debounce timer refs for each reflection field
  const whatWorkedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const whatDidNotWorkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const whatToImproveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (whatWorkedTimerRef.current) clearTimeout(whatWorkedTimerRef.current);
      if (whatDidNotWorkTimerRef.current) clearTimeout(whatDidNotWorkTimerRef.current);
      if (whatToImproveTimerRef.current) clearTimeout(whatToImproveTimerRef.current);
    };
  }, []);

  /**
   * Updates reflection text fields with debounced auto-save
   */
  const updateReflection = useCallback(
    (
      field: keyof Pick<WeeklyReviewViewModel, "what_worked" | "what_did_not_work" | "what_to_improve">,
      value: string
    ) => {
      // Capture current review ID before async operation
      const currentReviewId = state.review.id;

      // Immediate UI update (without setting isSaving yet)
      setState((prev) => ({
        ...prev,
        review: {
          ...prev.review,
          [field]: value,
        },
        error: null,
      }));

      // Get the appropriate timer ref for this field
      const getTimerRef = () => {
        switch (field) {
          case "what_worked":
            return whatWorkedTimerRef;
          case "what_did_not_work":
            return whatDidNotWorkTimerRef;
          case "what_to_improve":
            return whatToImproveTimerRef;
        }
      };

      const timerRef = getTimerRef();

      // Clear existing timer for this field
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Set new debounce timer
      timerRef.current = setTimeout(async () => {
        // Now set isSaving to true when actually starting the request
        setState((prev) => ({
          ...prev,
          review: {
            ...prev.review,
            isSaving: true,
          },
        }));

        try {
          let response: Response;

          if (currentReviewId) {
            // Update existing review
            response = await fetch(`/api/v1/weekly-reviews/${currentReviewId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ [field]: value }),
            });
          } else {
            // Create new review (lazy creation)
            response = await fetch("/api/v1/weekly-reviews", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                plan_id: planId,
                week_number: weekNumber,
                [field]: value,
              }),
            });
          }

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to save changes");
          }

          const result: { data: WeeklyReviewDTO } = await response.json();

          // Update state with saved data
          setState((prev) => ({
            ...prev,
            review: {
              ...result.data,
              isSaving: false,
              lastSavedAt: new Date(),
            },
          }));
        } catch {
          setState((prev) => ({
            ...prev,
            review: { ...prev.review, isSaving: false },
            error: "Failed to save changes",
          }));
          toast.error("Failed to save changes. Please try again.");
        }
      }, DEBOUNCE_DELAY);
    },
    [state.review.id, planId, weekNumber]
  );

  /**
   * Updates goal progress with optimistic updates
   */
  const updateGoalProgress = useCallback(
    async (goalId: string, newProgress: number) => {
      // Find goal and store original progress for rollback
      const goalIndex = state.goals.findIndex((g) => g.id === goalId);
      if (goalIndex === -1) return;

      const originalProgress = state.goals[goalIndex].progress_percentage;

      // Optimistic update
      setState((prev) => ({
        ...prev,
        goals: prev.goals.map((g) =>
          g.id === goalId ? { ...g, progress_percentage: newProgress, isUpdating: true } : g
        ),
        error: null,
      }));

      try {
        const response = await fetch(`/api/v1/goals/${goalId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ progress_percentage: newProgress }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update goal progress");
        }

        // Update with server response
        setState((prev) => ({
          ...prev,
          goals: prev.goals.map((g) => (g.id === goalId ? { ...g, isUpdating: false } : g)),
        }));
      } catch {
        // Rollback optimistic update
        setState((prev) => ({
          ...prev,
          goals: prev.goals.map((g) =>
            g.id === goalId ? { ...g, progress_percentage: originalProgress, isUpdating: false } : g
          ),
          error: "Failed to update goal progress",
        }));

        toast.error("Failed to update goal progress. Changes have been reverted.");
      }
    },
    [state.goals]
  );

  /**
   * Toggles milestone completion status
   */
  const toggleMilestone = useCallback(
    async (milestoneId: string, isCompleted: boolean) => {
      // Find milestone and store original state for rollback
      let originalCompleted: boolean | null = null;
      let goalIndex = -1;
      let milestoneIndex = -1;

      // Find the milestone in the goals state
      for (let g = 0; g < state.goals.length; g++) {
        const goal = state.goals[g];
        if (goal.milestones) {
          const mIndex = goal.milestones.findIndex((m) => m.id === milestoneId);
          if (mIndex !== -1) {
            originalCompleted = goal.milestones[mIndex].is_completed;
            goalIndex = g;
            milestoneIndex = mIndex;
            break;
          }
        }
      }

      if (goalIndex === -1 || milestoneIndex === -1) return;

      // Optimistic update
      setState((prev) => ({
        ...prev,
        goals: prev.goals.map((goal, gIndex) =>
          gIndex === goalIndex && goal.milestones
            ? {
                ...goal,
                milestones: goal.milestones.map((milestone, mIndex) =>
                  mIndex === milestoneIndex ? { ...milestone, is_completed: isCompleted } : milestone
                ),
              }
            : goal
        ),
        error: null,
      }));

      try {
        const response = await fetch(`/api/v1/milestones/${milestoneId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_completed: isCompleted }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update milestone");
        }
      } catch {
        // Rollback optimistic update
        setState((prev) => ({
          ...prev,
          goals: prev.goals.map((goal, gIndex) =>
            gIndex === goalIndex && goal.milestones
              ? {
                  ...goal,
                  milestones: goal.milestones.map((milestone, mIndex) =>
                    mIndex === milestoneIndex ? { ...milestone, is_completed: originalCompleted ?? false } : milestone
                  ),
                }
              : goal
          ),
          error: "Failed to update milestone",
        }));

        toast.error("Failed to update milestone. Changes have been reverted.");
      }
    },
    [state.goals]
  );

  /**
   * Toggles review completion status
   */
  const toggleCompletion = useCallback(async () => {
    if (!state.review.id) {
      toast.error("Please add some content before marking as complete");
      return;
    }

    try {
      const response = await fetch(`/api/v1/weekly-reviews/${state.review.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update completion status");
      }

      const result = await response.json();

      setState((prev) => ({
        ...prev,
        review: {
          ...prev.review,
          is_completed: !prev.review.is_completed,
        },
        error: null,
      }));

      toast.success(result.message || "Review completion status updated");
    } catch {
      setState((prev) => ({
        ...prev,
        error: "Failed to update completion status",
      }));
      toast.error("Failed to update completion status. Please try again.");
    }
  }, [state.review.id]);

  return {
    ...state,
    updateReflection,
    updateGoalProgress,
    toggleMilestone,
    toggleCompletion,
  };
}
