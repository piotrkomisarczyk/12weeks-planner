# Edit Plan View Implementation Plan

## 1. Overview
The Edit Plan View is a dedicated page that allows users to modify an existing 12-week plan. It employs a wizard-like interface to guide the user through updating the plan's metadata (Name) and managing its associated Long-Term Goals (1-6 goals). Unlike the creation wizard, the start date is read-only.

## 2. View Routing
*   **Path:** `/plans/[id]/edit`
*   **Access:** Linked via an "Edit" action in the Plan Card's context menu.

## 3. Component Structure
```mermaid
graph TD
    Page[src/pages/plans/[id]/edit.astro] --> EditPlanView[src/components/plans/edit/EditPlanView.tsx]
    EditPlanView --> LoadingState[Loading / Error States]
    EditPlanView --> WizardStepper[Wizard Progress Indicator]
    EditPlanView --> Step1[PlanDetailsStep.tsx]
    Step1 --> PlanNameInput[Input (Name)]
    Step1 --> PlanDateInput[Input (Start Date - ReadOnly)]
    EditPlanView --> Step2[GoalsStep.tsx]
    Step2 --> GoalList[List of GoalItems]
    Step2 --> GoalFormDialog[Dialog for Add/Edit Goal]
    EditPlanView --> WizardControls[Navigation Buttons (Back, Next/Finish)]
```

## 4. Component Details

### `EditPlanView` (Container)
- **Description:** Main container component. Handles data fetching (Plan + Goals), wizard state (current step), and orchestrates the update logic.
- **Main elements:**
    - `WizardStepper`: Visual indicator of current step.
    - Conditional rendering of `PlanDetailsStep` or `GoalsStep`.
    - Navigation controls (Back to Plans, Next, Finish).
- **Handled interactions:**
    - Fetching initial data on mount.
    - Transitions between steps.
    - Redirecting to `/plans/[id]` upon completion.
- **Handled validation:** None directly (delegated to steps).
- **Types:** `PlanDTO`, `GoalDTO`.
- **Props:**
    - `planId`: string

### `PlanDetailsStep`
- **Description:** Form to edit plan name and view start date.
- **Main elements:**
    - `Label` & `Input` for Name.
    - `Label` & `Input` (type="date") for Start Date (disabled/read-only).
- **Handled interactions:**
    - Input changes for Name.
- **Handled validation:**
    - Name: Required, max 255 chars.
- **Types:** `PlanDTO` (partial).
- **Props:**
    - `name`: string
    - `startDate`: string
    - `onNameChange`: (val: string) => void
    - `errors`: Record<string, string>

### `GoalsStep`
- **Description:** List view of existing goals with management capabilities.
- **Main elements:**
    - List of goals (displaying title, category, progress).
    - "Add Goal" button (disabled if 6 goals exist).
    - Edit/Delete actions per goal.
    - `GoalFormDialog`: A reused or internal dialog to input goal details.
- **Handled interactions:**
    - Opening Goal Dialog (Create mode).
    - Opening Goal Dialog (Edit mode).
    - Deleting a goal (with confirmation).
- **Handled validation:**
    - Max 6 goals per plan.
    - Min 1 goal required (warning/block on finish).
- **Types:** `GoalDTO`, `CreateGoalCommand`, `UpdateGoalCommand`.
- **Props:**
    - `goals`: GoalDTO[]
    - `onAddGoal`: (goal: CreateGoalCommand) => Promise<void>
    - `onUpdateGoal`: (id: string, goal: UpdateGoalCommand) => Promise<void>
    - `onDeleteGoal`: (id: string) => Promise<void>

## 5. Types
No new global types are strictly required if `src/types.ts` is up to date, but the following local state interfaces are needed:

```typescript
interface EditPlanState {
  step: 1 | 2;
  plan: PlanDTO | null;
  goals: GoalDTO[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  formErrors: Record<string, string>;
}
```

