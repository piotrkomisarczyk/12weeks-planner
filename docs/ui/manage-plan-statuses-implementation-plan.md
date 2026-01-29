# Implementation Plan: Plan Status Management Across Views

## Overview

This document provides a detailed implementation plan for managing plan statuses (`active`, `ready`, `completed`, `archived`) across all views in the 12 Weeks Planner application. The plan ensures that appropriate restrictions are applied to user interactions based on the current plan status.

## Plan Status Rules

### Active State

- All components are fully functional
- All editing, drag-and-drop, and interactions are enabled
- No restrictions applied

### Ready State

- **Tasks**: Cannot change task status (all tasks remain in `todo` state)
- **Review Page**: All interactive controls disabled
  - Cannot change goal progress bars
  - Cannot edit reflection text areas
  - Cannot toggle milestone checkboxes
  - Cannot click "Mark as complete" button
- **Goals Page**: Progress bar disabled, other fields remain editable
- **Milestones**: Cannot toggle completion checkboxes

### Completed or Archived State

- **All views**: Complete read-only mode
- No editing of any data (inputs, textareas, progress bars)
- No drag-and-drop operations
- No context menus or repositioning controls (up/down buttons)
- Accordion expand/collapse remains functional
- All interactive elements disabled

---

## Component Analysis by View

### 1. Day View Components

#### 1.1 DayPageContainer

**File**: `src/components/plans/day/DayPageContainer.tsx`

**Purpose**: Main container for day planning view with drag-and-drop support. Manages state, data fetching, and coordinates all child components.

**Main Elements**:

- DndContext wrapper for drag-and-drop
- DayHeader component
- Three DailyTaskSlot components (most_important, secondary, additional)

**Handled Events**:

- `handleAddTask`: Creates new task in slot
- `handleUpdateTask`: Updates task properties
- `handleDeleteTask`: Deletes task
- `handleStatusChange`: Changes task status
- `handlePriorityChange`: Changes task priority
- `handleDragEnd`: Handles drag-and-drop reordering
- `handleAssignDay`, `handleCopyTask`, `handleMoveTask`: Task movement operations
- `handleLinkGoalMilestone`, `handleAssignToWeeklyGoal`, `handleUnassignFromWeeklyGoal`: Task associations

**Validation Conditions**:

- **Ready state**: Disable `handleStatusChange`, show tooltip "Cannot change task status - plan is in ready state"
- **Completed/Archived**: Disable all handlers except navigation, disable DndContext sensors

**Types Required**:

- Add `planStatus: PlanStatus` prop to `DayPageContainerProps`
- No new types needed, use existing `PlanStatus` from types.ts

**Props Interface**:

```typescript
interface DayPageContainerProps {
  planId: string;
  planName: string;
  planStartDate: Date;
  weekNumber: number;
  dayNumber: number;
  planStatus: PlanStatus; // NEW
}
```

**Modifications Required**:

- Add `planStatus` prop and pass to DndContext and child components
- Conditionally disable DndContext sensors when `planStatus` is `completed` or `archived`
- Pass `planStatus` and `isReadOnly` flags to DailyTaskSlot components

---

#### 1.2 DailyTaskSlot

**File**: `src/components/plans/day/DailyTaskSlot.tsx`

**Purpose**: Represents a single slot (most_important, secondary, additional) containing tasks with specific priority constraints.

**Main Elements**:

- Slot header with title and task count
- SortableContext for drag-and-drop
- List of TaskCard components
- InlineAddTask component for creating new tasks

**Handled Events**:

- `onAddTask`: Callback to add new task
- Passes through all task event handlers to TaskCard

**Validation Conditions**:

- **Ready state**: Disable task status changes in child TaskCards
- **Completed/Archived**: Disable add task button, disable all TaskCard interactions

**Types Required**:

- Add `planStatus: PlanStatus` and `isReadOnly: boolean` to `DailyTaskSlotProps`

**Props Interface**:

```typescript
interface DailyTaskSlotProps {
  // ... existing props
  planStatus: PlanStatus; // NEW
  isReadOnly: boolean; // NEW - computed from planStatus
}
```

---

#### 1.3 TaskCard (Day View Variant)

**File**: `src/components/plans/day/TaskCard.tsx`

**Purpose**: Displays individual task with status control, priority badge, context menu, and full editing capabilities.

**Main Elements**:

- Drag handle (for reordering within slot)
- TaskStatusControl component
- Title input (inline editing)
- Priority badge (clickable)
- Badge hierarchy (category, goal, milestone, weekly goal)
- Context menu with multiple actions

**Handled Events**:

- `onStatusChange`: Changes task status (todo, in_progress, completed, cancelled, postponed)
- `onPriorityChange`: Changes task priority (A, B, C)
- `onUpdate`: Updates task title and other properties
- `onDelete`: Deletes task
- `onCopy`, `onMove`: Copy/move task to different day/week
- `onAssignDay`: Assigns task to specific day
- `onLinkGoalMilestone`: Links task to goal/milestone
- `onAssignToWeeklyGoal`, `onUnassignFromWeeklyGoal`: Manages weekly goal assignments

