import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WizardControlsProps {
  currentStep: 1 | 2;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

/**
 * Navigation controls for wizard (Back, Next, Create buttons)
 */
export function WizardControls({ currentStep, isSubmitting, onBack, onNext, onSubmit }: WizardControlsProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === 2;

  return (
    <div className="mt-8 flex items-center justify-between border-t pt-6">
      <div>
        {!isFirstStep && (
          <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/plans")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>

        {!isLastStep && (
          <Button type="button" onClick={onNext} disabled={isSubmitting}>
            Next
            <ArrowRight className="size-4" />
          </Button>
        )}

        {isLastStep && (
          <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Planner"}
          </Button>
        )}
      </div>
    </div>
  );
}