## 6. State Management
A custom hook `useEditPlan(planId: string)` will manage the logic:
- **State:**
    - `plan`: Stores fetched plan data.
    - `goals`: Stores list of fetched goals.
    - `step`: Current wizard step (1 or 2).
    - `isLoading`: Fetching status.
    - `isSaving`: Mutation status.
- **Operations:**
    - `fetchData()`: Loads plan and goals.
    - `updatePlanDetails(name: string)`: Calls `PATCH /plans/:id`.
    - `addGoal(data)`: Calls `POST /goals`.
    - `updateGoal(id, data)`: Calls `PATCH /goals/:id`.
    - `deleteGoal(id)`: Calls `DELETE /goals/:id`.

## 7. API Integration
The view integrates with the following endpoints (using `src/lib/services/api-client.ts` patterns):

- **Get Plan:** `GET /api/v1/plans/[id]`
    - Returns: `{ data: PlanDTO }`
- **Get Goals:** `GET /api/v1/goals?plan_id=[id]`
    - Returns: `{ data: GoalDTO[] }`
- **Update Plan:** `PATCH /api/v1/plans/[id]`
    - Request: `UpdatePlanCommand` ({ name: string })
    - Returns: `{ data: PlanDTO }`
- **Create Goal:** `POST /api/v1/goals`
    - Request: `CreateGoalCommand`
    - Returns: `{ data: GoalDTO }`
- **Update Goal:** `PATCH /api/v1/goals/[id]`
    - Request: `UpdateGoalCommand`
    - Returns: `{ data: GoalDTO }`
- **Delete Goal:** `DELETE /api/v1/goals/[id]`
    - Returns: Success message.

## 8. User Interactions
1. **Opening View:** User clicks "Edit" on a Plan Card.
2. **Step 1 (Details):**
    - User modifies the Plan Name.
    - Start Date is visible but disabled.
    - User clicks "Next".
    - System validates and saves the plan name via API.
    - On success, proceeds to Step 2.
3. **Step 2 (Goals):**
    - User sees current goals.
    - **Add:** User clicks "Add Goal" -> Dialog opens -> Fills info -> "Save" -> API call -> List refreshes.
    - **Edit:** User clicks Edit icon -> Dialog opens -> Updates info -> "Save" -> API call -> List refreshes.
    - **Delete:** User clicks Delete icon -> Confirms -> API call -> List refreshes.
    - **Finish:** User clicks "Finish" -> Redirects to Dashboard.

## 9. Conditions and Validation
- **Plan Name:** Required, max 255 characters.
- **Start Date:** Immutable in Edit mode.
- **Goal Count:**
    - Max 6 goals (Add button disabled).
    - Min 1 goal (Validation warning if user tries to finish with 0 goals).
- **Goal Fields:** Title is required.

## 10. Error Handling
- **Load Errors:** Display a user-friendly error message with a "Retry" button if plan or goals fail to load.
- **Save Errors:**
    - Step 1: Display toast error if plan update fails; stay on Step 1.
    - Step 2: Display toast error if goal operations fail; keep dialog open (for forms) or revert list state.
- **404:** If plan not found, redirect to Plans list or show 404 state.

## 11. Implementation Steps
1. **Route Setup:**
   - Create `src/pages/plans/[id]/edit.astro`.
   - Implement server-side ID retrieval and layout wrapping.

2. **Data Layer:**
   - Create `src/components/plans/edit/hooks/useEditPlan.ts`.
   - Implement `fetchPlan`, `fetchGoals`, and mutation functions.

3. **UI Components:**
   - Create `PlanDetailsStep.tsx` (reusing UI components).
   - Create `GoalsStep.tsx` (reusing/adapting `GoalInputList` or creating similar list with Edit/Delete support).
   - Update `GoalFormDialog` (or equivalent) to support "Edit" mode (pre-filling data).

4. **Main View:**
   - Create `src/components/plans/edit/EditPlanView.tsx`.
   - Assemble stepper, steps, and navigation logic.

5. **Entry Point:**
   - Update `src/components/plans/PlanCard.tsx` to include the "Edit" menu item linking to the new route.