**Validation Conditions**:

- **Ready state**:
  - Disable TaskStatusControl (status changes)
  - Show tooltip: "Task status cannot be changed - plan is in ready state"
  - Keep other interactions enabled
- **Completed/Archived**:
  - Disable drag handle
  - Disable TaskStatusControl
  - Disable title editing
  - Disable priority badge click
  - Hide/disable context menu
  - Show tooltip: "Plan is [completed/archived] - editing disabled"

**Types Required**:

- Add `planStatus: PlanStatus` and `isReadOnly: boolean` to `TaskCardProps`

**Props Interface**:

```typescript
interface TaskCardProps {
  // ... existing props
  planStatus: PlanStatus; // NEW
  isReadOnly: boolean; // NEW
}
```

---

### 2. Week View Components

#### 2.1 WeekPlannerContainer

**File**: `src/components/plans/week/WeekPlannerContainer.tsx`

**Purpose**: Main container for week planning view with drag-and-drop support. Manages state, data fetching, and coordinates weekly goals and ad-hoc tasks.

**Main Elements**:

- DndContext wrapper for drag-and-drop
- WeekHeader component
- WeeklyGoalsSection component
- AdHocSection component

**Handled Events**:

- `handleAddGoal`: Creates new weekly goal
- `handleUpdateGoal`: Updates weekly goal properties
- `handleDeleteGoal`: Deletes weekly goal
- `handleLinkGoal`: Links weekly goal to long-term goal/milestone
- `handleMoveGoalUp`, `handleMoveGoalDown`: Reorders weekly goals
- `handleAddTask`: Creates new task
- `handleUpdateTask`: Updates task properties
- `handleDeleteTask`: Deletes task
- `handleAssignDay`: Assigns task to specific day
- `handleAssignToWeeklyGoal`, `handleUnassignFromWeeklyGoal`: Manages task assignments
- `handleDragEnd`: Handles drag-and-drop reordering

**Validation Conditions**:

- **Ready state**: Disable task status changes in child TaskItems
- **Completed/Archived**: Disable all handlers except navigation, disable DndContext sensors

**Types Required**:

- Add `planStatus: PlanStatus` prop to `WeekPlannerContainerProps`

**Props Interface**:

```typescript
interface WeekPlannerContainerProps {
  planId: string;
  weekNumber: number;
  planName: string;
  planStartDate: Date;
  planStatus: PlanStatus; // NEW
}
```

---

#### 2.2 WeeklyGoalsSection

**File**: `src/components/plans/week/WeeklyGoalsSection.tsx`

**Purpose**: Container for all weekly goals with ability to create new goals.

**Main Elements**:

- Section header with "Add Weekly Goal" button
- SortableContext for drag-and-drop
- List of WeeklyGoalCard components
- CreateWeeklyGoalDialog component

**Handled Events**:

- `onAddGoal`: Callback to create new weekly goal
- Passes through all event handlers to WeeklyGoalCard

**Validation Conditions**:

- **Ready state**: Keep all interactions enabled
- **Completed/Archived**: Disable "Add Weekly Goal" button, pass `isReadOnly` to child components

**Types Required**:

- Add `planStatus: PlanStatus` and `isReadOnly: boolean` to `WeeklyGoalsSectionProps`

**Props Interface**:

```typescript
interface WeeklyGoalsSectionProps {
  // ... existing props
  planStatus: PlanStatus; // NEW
  isReadOnly: boolean; // NEW
}
```

---

#### 2.3 WeeklyGoalCard

**File**: `src/components/plans/week/WeeklyGoalCard.tsx`

**Purpose**: Displays single weekly goal with its tasks in an expandable accordion.

**Main Elements**:

- Accordion wrapper (expand/collapse)
- Title (editable on double-click)
- Category/goal/milestone badges
- Move up/down buttons
- Context menu (link goal/milestone, delete)
- Progress bar (calculated from task completion)
- List of TaskItem components
- InlineAddTask component

**Handled Events**:

- `onUpdate`: Updates weekly goal properties (title, associations)
- `onDelete`: Deletes weekly goal
- `onAddTask`: Creates new subtask
- `onUpdateTask`: Updates subtask properties
- `onDeleteTask`: Deletes subtask
- `onAssignDay`: Assigns subtask to day
- `onLinkGoal`: Links weekly goal to long-term goal/milestone
- `onUnassignFromWeeklyGoal`: Moves subtask to ad-hoc section
- `onMoveUp`, `onMoveDown`: Reorders weekly goal position

**Validation Conditions**:

- **Ready state**: Disable task status changes in child TaskItems
- **Completed/Archived**:
  - Disable title editing
  - Disable move up/down buttons
  - Disable context menu
  - Disable add task button
  - Pass `isReadOnly` to TaskItems
  - Keep accordion expand/collapse enabled

**Types Required**:

- Add `planStatus: PlanStatus` and `isReadOnly: boolean` to `WeeklyGoalCardProps`

**Props Interface**:

```typescript
interface WeeklyGoalCardProps {
  // ... existing props
  planStatus: PlanStatus; // NEW
  isReadOnly: boolean; // NEW
}
```

---

#### 2.4 TaskItem (Week View Variant)

**File**: `src/components/plans/week/TaskItem.tsx`

**Purpose**: Displays individual task with status control, priority, and context menu.

**Main Elements**:

- Drag handle
- TaskStatusControl component
- Title input (inline editing)
- Day badge (links to day view)
- Category/goal/milestone badges
- Priority badge (clickable)
- Context menu with actions

**Handled Events**:

- `onUpdate`: Updates task properties (status, priority, title, associations)
- `onDelete`: Deletes task
- `onAssignDay`: Assigns task to specific day
- `onAssignToWeeklyGoal`, `onUnassignFromWeeklyGoal`: Manages weekly goal assignments
- Priority change through badge click or context menu
- Goal/milestone linking through context menu

**Validation Conditions**:

- **Ready state**:
  - Disable TaskStatusControl
  - Show tooltip: "Task status cannot be changed - plan is in ready state"
  - Keep other interactions enabled
- **Completed/Archived**:
  - Disable drag handle
  - Disable TaskStatusControl
  - Disable title editing
  - Disable priority badge
  - Hide/disable context menu
  - Show tooltip: "Plan is [completed/archived] - editing disabled"

**Types Required**:

- Add `planStatus: PlanStatus` and `isReadOnly: boolean` to `TaskItemProps`

**Props Interface**:

```typescript
interface TaskItemProps {
  // ... existing props
  planStatus: PlanStatus; // NEW
  isReadOnly: boolean; // NEW
}
```

---

#### 2.5 TaskStatusControl

**File**: `src/components/plans/week/TaskStatusControl.tsx`

**Purpose**: Specialized control for task status with 5 states (todo, in_progress, completed, cancelled, postponed).

**Main Elements**:

- Status icon (click to cycle: todo → in_progress → completed)
- Chevron dropdown (opens popover with all 5 status options)

**Handled Events**:

- `onChange`: Callback when status is changed
- Icon click cycles through main statuses
- Popover selection allows choosing any status

**Validation Conditions**:

- **Ready state**: Component fully disabled
- **Completed/Archived**: Component fully disabled

**Types Required**:

- No new types needed (already has `disabled` prop)

**Props Interface**:

```typescript
interface TaskStatusControlProps {
  status: TaskStatus;
  onChange: (status: TaskStatus) => void;
  disabled?: boolean; // Existing prop - use for ready/completed/archived states
}
```

---

#### 2.6 AdHocSection

**File**: `src/components/plans/week/AdHocSection.tsx`

**Purpose**: Container for ad-hoc tasks (not associated with weekly goals).

**Main Elements**:

- Section header with "Add Task" button
- SortableContext for drag-and-drop
- List of TaskItem components
- InlineAddTask component

**Handled Events**:

- `onAddTask`: Creates new ad-hoc task
- Passes through all event handlers to TaskItem

**Validation Conditions**:

- **Ready state**: Disable task status changes in child TaskItems
- **Completed/Archived**: Disable "Add Task" button, pass `isReadOnly` to child TaskItems

**Types Required**:

- Add `planStatus: PlanStatus` and `isReadOnly: boolean` to `AdHocSectionProps`

**Props Interface**:

```typescript
interface AdHocSectionProps {
  // ... existing props
  planStatus: PlanStatus; // NEW
  isReadOnly: boolean; // NEW
}
```

---

### 3. Goals View Components

#### 3.1 GoalsManager

**File**: `src/components/plans/goals/GoalsManager.tsx`

**Purpose**: Main container for goals management view. Displays list of goals and creation dialog.

**Main Elements**:

- Page header with goal count
- CreateGoalDialog component
- List of GoalCard components
- EmptyState component (when no goals exist)

**Handled Events**:

- `handleAddGoal`: Creates new goal
- `handleUpdateGoal`: Updates goal properties
- `handleDeleteGoal`: Deletes goal
- `handleMoveGoalUp`, `handleMoveGoalDown`: Reorders goals

**Validation Conditions**:

- **Ready state**: Disable progress bar in GoalCard, keep other fields editable
- **Completed/Archived**:
  - Disable CreateGoalDialog button
  - Pass `isReadOnly` to all GoalCards
  - Disable move up/down functionality

**Types Required**:

- `planContext` already contains `status` field
- Compute `isReadOnly` from `planContext.status`

**Props Interface**:

```typescript
interface GoalsManagerProps {
  planContext: PlanContext; // Already contains status field
}
```

---

#### 3.2 GoalCard

**File**: `src/components/plans/goals/GoalCard.tsx`

**Purpose**: Displays single goal in an expandable accordion with form, progress slider, and milestones.

**Main Elements**:

- Accordion wrapper (expand/collapse)
- Title and category badge
- Move up/down buttons
- Delete button
- GoalForm component (title, category, description)
- GoalProgress slider
- MilestoneManager component

**Handled Events**:

