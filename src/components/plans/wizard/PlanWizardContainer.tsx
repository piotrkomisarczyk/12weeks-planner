import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { PlanWizardState, GoalFormData, CreatePlanCommand, CreateGoalCommand } from "@/types";
import { WizardStepper } from "./WizardStepper";
import { WizardControls } from "./WizardControls";
import { PlanDetailsForm } from "./steps/PlanDetailsForm";
import { PlanGoalsForm } from "./steps/PlanGoalsForm";

/**
 * Main wizard container component that orchestrates the plan creation process
 * Manages state, navigation between steps, and API integration
 */
export function PlanWizardContainer() {
  // Get next Monday as default start date
  const getNextMonday = (): Date => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday;
  };

  // Generate default plan name based on date
  const generateDefaultName = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `Planner_${year}-${month}-${day}`;
  };

  // Format date to YYYY-MM-DD using local timezone (not UTC)
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const nextMonday = getNextMonday();

  // Initialize wizard state
  const [wizardState, setWizardState] = useState<PlanWizardState>({
    step: 1,
    details: {
      name: generateDefaultName(nextMonday),
      startDate: nextMonday,
    },
    goals: [
      {
        id: crypto.randomUUID(),
        title: "",
        category: "development",
        description: "",
      },
    ],
    isSubmitting: false,
    errors: {},
  });

  // Validate step 1 (Plan Details)
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!wizardState.details.name || wizardState.details.name.trim().length === 0) {
      errors["details.name"] = "Plan name is required";
    } else if (wizardState.details.name.length > 255) {
      errors["details.name"] = "Plan name is too long (max 255 characters)";
    }

    if (!wizardState.details.startDate) {
      errors["details.startDate"] = "Start date is required";
    } else {
      const date = wizardState.details.startDate;
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 1) {
        errors["details.startDate"] = "Start date must be a Monday";
      }
    }

    setWizardState((prev) => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  };

  // Validate step 2 (Goals)
  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};

    if (wizardState.goals.length === 0) {
      errors["goals"] = "At least one goal is required";
    } else if (wizardState.goals.length > 6) {
      errors["goals"] = "Maximum 6 goals allowed";
    }

    wizardState.goals.forEach((goal, index) => {
      if (!goal.title || goal.title.trim().length === 0) {
        errors[`goals.${index}.title`] = "Goal title is required";
      }
    });

    setWizardState((prev) => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  };

  // Handle next button
  const handleNext = useCallback(() => {
    if (wizardState.step === 1) {
      if (validateStep1()) {
        setWizardState((prev) => ({ ...prev, step: 2, errors: {} }));
      }
    }
  }, [wizardState]);

  // Handle back button
  const handleBack = useCallback(() => {
    if (wizardState.step === 2) {
      setWizardState((prev) => ({ ...prev, step: 1, errors: {} }));
    }
  }, [wizardState.step]);

  // Handle plan details change
  const handleDetailsChange = useCallback((details: typeof wizardState.details) => {
    setWizardState((prev) => ({ ...prev, details }));
  }, []);

  // Handle goals change
  const handleGoalsChange = useCallback((goals: GoalFormData[]) => {
    setWizardState((prev) => ({ ...prev, goals }));
  }, []);

  // Submit the wizard (create plan + goals)
  const handleSubmit = async () => {
    if (!validateStep2()) {
      return;
    }

    setWizardState((prev) => ({ ...prev, isSubmitting: true, errors: {} }));

    try {
      // Step 1: Create the plan
      const planCommand: CreatePlanCommand = {
        name: wizardState.details.name,
        start_date: formatDateLocal(wizardState.details.startDate!),
      };

      const planResponse = await fetch("/api/v1/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planCommand),
      });

      if (!planResponse.ok) {
        const errorData = await planResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create plan");
      }

      const { data: createdPlan } = await planResponse.json();
      const planId = createdPlan.id;

      // Step 2: Create all goals
      try {
        const goalPromises = wizardState.goals.map((goal, index) => {
          const goalCommand: CreateGoalCommand = {
            plan_id: planId,
            title: goal.title,
            description: goal.description || "",
            category: goal.category,
            progress_percentage: 0,
            position: index + 1,
          };

          return fetch("/api/v1/goals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(goalCommand),
          });
        });

        const goalResponses = await Promise.all(goalPromises);

        // Check if all goals were created successfully
        const failedGoals = goalResponses.filter((res) => !res.ok);
        if (failedGoals.length > 0) {
          throw new Error("Failed to create some goals");
        }

        // Success! Show toast and redirect
        toast.success("Planner created successfully");
        window.location.href = "/plans";
      } catch {
        // Rollback: Delete the plan if goal creation failed

        await fetch(`/api/v1/plans/${planId}`, {
          method: "DELETE",
        }).catch(() => {});

        throw new Error("Error creating goals. The planner creation was rolled back.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create planner. Please try again.";
      toast.error(message);
      setWizardState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Planner</h1>
        <p className="text-muted-foreground mt-2">Set up your 12-week plan and define your long-term goals</p>
      </div>

      {/* Wizard Stepper */}
      <WizardStepper currentStep={wizardState.step} />

      {/* Step Forms */}
      <div className="mt-8">
        {wizardState.step === 1 && (
          <PlanDetailsForm data={wizardState.details} onChange={handleDetailsChange} errors={wizardState.errors} />
        )}

        {wizardState.step === 2 && (
          <PlanGoalsForm goals={wizardState.goals} onChange={handleGoalsChange} errors={wizardState.errors} />
        )}
      </div>

      {/* Navigation Controls */}
      <WizardControls
        currentStep={wizardState.step}
        isSubmitting={wizardState.isSubmitting}
        onBack={handleBack}
        onNext={handleNext}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
