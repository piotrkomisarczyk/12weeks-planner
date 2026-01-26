-- migration: re-enable row level security policies
-- purpose: restore rls policies for data isolation and security compliance
-- affected tables: plans, long_term_goals, milestones, weekly_goals, tasks, task_history, weekly_reviews, user_metrics
-- considerations: this migration restores the policies from 20251016120300_create_rls_policies.sql
-- note: rls was previously disabled in 20251016120600_disable_all_policies.sql

-- ============================================================================
-- re-create rls policies for table: plans
-- rationale: users should only access their own planners
-- security: direct user_id comparison ensures complete data isolation
-- ============================================================================

-- policy: allow authenticated users to view only their own plans
-- using clause: filters rows where the authenticated user's id matches the plan's user_id
create policy "Users can view own plans"
on plans for select
to authenticated
using (auth.uid() = user_id);

-- policy: allow authenticated users to create plans only for themselves
-- with check clause: ensures the user_id in new rows matches the authenticated user
create policy "Users can create own plans"
on plans for insert
to authenticated
with check (auth.uid() = user_id);

-- policy: allow authenticated users to update only their own plans
-- using clause: restricts updates to rows owned by the user
-- with check clause: prevents changing user_id to another user
create policy "Users can update own plans"
on plans for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- policy: allow authenticated users to delete only their own plans
-- using clause: restricts deletes to rows owned by the user
create policy "Users can delete own plans"
on plans for delete
to authenticated
using (auth.uid() = user_id);

-- ============================================================================
-- re-create rls policies for table: long_term_goals
-- rationale: users can only access goals from their own planners
-- security: verifies ownership through join with plans table
-- ============================================================================

-- policy: allow authenticated users to view goals from their own plans
-- using clause: exists subquery verifies the goal belongs to a plan owned by the user
create policy "Users can view own goals"
on long_term_goals for select
to authenticated
using (
  exists (
    select 1 from plans
    where plans.id = long_term_goals.plan_id
    and plans.user_id = auth.uid()
  )
);

-- policy: allow authenticated users to create goals in their own plans
-- with check clause: verifies the target plan is owned by the user
create policy "Users can create goals in own plans"
on long_term_goals for insert
to authenticated
with check (
  exists (
    select 1 from plans
    where plans.id = long_term_goals.plan_id
    and plans.user_id = auth.uid()
  )
);

-- policy: allow authenticated users to update goals in their own plans
-- using clause: restricts updates to goals in user's plans
-- with check clause: prevents moving goals to plans owned by other users
create policy "Users can update own goals"
on long_term_goals for update
to authenticated
using (
  exists (
    select 1 from plans
    where plans.id = long_term_goals.plan_id
    and plans.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from plans
    where plans.id = long_term_goals.plan_id
    and plans.user_id = auth.uid()
  )
);

-- policy: allow authenticated users to delete goals from their own plans
-- using clause: restricts deletes to goals in user's plans
create policy "Users can delete own goals"
on long_term_goals for delete
to authenticated
using (
  exists (
    select 1 from plans
    where plans.id = long_term_goals.plan_id
    and plans.user_id = auth.uid()
  )
);

-- ============================================================================
-- re-create rls policies for table: milestones
-- rationale: users can only access milestones from their own goals
-- security: verifies ownership through two-level join (milestones -> goals -> plans)
-- ============================================================================

-- policy: allow authenticated users to view milestones from their own goals
-- using clause: exists subquery with join verifies the milestone belongs to user's goal
create policy "Users can view own milestones"
on milestones for select
to authenticated
using (
  exists (
    select 1 from long_term_goals
    join plans on plans.id = long_term_goals.plan_id
    where long_term_goals.id = milestones.long_term_goal_id
    and plans.user_id = auth.uid()
  )
);

-- policy: allow authenticated users to create milestones in their own goals
-- with check clause: verifies the target goal belongs to user's plan
create policy "Users can create milestones in own goals"
on milestones for insert
to authenticated
with check (
  exists (
    select 1 from long_term_goals
    join plans on plans.id = long_term_goals.plan_id
    where long_term_goals.id = milestones.long_term_goal_id
    and plans.user_id = auth.uid()
  )
);

-- policy: allow authenticated users to update their own milestones
-- using clause: restricts updates to milestones in user's goals
-- with check clause: prevents moving milestones to goals owned by other users
create policy "Users can update own milestones"
on milestones for update
to authenticated
using (
  exists (
    select 1 from long_term_goals
    join plans on plans.id = long_term_goals.plan_id
    where long_term_goals.id = milestones.long_term_goal_id
    and plans.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from long_term_goals
    join plans on plans.id = long_term_goals.plan_id
    where long_term_goals.id = milestones.long_term_goal_id
    and plans.user_id = auth.uid()
  )
);