- `onUpdate`: Updates goal properties
- `onDelete`: Deletes goal
- `onMoveUp`, `onMoveDown`: Reorders goal position
- `handleProgressChange`: Updates goal progress percentage

**Validation Conditions**:

- **Ready state**:
  - Disable GoalProgress slider
  - Show tooltip: "Progress cannot be changed - plan is in ready state"
  - Keep GoalForm enabled
  - Pass restriction to MilestoneManager (disable milestone checkboxes)
- **Completed/Archived**:
  - Disable GoalForm
  - Disable GoalProgress slider
  - Disable move up/down buttons
  - Disable delete button
  - Pass `isReadOnly` to MilestoneManager
  - Keep accordion expand/collapse enabled

**Types Required**:

- `planContext` already contains `status` and `isArchived` fields
- Compute additional flags from status

**Props Interface**:

```typescript
interface GoalCardProps {
  goal: GoalDTO;
  planContext: PlanContext; // Already contains status and isArchived
  onUpdate: (id: string, data: Partial<GoalDTO>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
}
```

---

#### 3.3 GoalForm

**File**: `src/components/plans/goals/GoalForm.tsx`

**Purpose**: Form for editing goal title, category, and description with auto-save.

**Main Elements**:

- Title input
- Category select dropdown
- Description textarea
- Auto-save status indicator

**Handled Events**:

- `onUpdate`: Callback with updated field values
- Debounced auto-save on input changes

**Validation Conditions**:

- **Ready state**: All fields remain enabled
- **Completed/Archived**: All fields disabled

**Types Required**:

- Already has `disabled` prop

**Props Interface**:

```typescript
interface GoalFormProps {
  title: string;
  category: GoalCategory | null;
  description: string | null;
  onUpdate: (data: Partial<GoalEditFormData>) => Promise<void>;
  disabled?: boolean; // Existing prop - use for completed/archived
}
```

---

#### 3.4 GoalProgress

**File**: `src/components/plans/goals/GoalProgress.tsx`

**Purpose**: Slider control for goal progress with confetti animation at 100%.

**Main Elements**:

- Progress slider (0-100%, step 5%)
- Percentage display
- Confetti animation trigger

**Handled Events**:

- `onChange`: Callback with new progress value
- Slider value change (debounced)

**Validation Conditions**:

- **Ready state**: Slider disabled, show tooltip "Progress cannot be changed - plan is in ready state"
- **Completed/Archived**: Slider disabled, show tooltip "Progress cannot be changed - plan is in [completed/archived] state".

**Types Required**:

- Already has `disabled` prop

**Props Interface**:

```typescript
interface GoalProgressProps {
  progress: number;
  onChange: (progress: number) => void;
  disabled?: boolean; // Existing prop - use for ready/completed/archived
}
```

---

#### 3.5 MilestoneManager

**File**: `src/components/plans/goals/milestones/MilestoneManager.tsx`

**Purpose**: Manages milestones for a goal with drag-and-drop reordering.

**Main Elements**:

- Section header
- DndContext for drag-and-drop
- SortableContext for milestone list
- List of MilestoneItem components
- "Add Milestone" button
- MilestoneForm for creation

**Handled Events**:

- Milestone CRUD operations (create, update, delete)
- Milestone completion toggle
- Drag-and-drop reordering

**Validation Conditions**:

- **Ready state**:
  - Disable milestone checkbox toggle
  - Keep other interactions enabled
- **Completed/Archived**:
  - Disable drag-and-drop
  - Disable "Add Milestone" button
  - Pass `isReadOnly` to MilestoneItems

**Types Required**:

- `planContext` prop already available
- Compute flags from `planContext.status`

**Props Interface**:

```typescript
interface MilestoneManagerProps {
  goalId: string;
  planContext: PlanContext; // Already contains status
  isGoalExpanded: boolean;
}
```

---

#### 3.6 MilestoneItem

**File**: `src/components/plans/goals/milestones/MilestoneItem.tsx`

**Purpose**: Displays single milestone with checkbox, title, due date, and actions.

**Main Elements**:

- Drag handle
- Completion checkbox
- Title and due date display
- Edit mode (title input, date picker)
- Edit and delete buttons

**Handled Events**:

- `onToggle`: Toggles milestone completion
- `onUpdate`: Updates milestone title and due date
- `onDelete`: Deletes milestone
- Edit mode activation and save

**Validation Conditions**:

- **Ready state**:
  - Disable checkbox toggle
  - Show tooltip: "Milestone completion cannot be changed - plan is in ready state"
  - Keep other interactions enabled
- **Completed/Archived**:
  - Disable drag handle
  - Disable checkbox
  - Disable edit button
  - Disable delete button
  - Show tooltip: "Plan is [completed/archived] - editing disabled"

**Types Required**:

- Already has `disabled` and `dragDisabled` props
- Add tooltip support for disabled states

**Props Interface**:

