import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardOverviewCard } from "./DashboardOverviewCard";
import type { PlanDTO, DashboardMetrics, GoalDTO } from "@/types";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Calendar: () => <div data-testid="icon-calendar">Calendar</div>,
  Target: () => <div data-testid="icon-target">Target</div>,
  Clock: () => <div data-testid="icon-clock">Clock</div>,
  ClipboardList: () => <div data-testid="icon-clipboard">ClipboardList</div>,
  ListTree: () => <div data-testid="icon-listtree">ListTree</div>,
}));

describe("DashboardOverviewCard", () => {
  // Test fixtures
  const mockPlan: PlanDTO = {
    id: "plan-123",
    user_id: "user-123",
    name: "My 12 Week Plan",
    status: "active",
    start_date: "2026-01-01",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };

  const mockMetrics: DashboardMetrics = {
    total_goals: 5,
    completed_goals: 2,
    total_tasks: 20,
    completed_tasks: 10,
  };

  const mockGoals: GoalDTO[] = [
    {
      id: "goal-1",
      plan_id: "plan-123",
      title: "Learn TypeScript",
      description: "Master TypeScript fundamentals",
      category: "development",
      position: 1,
      progress_percentage: 75,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "goal-2",
      plan_id: "plan-123",
      title: "Build Web App",
      description: "Create a full-stack application",
      category: "work",
      position: 2,
      progress_percentage: 50,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "goal-3",
      plan_id: "plan-123",
      title: "Improve Health",
      description: "Exercise regularly",
      category: "health",
      position: 3,
      progress_percentage: 30,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ];

  const currentWeek = 5;
  const currentDay = 3;

  let mockNavigate: (url: string) => void;

  beforeEach(() => {
    mockNavigate = vi.fn();
  });

  describe("Basic Rendering", () => {
    it("should render dashboard title", () => {
      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    it("should render within a card component", () => {
      const { container } = render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe("Quick Actions", () => {
    it("should render all 5 quick action buttons", () => {
      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      expect(screen.getByText("Goals View")).toBeInTheDocument();
      expect(screen.getByText("Hierarchy Tree")).toBeInTheDocument();
      expect(screen.getByText("Current Week")).toBeInTheDocument();
      expect(screen.getByText("Today")).toBeInTheDocument();
      expect(screen.getByText("Review")).toBeInTheDocument();
    });

    it("should render correct icons for each quick action", () => {
      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      expect(screen.getByTestId("icon-target")).toBeInTheDocument();
      expect(screen.getByTestId("icon-listtree")).toBeInTheDocument();
      expect(screen.getByTestId("icon-calendar")).toBeInTheDocument();
      expect(screen.getByTestId("icon-clock")).toBeInTheDocument();
      expect(screen.getByTestId("icon-clipboard")).toBeInTheDocument();
    });

    it("should call onNavigate with goals URL when Goals View is clicked", async () => {
      const user = userEvent.setup();

      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
          onNavigate={mockNavigate}
        />
      );

      const goalsButton = screen.getByText("Goals View");
      await user.click(goalsButton);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/plans/plan-123/goals");
    });

    it("should call onNavigate with week URL when Current Week is clicked", async () => {
      const user = userEvent.setup();

      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
          onNavigate={mockNavigate}
        />
      );

      const weekButton = screen.getByText("Current Week");
      await user.click(weekButton);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(`/plans/plan-123/week/${currentWeek}`);
    });

    it("should call onNavigate with day URL when Today is clicked", async () => {
      const user = userEvent.setup();

      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
          onNavigate={mockNavigate}
        />
      );

      const todayButton = screen.getByText("Today");
      await user.click(todayButton);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(`/plans/plan-123/week/${currentWeek}/day/${currentDay}`);
    });

    it("should call onNavigate with hierarchy URL when Hierarchy Tree is clicked", async () => {
      const user = userEvent.setup();

      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
          onNavigate={mockNavigate}
        />
      );

      const hierarchyButton = screen.getByText("Hierarchy Tree");
      await user.click(hierarchyButton);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/plans/plan-123/hierarchy");
    });

    it("should call onNavigate with review URL when Review is clicked", async () => {
      const user = userEvent.setup();

      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
          onNavigate={mockNavigate}
        />
      );

      const reviewButton = screen.getByText("Review");
      await user.click(reviewButton);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/plans/plan-123/review/1");
    });

    it("should not call onNavigate when onNavigate is not provided", async () => {
      const user = userEvent.setup();

      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      const goalsButton = screen.getByText("Goals View");
      await user.click(goalsButton);

      // Should not throw error
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Metrics Display", () => {
    it("should display total goals metric", () => {
      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("Total Goals")).toBeInTheDocument();
    });

    it("should display total tasks metric", () => {
      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      expect(screen.getByText("20")).toBeInTheDocument();
      expect(screen.getByText("Total Tasks")).toBeInTheDocument();
    });

    it("should display completed tasks metric", () => {
      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("Completed Tasks")).toBeInTheDocument();
    });

    it("should display completed goals metric", () => {
      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("Completed Goals")).toBeInTheDocument();
    });

    it("should display task progress percentage", () => {
      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      // 10 completed / 20 total = 50.0%
      expect(screen.getByText("50.0 %")).toBeInTheDocument();
      expect(screen.getByText("Task Progress")).toBeInTheDocument();
    });

    it("should display 0.0% when total tasks is 0", () => {
      const metricsWithZeroTasks: DashboardMetrics = {
        ...mockMetrics,
        total_tasks: 0,
        completed_tasks: 0,
      };

      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={metricsWithZeroTasks}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      expect(screen.getByText("0.0%")).toBeInTheDocument();
    });
  });

  describe("Progress Calculation", () => {
    it("should calculate and display overall progress percentage correctly", () => {
      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      // 2 completed / 5 total = 40%
      expect(screen.getByText("40%")).toBeInTheDocument();
      expect(screen.getByText("Overall Progress")).toBeInTheDocument();
    });

    it("should display 0% progress when total goals is 0", () => {
      const metricsWithZeroGoals: DashboardMetrics = {
        ...mockMetrics,
        total_goals: 0,
        completed_goals: 0,
      };

      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={metricsWithZeroGoals}
          goals={[]}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("should display 100% progress when all goals are completed", () => {
      const metricsAllCompleted: DashboardMetrics = {
        ...mockMetrics,
        total_goals: 5,
        completed_goals: 5,
      };

      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={metricsAllCompleted}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("should round progress percentage to nearest integer", () => {
      const metricsWithDecimal: DashboardMetrics = {
        ...mockMetrics,
        total_goals: 3,
        completed_goals: 1,
      };

      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={metricsWithDecimal}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      // 1/3 = 33.33... should round to 33%
      expect(screen.getByText("33%")).toBeInTheDocument();
    });
  });

  describe("Goals Overview", () => {
    it("should render goal cards when goals are provided", () => {
      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      expect(screen.getByText("Learn TypeScript")).toBeInTheDocument();
      expect(screen.getByText("Build Web App")).toBeInTheDocument();
      expect(screen.getByText("Improve Health")).toBeInTheDocument();
    });

    it("should not render goals section when goals array is empty", () => {
      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={[]}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      expect(screen.queryByText("Learn TypeScript")).not.toBeInTheDocument();
    });

    it("should display goal progress percentage for each goal", () => {
      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      expect(screen.getByText("75%")).toBeInTheDocument();
      expect(screen.getByText("50%")).toBeInTheDocument();
      expect(screen.getByText("30%")).toBeInTheDocument();
    });

    it("should display goal categories with correct labels", () => {
      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      expect(screen.getByText("Growth")).toBeInTheDocument(); // development category
      expect(screen.getByText("Work")).toBeInTheDocument();
      expect(screen.getByText("Health")).toBeInTheDocument();
    });

    it("should limit display to maximum 6 goals", () => {
      const manyGoals: GoalDTO[] = Array.from({ length: 10 }, (_, i) => ({
        id: `goal-${i}`,
        plan_id: "plan-123",
        title: `Goal ${i + 1}`,
        description: `Description ${i + 1}`,
        category: "work",
        position: i + 1,
        progress_percentage: 50,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      }));

      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={manyGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      // Should display only first 6 goals
      expect(screen.getByText("Goal 1")).toBeInTheDocument();
      expect(screen.getByText("Goal 6")).toBeInTheDocument();
      expect(screen.queryByText("Goal 7")).not.toBeInTheDocument();
      expect(screen.queryByText("Goal 10")).not.toBeInTheDocument();
    });

    it("should handle goals without category", () => {
      const goalsWithoutCategory: GoalDTO[] = [
        {
          ...mockGoals[0],
          category: null,
        },
      ];

      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={goalsWithoutCategory}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      expect(screen.getByText("Learn TypeScript")).toBeInTheDocument();
      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("should render progress bars for each goal", () => {
      const { container } = render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      const progressBars = container.querySelectorAll(".bg-primary.h-2.rounded-full");
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  describe("Overall Progress Bar", () => {
    it("should render overall progress bar", () => {
      const { container } = render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      const progressBar = container.querySelector(".bg-primary.h-3.rounded-full");
      expect(progressBar).toBeInTheDocument();
    });

    it("should set correct width for progress bar based on percentage", () => {
      const { container } = render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      // 2 completed / 5 total = 40%
      const progressBar = container.querySelector(".bg-primary.h-3.rounded-full") as HTMLElement;
      expect(progressBar).toHaveStyle({ width: "40%" });
    });
  });

  describe("Accessibility", () => {
    it("should have proper button roles for quick actions", () => {
      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(5);
    });

    it("should have title attribute for truncated goal titles", () => {
      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={mockGoals}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      const goalTitle = screen.getByText("Learn TypeScript");
      expect(goalTitle).toHaveAttribute("title", "Learn TypeScript");
    });
  });

  describe("Edge Cases", () => {
    it("should handle metrics with all zeros", () => {
      const zeroMetrics: DashboardMetrics = {
        total_goals: 0,
        completed_goals: 0,
        total_tasks: 0,
        completed_tasks: 0,
      };

      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={zeroMetrics}
          goals={[]}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      expect(screen.getByText("0.0%")).toBeInTheDocument();
      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("should handle single goal", () => {
      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={[mockGoals[0]]}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      expect(screen.getByText("Learn TypeScript")).toBeInTheDocument();
      expect(screen.queryByText("Build Web App")).not.toBeInTheDocument();
    });

    it("should handle goal with 0% progress", () => {
      const goalWithZeroProgress: GoalDTO[] = [
        {
          ...mockGoals[0],
          progress_percentage: 0,
        },
      ];

      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={goalWithZeroProgress}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("should handle goal with 100% progress", () => {
      const goalWithFullProgress: GoalDTO[] = [
        {
          ...mockGoals[0],
          progress_percentage: 100,
        },
      ];

      render(
        <DashboardOverviewCard
          plan={mockPlan}
          metrics={mockMetrics}
          goals={goalWithFullProgress}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      );

      expect(screen.getByText("100%")).toBeInTheDocument();
    });
  });
});