-- policy: allow authenticated users to delete their own milestones
-- using clause: restricts deletes to milestones in user's goals
create policy "Users can delete own milestones"
on milestones for delete
to authenticated
using (
  exists (
    select 1 from long_term_goals
    join plans on plans.id = long_term_goals.plan_id
    where long_term_goals.id = milestones.long_term_goal_id
    and plans.user_id = auth.uid()
  )
);

-- ============================================================================
-- re-create rls policies for table: weekly_goals
-- rationale: users can only access weekly goals from their own planners
-- security: verifies ownership through join with plans table
-- ============================================================================

-- policy: allow authenticated users to view weekly goals from their own plans
-- using clause: exists subquery verifies the weekly goal belongs to a plan owned by the user
create policy "Users can view own weekly goals"
on weekly_goals for select
to authenticated
using (
  exists (
    select 1 from plans
    where plans.id = weekly_goals.plan_id
    and plans.user_id = auth.uid()
  )
);

-- policy: allow authenticated users to create weekly goals in their own plans
-- with check clause: verifies the target plan is owned by the user
create policy "Users can create weekly goals in own plans"
on weekly_goals for insert
to authenticated
with check (
  exists (
    select 1 from plans
    where plans.id = weekly_goals.plan_id
    and plans.user_id = auth.uid()
  )
);

-- policy: allow authenticated users to update their own weekly goals
-- using clause: restricts updates to weekly goals in user's plans
-- with check clause: prevents moving weekly goals to plans owned by other users
create policy "Users can update own weekly goals"
on weekly_goals for update
to authenticated
using (
  exists (
    select 1 from plans
    where plans.id = weekly_goals.plan_id
    and plans.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from plans
    where plans.id = weekly_goals.plan_id
    and plans.user_id = auth.uid()
  )
);

-- policy: allow authenticated users to delete their own weekly goals
-- using clause: restricts deletes to weekly goals in user's plans
create policy "Users can delete own weekly goals"
on weekly_goals for delete
to authenticated
using (
  exists (
    select 1 from plans
    where plans.id = weekly_goals.plan_id
    and plans.user_id = auth.uid()
  )
);

-- ============================================================================
-- re-create rls policies for table: tasks
-- rationale: users can only access tasks from their own planners
-- security: verifies ownership through join with plans table
-- note: covers both weekly tasks and ad-hoc tasks (all tasks have plan_id)
-- ============================================================================

-- policy: allow authenticated users to view tasks from their own plans
-- using clause: exists subquery verifies the task belongs to a plan owned by the user
create policy "Users can view own tasks"
on tasks for select
to authenticated
using (
  exists (
    select 1 from plans
    where plans.id = tasks.plan_id
    and plans.user_id = auth.uid()
  )
);

-- policy: allow authenticated users to create tasks in their own plans
-- with check clause: verifies the target plan is owned by the user
create policy "Users can create tasks in own plans"
on tasks for insert
to authenticated
with check (
  exists (
    select 1 from plans
    where plans.id = tasks.plan_id
    and plans.user_id = auth.uid()
  )
);

-- policy: allow authenticated users to update their own tasks
-- using clause: restricts updates to tasks in user's plans
-- with check clause: prevents moving tasks to plans owned by other users
create policy "Users can update own tasks"
on tasks for update
to authenticated
using (
  exists (
    select 1 from plans
    where plans.id = tasks.plan_id
    and plans.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from plans
    where plans.id = tasks.plan_id
    and plans.user_id = auth.uid()
  )
);

-- policy: allow authenticated users to delete their own tasks
-- using clause: restricts deletes to tasks in user's plans
create policy "Users can delete own tasks"
on tasks for delete
to authenticated
using (
  exists (
    select 1 from plans
    where plans.id = tasks.plan_id
    and plans.user_id = auth.uid()
  )
);

-- ============================================================================
-- re-create rls policies for table: task_history
-- rationale: users can only access history for their own tasks
-- security: verifies ownership through two-level join (task_history -> tasks -> plans)
-- note: no update/delete policies - history should not be modified manually (immutable audit log)
-- ============================================================================

-- policy: allow authenticated users to view history for their own tasks
-- using clause: exists subquery with join verifies the history entry belongs to user's task
create policy "Users can view own task history"
on task_history for select
to authenticated
using (
  exists (
    select 1 from tasks
    join plans on plans.id = tasks.plan_id
    where tasks.id = task_history.task_id
    and plans.user_id = auth.uid()
  )
);