```typescript
interface MilestoneItemProps {
  milestone: MilestoneDTO;
  onToggle: (id: string, isCompleted: boolean) => Promise<void>;
  onUpdate: (id: string, data: { title?: string; due_date?: string | null }) => Promise<void>;
  onDelete: (id: string) => void;
  planStartDate: string;
  planEndDate: string;
  disabled?: boolean; // Existing prop
  isDeleting?: boolean;
  dragDisabled?: boolean; // Existing prop
}
```

---

### 4. Review View Components

#### 4.1 WeeklyReviewContainer

**File**: `src/components/plans/review/WeeklyReviewContainer.tsx`

**Purpose**: Main container for weekly review with goal progress updates and reflection form.

**Main Elements**:

- ReviewHeader component
- Two accordions:
  - Goal Progress accordion (GoalProgressList)
  - Weekly Reflection accordion (ReflectionForm)
- ReviewCompletionStatus component

**Handled Events**:

- `updateReflection`: Updates reflection text fields
- `updateGoalProgress`: Updates goal progress percentage
- `toggleMilestone`: Toggles milestone completion
- `toggleCompletion`: Marks review as complete/incomplete

**Validation Conditions**:

- **Ready state**: Disable all interactive controls
  - Disable goal progress sliders
  - Disable milestone checkboxes
  - Disable reflection textareas
  - Disable "Mark as complete" button
- **Completed/Archived**: Same as ready state (complete read-only)

**Types Required**:

- Add `planStatus: PlanStatus` prop to `WeeklyReviewContainerProps`

**Props Interface**:

```typescript
interface WeeklyReviewContainerProps {
  planId: string;
  weekNumber: number;
  initialReview: WeeklyReviewViewModel;
  initialGoals: GoalReviewViewModel[];
  planStatus: PlanStatus; // NEW
}
```

---

#### 4.2 GoalProgressList

**File**: `src/components/plans/review/GoalProgressList.tsx`

**Purpose**: List of goals with progress sliders and milestone checkboxes.

**Main Elements**:

- List of GoalProgressItem components

**Handled Events**:

- Passes through events to GoalProgressItem

**Validation Conditions**:

- Pass `isReadOnly` flag to child GoalProgressItems

**Types Required**:

- Add `isReadOnly: boolean` to `GoalProgressListProps`

**Props Interface**:

```typescript
interface GoalProgressListProps {
  goals: GoalReviewViewModel[];
  onProgressUpdate: (goalId: string, progress: number) => void;
  onMilestoneToggle?: (milestoneId: string, isCompleted: boolean) => void;
  isReadOnly: boolean; // NEW
}
```

---

#### 4.3 GoalProgressItem

**File**: `src/components/plans/review/GoalProgressItem.tsx`

**Purpose**: Single goal with progress slider, input, and milestone checkboxes.

**Main Elements**:

- Goal title and category badge
- Description text
- Milestone checklist with checkboxes
- Progress slider (0-100%, step 5%)
- Progress number input

**Handled Events**:

- `onProgressUpdate`: Updates goal progress
- `onMilestoneToggle`: Toggles milestone completion
- `handleSliderChange`: Local state update
- `handleSliderCommit`: Commits change to parent
- `handleInputChange`, `handleInputBlur`: Number input handling

**Validation Conditions**:

- **Ready state**:
  - Disable progress slider
  - Disable progress input
  - Disable milestone checkboxes
  - Show tooltip: "Progress and milestones cannot be changed - plan is in ready state"
- **Completed/Archived**: Same as ready state

**Types Required**:

- Add `isReadOnly: boolean` to `GoalProgressItemProps`

**Props Interface**:

```typescript
interface GoalProgressItemProps {
  goal: GoalReviewViewModel;
  onProgressUpdate: (goalId: string, progress: number) => void;
  onMilestoneToggle?: (milestoneId: string, isCompleted: boolean) => void;
  isReadOnly: boolean; // NEW
}
```

---

#### 4.4 ReflectionForm

**File**: `src/components/plans/review/ReflectionForm.tsx`

**Purpose**: Form with three textareas for weekly reflection questions with auto-save.

**Main Elements**:

- Three labeled textareas:
  - "What worked well this week?"
  - "What didn't work or could be improved?"
  - "What will you focus on improving next week?"
- Save status indicator

**Handled Events**:

- `onChange`: Callback for text field changes
- Input change handlers with debounced auto-save

**Validation Conditions**:

- **Ready state**: All textareas disabled, show tooltip "Reflection cannot be edited - plan is in ready state"
- **Completed/Archived**: All textareas disabled, show tooltip "Reflection cannot be edited - plan is in [completed/archived] state"

**Types Required**:

- Add `isReadOnly: boolean` to `ReflectionFormProps`

**Props Interface**:

```typescript
interface ReflectionFormProps {
  values: WeeklyReviewViewModel;
  onChange: (
    field: keyof Pick<WeeklyReviewViewModel, "what_worked" | "what_did_not_work" | "what_to_improve">,
    value: string
  ) => void;
  isSaving: boolean;
  isReadOnly: boolean; // NEW
}
```

---

#### 4.5 ReviewCompletionStatus

**File**: `src/components/plans/review/ReviewCompletionStatus.tsx`

