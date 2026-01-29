import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WizardStepper } from "../wizard/WizardStepper";
import { PlanDetailsStep } from "./PlanDetailsStep";
import { GoalsStep } from "./GoalsStep";
import { useEditPlan } from "./hooks/useEditPlan";

interface EditPlanViewProps {
  planId: string;
}

/**
 * Main container component for Edit Plan View
 * Manages wizard state and orchestrates the editing flow
 */
export function EditPlanView({ planId }: EditPlanViewProps) {
  const {
    step,
    plan,
    goals,
    isLoading,
    isSaving,
    error,
    formErrors,
    fetchData,
    updatePlanDetails,
    addGoal,
    updateGoal,
    deleteGoal,
    prevStep,
    finish,
    setFormErrors,
    clearFormErrors,
  } = useEditPlan(planId);

  const [planName, setPlanName] = useState("");

  // Update local plan name when plan data loads
  useEffect(() => {
    if (plan?.name) {
      setPlanName(plan.name);
    }
  }, [plan?.name]);

  const handlePlanNameChange = (name: string) => {
    setPlanName(name);
    clearFormErrors();
  };

  const handleNextFromDetails = async () => {
    // Validate plan name
    const errors: Record<string, string> = {};
    if (!planName.trim()) {
      errors.name = "Plan name is required";
    } else if (planName.length > 255) {
      errors.name = "Plan name must be less than 255 characters";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Save plan name and proceed
    try {
      await updatePlanDetails(planName.trim());
    } catch {
      // Error is handled in the hook
    }
  };

  const handleFinish = () => {
    // Validate minimum goals requirement
    if (goals.length === 0) {
      setFormErrors({ goals: "At least one goal is required" });
      return;
    }

    finish();
  };

  const handleRetry = () => {
    fetchData();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading plan data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !plan) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No plan found
  if (!plan) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Alert variant="destructive">
          <AlertDescription>
            Plan not found. It may have been deleted or you may not have permission to access it.
          </AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
          <Button onClick={() => (window.location.href = "/plans")}>Back to Plans</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (window.location.href = "/plans")}
            aria-label="Back to plans"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Plan</h1>
            <p className="text-muted-foreground">Update your plan details and manage your goals</p>
          </div>
        </div>

        {/* Wizard Stepper */}
        <WizardStepper currentStep={step} />
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {step === 1 && (
          <PlanDetailsStep
            name={planName}
            startDate={plan.start_date}
            onNameChange={handlePlanNameChange}
            errors={formErrors}
          />
        )}

        {step === 2 && (
          <GoalsStep goals={goals} onAddGoal={addGoal} onUpdateGoal={updateGoal} onDeleteGoal={deleteGoal} />
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between border-t pt-6">
        <div>
          {step > 1 && (
            <Button type="button" variant="outline" onClick={prevStep} disabled={isSaving}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
          )}
        </div>

        <div className="flex gap-3">
          {step === 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => (window.location.href = "/plans")}
              disabled={isSaving}
            >
              Cancel
            </Button>
          )}

          {step === 1 && (
            <Button type="button" onClick={handleNextFromDetails} disabled={isSaving}>
              {isSaving ? "Saving..." : "Next"}
            </Button>
          )}

          {step === 2 && (
            <Button type="button" onClick={handleFinish} disabled={isSaving || goals.length === 0}>
              {isSaving ? "Saving..." : "Finish"}
            </Button>
          )}
        </div>
      </div>

      {/* General error display */}
      {error && (
        <div className="mt-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
