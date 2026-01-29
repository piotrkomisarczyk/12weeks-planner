/**
 * Weekly Review Container
 * Main container component managing state and business logic for weekly review functionality
 */

import type { WeeklyReviewViewModel, GoalReviewViewModel, PlanStatus } from "../../../types";
import { useWeeklyReview } from "./hooks/useWeeklyReview";
import ReviewHeader from "./ReviewHeader";
import GoalProgressList from "./GoalProgressList";
import ReflectionForm from "./ReflectionForm";
import ReviewCompletionStatus from "./ReviewCompletionStatus";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../ui/accordion";
import { isPlanReadOnly, isPlanReady } from "../../../lib/utils";

interface WeeklyReviewContainerProps {
  planId: string;
  weekNumber: number;
  initialReview: WeeklyReviewViewModel;
  initialGoals: GoalReviewViewModel[];
  planStatus: PlanStatus;
}

export default function WeeklyReviewContainer({
  planId,
  weekNumber,
  initialReview,
  initialGoals,
  planStatus,
}: WeeklyReviewContainerProps) {
  // Compute flags from plan status
  const isReadOnly = isPlanReadOnly(planStatus) || isPlanReady(planStatus);

  // Use custom hook for state management and business logic
  const { review, goals, error, updateReflection, updateGoalProgress, toggleMilestone, toggleCompletion } =
    useWeeklyReview({
      planId,
      weekNumber,
      initialReview,
      initialGoals,
    });

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <ReviewHeader planId={planId} weekNumber={weekNumber} />

      {/* Goal Progress Section */}
      <Accordion
        type="single"
        collapsible
        defaultValue="goal-progress"
        className="bg-card rounded-lg border border-border"
      >
        <AccordionItem value="goal-progress">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <h2 className="text-xl font-semibold">Update progress for your goals</h2>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <GoalProgressList
              goals={goals}
              onProgressUpdate={updateGoalProgress}
              onMilestoneToggle={toggleMilestone}
              planStatus={planStatus}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Reflection Form */}
      <Accordion
        type="single"
        collapsible
        defaultValue="weekly-reflection"
        className="bg-card rounded-lg border border-border"
      >
        <AccordionItem value="weekly-reflection">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <h2 className="text-xl font-semibold">Reflect on last week</h2>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <ReflectionForm
              values={review}
              onChange={updateReflection}
              isSaving={review.isSaving}
              planStatus={planStatus}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Completion Status */}
      <ReviewCompletionStatus
        isCompleted={review.is_completed}
        onToggleComplete={toggleCompletion}
        planStatus={planStatus}
      />

      {/* Error display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
          <p className="text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