**Purpose**: Shows completion status and button to mark review as complete.

**Main Elements**:

- Completion icon (CheckCircle or Circle)
- Status text
- "Mark as Complete" / "Mark as Incomplete" button

**Handled Events**:

- `onToggleComplete`: Toggles review completion status

**Validation Conditions**:

- **Ready state**: Button disabled, show tooltip "Review completion cannot be changed - plan is in ready state"
- **Completed/Archived**: Button disabled, show tooltip "Review completion cannot be changed - plan is in [completed/archived] state"

**Types Required**:

- Add `isReadOnly: boolean` to `ReviewCompletionStatusProps`

**Props Interface**:

```typescript
interface ReviewCompletionStatusProps {
  isCompleted: boolean;
  onToggleComplete: () => void;
  isReadOnly: boolean; // NEW
}
```

---

## Types Summary

### Existing Types (No Changes Required)

- `PlanStatus`: `'ready' | 'active' | 'completed' | 'archived'` (already defined in types.ts)
- `PlanContext`: Already includes `status: PlanStatus` field
- `TaskStatus`, `TaskPriority`, `GoalCategory`: Already defined

### New Props to Add

Add the following props to component interfaces:

1. **Container Components** (receive `planStatus` from Astro pages):
   - `DayPageContainerProps`: Add `planStatus: PlanStatus`
   - `WeekPlannerContainerProps`: Add `planStatus: PlanStatus`
   - `WeeklyReviewContainerProps`: Add `planStatus: PlanStatus`

2. **Child Components** (receive `isReadOnly` or `planStatus` from parents):
   - `DailyTaskSlotProps`: Add `planStatus: PlanStatus`, `isReadOnly: boolean`
   - `TaskCardProps`: Add `planStatus: PlanStatus`, `isReadOnly: boolean`
   - `WeeklyGoalsSectionProps`: Add `planStatus: PlanStatus`, `isReadOnly: boolean`
   - `WeeklyGoalCardProps`: Add `planStatus: PlanStatus`, `isReadOnly: boolean`
   - `TaskItemProps`: Add `planStatus: PlanStatus`, `isReadOnly: boolean`
   - `AdHocSectionProps`: Add `planStatus: PlanStatus`, `isReadOnly: boolean`
   - `GoalProgressListProps`: Add `isReadOnly: boolean`
   - `GoalProgressItemProps`: Add `isReadOnly: boolean`
   - `ReflectionFormProps`: Add `isReadOnly: boolean`
   - `ReviewCompletionStatusProps`: Add `isReadOnly: boolean`

3. **Components Using Existing Props** (no changes needed):
   - `GoalFormProps`: Already has `disabled` prop
   - `GoalProgressProps`: Already has `disabled` prop
   - `TaskStatusControlProps`: Already has `disabled` prop
   - `MilestoneItemProps`: Already has `disabled` and `dragDisabled` props

### Helper Functions

Create utility functions in a new file or add to `lib/utils.ts`:

```typescript
/**
 * Determines if plan is in read-only mode
 */
export function isPlanReadOnly(status: PlanStatus): boolean {
  return status === "completed" || status === "archived";
}

/**
 * Determines if plan is in ready state
 */
export function isPlanReady(status: PlanStatus): boolean {
  return status === "ready";
}

/**
 * Determines if task status can be changed
 */
export function canChangeTaskStatus(status: PlanStatus): boolean {
  return status === "active";
}

/**
 * Determines if goal progress can be changed
 */
export function canChangeGoalProgress(status: PlanStatus): boolean {
  return status === "active" || status === "ready"; // Ready allows goal edit but not progress
}

/**
 * Gets tooltip message for disabled component
 */
export function getDisabledTooltip(
  status: PlanStatus,
  context: "task_status" | "progress" | "milestone" | "reflection" | "general"
): string {
  if (status === "ready") {
    switch (context) {
      case "task_status":
        return "Task status cannot be changed - plan is in ready state";
      case "progress":
        return "Progress cannot be changed - plan is in ready state";
      case "milestone":
        return "Milestone completion cannot be changed - plan is in ready state";
      case "reflection":
        return "Reflection cannot be edited - plan is in ready state";
      default:
        return "This action is disabled - plan is in ready state";
    }
  }

  if (status === "completed") {
    return "Plan is completed - editing disabled";
  }

  if (status === "archived") {
    return "Plan is archived - editing disabled";
  }

  return "";
}
```

---

## State Management

### Astro Pages (Server-Side)

Astro pages fetch plan data and pass `planStatus` to container components:

**Example: `/src/pages/plans/[id]/week/[weekNumber]/day/[dayNumber].astro`**

```astro
---
import { DayPageContainer } from "@/components/plans/day";

const { id, weekNumber, dayNumber } = Astro.params;

// Fetch plan data
const plan = await fetchPlan(id);

// Pass plan status to container
const planStatus = plan.status;
---

<Layout>
  <DayPageContainer
    planId={id}
    planName={plan.name}
    planStartDate={new Date(plan.start_date)}
    weekNumber={Number(weekNumber)}
    dayNumber={Number(dayNumber)}
    planStatus={planStatus}
    client:load
  />
</Layout>
```

