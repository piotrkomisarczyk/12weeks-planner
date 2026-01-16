import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PlanCard } from './PlanCard';
import { usePlans } from './hooks/usePlans';
import { transformPlansToViewModels, type PlanViewModel } from '@/lib/plan-utils';

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  variant?: 'default' | 'destructive';
}

export function PlansView() {
  const { plans, isLoading, error, fetchPlans, activatePlan, archivePlan, deletePlan } = usePlans();
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Fetch plans on mount
  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Transform plans to view models
  const viewModels = transformPlansToViewModels(plans);

  // Categorize plans by status
  const activePlan = viewModels.find((p) => p.status === 'active');
  const readyPlans = viewModels.filter((p) => p.status === 'ready');
  const completedPlans = viewModels.filter((p) => p.status === 'completed');
  const archivedPlans = viewModels.filter((p) => p.status === 'archived');

  // Handler for navigating to create plan wizard
  const handleCreatePlan = () => {
    window.location.href = '/plans/new';
  };

  // Handler for activating a plan
  const handleActivatePlan = (id: string) => {
    const plan = viewModels.find((p) => p.id === id);
    if (!plan) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Activate Plan',
      description: `Are you sure you want to activate "${plan.name}"? This will deactivate your current active plan.`,
      onConfirm: async () => {
        try {
          await activatePlan(id);
          toast.success('Plan activated successfully');
        } catch (error) {
          toast.error('Failed to activate plan');
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Handler for archiving a plan
  const handleArchivePlan = (id: string) => {
    const plan = viewModels.find((p) => p.id === id);
    if (!plan) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Archive Plan',
      description: `Are you sure you want to archive "${plan.name}"? This will hide the plan from the main view.`,
      onConfirm: async () => {
        try {
          await archivePlan(id);
          toast.success('Plan archived successfully');
        } catch (error) {
          toast.error('Failed to archive plan');
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Handler for deleting a plan
  const handleDeletePlan = (id: string) => {
    const plan = viewModels.find((p) => p.id === id);
    if (!plan) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Plan',
      description: `Are you sure you want to delete "${plan.name}"? This action cannot be undone.`,
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await deletePlan(id);
          toast.success('Plan deleted successfully');
        } catch (error) {
          toast.error('Failed to delete plan');
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const planActions = {
    onActivate: handleActivatePlan,
    onArchive: handleArchivePlan,
    onDelete: handleDeletePlan,
  };

  // Loading state
  if (isLoading && plans.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Plans</h1>
            <p className="text-muted-foreground mt-2">
              Manage your 12-week planning cycles
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="mx-auto size-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground mt-4">Loading plans...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Plans</h1>
            <p className="text-muted-foreground mt-2">
              Manage your 12-week planning cycles
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="mx-auto size-12 text-destructive" />
            <h2 className="mt-4 text-lg font-semibold">Failed to load plans</h2>
            <p className="text-muted-foreground mt-2">{error}</p>
            <Button onClick={() => fetchPlans()} className="mt-4">
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (plans.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Plans</h1>
            <p className="text-muted-foreground mt-2">
              Manage your 12-week planning cycles
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="bg-muted mx-auto flex size-20 items-center justify-center rounded-full">
              <Plus className="size-10 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">No plans yet</h2>
            <p className="text-muted-foreground mt-2 max-w-sm">
              Get started by creating your first 12-week plan to track your
              long-term goals.
            </p>
            <Button className="mt-6" size="lg" onClick={handleCreatePlan}>
              <Plus className="size-4" />
              Create First Plan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main content with plans
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Plans</h1>
          <p className="text-muted-foreground mt-2">
            Manage your 12-week planning cycles
          </p>
        </div>
        <Button size="lg" onClick={handleCreatePlan}>
          <Plus className="size-4" />
          Create New Plan
        </Button>
      </div>

      <div className="space-y-8">
        {/* Active Plan Section */}
        {activePlan && (
          <section aria-labelledby="active-plan-heading">
            <h2
              id="active-plan-heading"
              className="mb-4 text-xl font-semibold tracking-tight"
            >
              Active Plan
            </h2>
            <PlanCard plan={activePlan} actions={planActions} />
          </section>
        )}

        {/* Ready Plans Section */}
        {readyPlans.length > 0 && (
          <section aria-labelledby="ready-plans-heading">
            <h2
              id="ready-plans-heading"
              className="mb-4 text-xl font-semibold tracking-tight"
            >
              Ready to Start
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {readyPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} actions={planActions} />
              ))}
            </div>
          </section>
        )}

        {/* Completed Plans Section */}
        {completedPlans.length > 0 && (
          <section aria-labelledby="completed-plans-heading">
            <h2
              id="completed-plans-heading"
              className="mb-4 text-xl font-semibold tracking-tight"
            >
              Completed
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {completedPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} actions={planActions} />
              ))}
            </div>
          </section>
        )}

        {/* Archived Plans Section */}
        {archivedPlans.length > 0 && (
          <section aria-labelledby="archived-plans-heading">
            <h2
              id="archived-plans-heading"
              className="mb-4 text-xl font-semibold tracking-tight text-muted-foreground"
            >
              Archived
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {archivedPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} actions={planActions} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
              }
            >
              Cancel
            </Button>
            <Button
              variant={confirmDialog.variant === 'destructive' ? 'destructive' : 'default'}
              onClick={confirmDialog.onConfirm}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