-- policy: allow authenticated users to create history for their own tasks
-- with check clause: verifies the target task belongs to user's plan
-- note: this policy is used by triggers that automatically log task status changes
create policy "Users can create task history for own tasks"
on task_history for insert
to authenticated
with check (
  exists (
    select 1 from tasks
    join plans on plans.id = tasks.plan_id
    where tasks.id = task_history.task_id
    and plans.user_id = auth.uid()
  )
);

-- ============================================================================
-- re-create rls policies for table: weekly_reviews
-- rationale: users can only access reviews from their own planners
-- security: verifies ownership through join with plans table
-- note: supports auto-save functionality through update policy
-- ============================================================================

-- policy: allow authenticated users to view reviews from their own plans
-- using clause: exists subquery verifies the review belongs to a plan owned by the user
create policy "Users can view own weekly reviews"
on weekly_reviews for select
to authenticated
using (
  exists (
    select 1 from plans
    where plans.id = weekly_reviews.plan_id
    and plans.user_id = auth.uid()
  )
);

-- policy: allow authenticated users to create reviews in their own plans
-- with check clause: verifies the target plan is owned by the user
create policy "Users can create weekly reviews in own plans"
on weekly_reviews for insert
to authenticated
with check (
  exists (
    select 1 from plans
    where plans.id = weekly_reviews.plan_id
    and plans.user_id = auth.uid()
  )
);

-- policy: allow authenticated users to update their own reviews (for auto-save functionality)
-- using clause: restricts updates to reviews in user's plans
-- with check clause: prevents moving reviews to plans owned by other users
-- note: this policy enables the auto-save feature for weekly reviews
create policy "Users can update own weekly reviews"
on weekly_reviews for update
to authenticated
using (
  exists (
    select 1 from plans
    where plans.id = weekly_reviews.plan_id
    and plans.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from plans
    where plans.id = weekly_reviews.plan_id
    and plans.user_id = auth.uid()
  )
);

-- policy: allow authenticated users to delete their own reviews
-- using clause: restricts deletes to reviews in user's plans
create policy "Users can delete own weekly reviews"
on weekly_reviews for delete
to authenticated
using (
  exists (
    select 1 from plans
    where plans.id = weekly_reviews.plan_id
    and plans.user_id = auth.uid()
  )
);

-- ============================================================================
-- re-create rls policies for table: user_metrics
-- rationale: users can only access their own metrics
-- security: direct user_id comparison ensures complete data isolation
-- note: metrics are automatically updated by database triggers
-- ============================================================================

-- policy: allow authenticated users to view their own metrics
-- using clause: filters rows where the authenticated user's id matches the metrics' user_id
create policy "Users can view own metrics"
on user_metrics for select
to authenticated
using (auth.uid() = user_id);

-- policy: allow authenticated users to create their own metrics
-- with check clause: ensures the user_id in new rows matches the authenticated user
-- note: typically created automatically by trigger on first plan creation
create policy "Users can create own metrics"
on user_metrics for insert
to authenticated
with check (auth.uid() = user_id);

-- policy: allow authenticated users to update their own metrics
-- using clause: restricts updates to rows owned by the user
-- with check clause: prevents changing user_id to another user
-- note: typically updated automatically by triggers
create policy "Users can update own metrics"
on user_metrics for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- policy: allow authenticated users to delete their own metrics
-- using clause: restricts deletes to rows owned by the user
-- note: deletion typically happens only when user account is deleted (cascade)
create policy "Users can delete own metrics"
on user_metrics for delete
to authenticated
using (auth.uid() = user_id);

-- ============================================================================
-- verification queries (run manually after migration to verify)
-- ============================================================================

-- verify rls is enabled on all tables
-- expected: all tables should have rowsecurity = true
-- select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;

-- verify all policies are created
-- expected: 4 policies per table (select, insert, update, delete), except task_history (2 policies)
-- select schemaname, tablename, policyname, permissive, roles, cmd
-- from pg_policies
-- where schemaname = 'public'
-- order by tablename, policyname;

-- verify policy count per table
-- expected: plans=4, long_term_goals=4, milestones=4, weekly_goals=4, tasks=4, task_history=2, weekly_reviews=4, user_metrics=4
-- select tablename, count(*) as policy_count
-- from pg_policies
-- where schemaname = 'public'
-- group by tablename
-- order by tablename;