### Container Components (Client-Side)

Container components receive `planStatus` and compute derived flags:

**Example: `DayPageContainer.tsx`**

```typescript
export function DayPageContainer({
  planId,
  planName,
  planStartDate,
  weekNumber,
  dayNumber,
  planStatus, // NEW PROP
}: DayPageContainerProps) {
  // Compute derived flags
  const isReadOnly = isPlanReadOnly(planStatus);
  const canChangeStatus = canChangeTaskStatus(planStatus);

  // Conditionally disable DndContext sensors
  const sensors = isReadOnly ? [] : useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Pass flags to child components
  return (
    <DndContext sensors={sensors} ...>
      <DailyTaskSlot
        planStatus={planStatus}
        isReadOnly={isReadOnly}
        // ... other props
      />
    </DndContext>
  );
}
```

### Child Components

Child components receive `planStatus` or `isReadOnly` and apply restrictions:

**Example: `TaskStatusControl.tsx`**

```typescript
export function TaskStatusControl({
  status,
  onChange,
  disabled = false,
  planStatus, // NEW PROP
}: TaskStatusControlProps) {
  const canChange = canChangeTaskStatus(planStatus);
  const tooltip = !canChange ? getDisabledTooltip(planStatus, 'task_status') : '';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handleIconClick}
            disabled={disabled || !canChange}
            // ... other props
          />
          {/* ... rest of component */}
        </div>
      </TooltipTrigger>
      {tooltip && (
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      )}
    </Tooltip>
  );
}
```

---

## Tooltip Implementation

Use shadcn/ui Tooltip component to inform users why components are disabled:

```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

<Tooltip>
  <TooltipTrigger asChild>
    <Button disabled={isReadOnly}>Edit</Button>
  </TooltipTrigger>
  {isReadOnly && (
    <TooltipContent>
      <p>{getDisabledTooltip(planStatus, "general")}</p>
    </TooltipContent>
  )}
</Tooltip>;
```

**Tooltip Guidelines:**

- Show tooltips on hover over disabled interactive elements
- Use clear, concise messages explaining why action is disabled
- Include plan status in message (e.g., "plan is in ready state")
- Apply tooltips to: buttons, inputs, sliders, checkboxes, drag handles, context menu triggers

---

## Implementation Steps

### Phase 1: Setup and Type Definitions

1. **Add helper functions** to `lib/utils.ts`:
   - `isPlanReadOnly(status)`
   - `isPlanReady(status)`
   - `canChangeTaskStatus(status)`
   - `canChangeGoalProgress(status)`
   - `getDisabledTooltip(status, context)`

2. **Update Astro pages** to fetch and pass `planStatus`:
   - `src/pages/plans/[id]/week/[weekNumber]/day/[dayNumber].astro`
   - `src/pages/plans/[id]/week/[weekNumber].astro`
   - `src/pages/plans/[id]/goals.astro`
   - `src/pages/plans/[id]/review/[weekNumber].astro`

### Phase 2: Day View Implementation

1. **Update `DayPageContainer.tsx`**:
   - Add `planStatus` prop
   - Compute `isReadOnly` and `canChangeStatus` flags
   - Conditionally disable DndContext sensors when read-only
   - Pass flags to `DailyTaskSlot` components

2. **Update `DailyTaskSlot.tsx`**:
   - Add `planStatus` and `isReadOnly` props
   - Conditionally disable "Add Task" button
   - Pass flags to `TaskCard` components

3. **Update `TaskCard.tsx`** (Day variant):
   - Add `planStatus` and `isReadOnly` props
   - Wrap component in Tooltip
   - Disable drag handle when read-only
   - Pass `disabled` flag to `TaskStatusControl`
   - Disable title editing when read-only
   - Disable priority badge when read-only
   - Hide/disable context menu when read-only
   - Show appropriate tooltip messages

4. **Update `TaskStatusControl.tsx`**:
   - Add tooltip wrapper
   - Use existing `disabled` prop
   - Show tooltip when disabled

### Phase 3: Week View Implementation

1. **Update `WeekPlannerContainer.tsx`**:
   - Add `planStatus` prop
   - Compute `isReadOnly` flag
   - Conditionally disable DndContext sensors when read-only
   - Pass flags to `WeeklyGoalsSection` and `AdHocSection`

2. **Update `WeeklyGoalsSection.tsx`**:
   - Add `planStatus` and `isReadOnly` props
   - Conditionally disable "Add Weekly Goal" button
   - Pass flags to `WeeklyGoalCard` components

3. **Update `WeeklyGoalCard.tsx`**:
   - Add `planStatus` and `isReadOnly` props
   - Disable title editing when read-only
   - Hide/disable move up/down buttons when read-only
   - Hide/disable context menu when read-only
   - Disable "Add Task" button when read-only
   - Pass flags to `TaskItem` components

4. **Update `AdHocSection.tsx`**:
   - Add `planStatus` and `isReadOnly` props
   - Conditionally disable "Add Task" button
   - Pass flags to `TaskItem` components

5. **Update `TaskItem.tsx`** (Week variant):
   - Add `planStatus` and `isReadOnly` props
   - Wrap component in Tooltip
   - Disable drag handle when read-only
   - Pass `disabled` flag to `TaskStatusControl`
   - Disable title editing when read-only
   - Disable priority badge when read-only
   - Hide/disable context menu when read-only
   - Show appropriate tooltip messages

### Phase 4: Goals View Implementation

1. **Update `GoalsManager.tsx`**:
   - Use existing `planContext.status`
   - Compute `isReadOnly` from status
   - Conditionally disable `CreateGoalDialog` button
   - Pass `planContext` to `GoalCard` components

2. **Update `GoalCard.tsx`**:
   - Use existing `planContext.status`
   - Compute `isReadOnly` and `canEditProgress` flags
   - Disable `GoalForm` when read-only
   - Disable `GoalProgress` based on status (ready or read-only)
   - Hide/disable move up/down buttons when read-only
   - Hide/disable delete button when read-only
   - Pass flags to `MilestoneManager`

3. **Update `GoalForm.tsx`**:
   - Use existing `disabled` prop
   - Disable all inputs when `disabled` is true

4. **Update `GoalProgress.tsx`**:
   - Add tooltip wrapper
   - Use existing `disabled` prop
   - Show tooltip when disabled

5. **Update `MilestoneManager.tsx`**:
   - Use existing `planContext.status`
   - Compute flags from status
   - Conditionally disable DndContext sensors
   - Disable "Add Milestone" button when read-only
   - Pass `disabled` and `dragDisabled` to `MilestoneItem`

6. **Update `MilestoneItem.tsx`**:
   - Add tooltip wrapper
   - Use existing `disabled` and `dragDisabled` props
   - Additional flag: `canToggle` = !isPlanReady(status) && !isPlanReadOnly(status)
   - Disable checkbox based on `canToggle`
   - Disable edit/delete buttons when disabled
   - Show appropriate tooltip messages

### Phase 5: Review View Implementation

1. **Update `WeeklyReviewContainer.tsx`**:
   - Add `planStatus` prop
   - Compute `isReadOnly` flag
   - Pass flag to `GoalProgressList` and `ReflectionForm`
   - Pass flag to `ReviewCompletionStatus`

2. **Update `GoalProgressList.tsx`**:
   - Add `isReadOnly` prop
   - Pass flag to `GoalProgressItem` components

3. **Update `GoalProgressItem.tsx`**:
   - Add `isReadOnly` prop
   - Wrap slider and input in Tooltip
   - Disable progress slider when `isReadOnly`
   - Disable progress input when `isReadOnly`
   - Disable milestone checkboxes when `isReadOnly`
   - Show appropriate tooltip messages

4. **Update `ReflectionForm.tsx`**:
   - Add `isReadOnly` prop
   - Wrap textareas in Tooltip
   - Disable all textareas when `isReadOnly`
   - Show appropriate tooltip messages

5. **Update `ReviewCompletionStatus.tsx`**:
   - Add `isReadOnly` prop
   - Wrap button in Tooltip
   - Disable button when `isReadOnly`
   - Show appropriate tooltip messages

### Phase 6: Testing and Refinement

1. **Test each plan status across all views**:
   - Active: Verify all interactions work
   - Ready: Verify task status disabled, review disabled, goal progress disabled, milestones disabled
   - Completed: Verify complete read-only mode
   - Archived: Verify complete read-only mode

2. **Verify tooltips appear correctly**:
   - On hover over disabled elements
   - With appropriate messages for each context
   - Clear and user-friendly language

3. **Test accordion expand/collapse**:
   - Verify accordions work in all plan statuses
   - Ensure no accidental restrictions on accordion functionality

4. **Test edge cases**:
   - Switching plan status while view is open
   - Multiple tabs/windows with same plan
   - Network errors during status transitions

5. **Accessibility review**:
   - Ensure disabled state is announced by screen readers
   - Verify keyboard navigation works correctly
   - Test focus management with disabled elements

6. **Visual consistency check**:
   - Ensure disabled elements have consistent visual styling
   - Verify tooltip appearance matches design system
   - Check dark mode compatibility

---

## Summary

This implementation plan provides a comprehensive approach to managing plan statuses across all views in the 12 Weeks Planner application. The key principles are:

1. **Progressive Enhancement**: Start with container components and work down to child components
2. **Consistent Interface**: Use `planStatus` prop at container level, `isReadOnly` flag at child level
3. **Reuse Existing Props**: Leverage `disabled` props where they already exist
4. **User Feedback**: Always provide tooltips explaining why components are disabled
5. **Maintain UX**: Keep accordion expand/collapse functional in all states
6. **Type Safety**: Use TypeScript to ensure correct prop passing throughout the component tree

By following this plan, the application will correctly restrict user interactions based on plan status while maintaining a clear and intuitive user experience.
