-- migration: create row level security policies for all tables
-- purpose: implement granular access control ensuring users can only access their own data
-- affected tables: plans, long_term_goals, milestones, weekly_goals, tasks, task_history, weekly_reviews, user_metrics
-- considerations: policies are separated by operation (select, insert, update, delete) for clarity and maintainability

-- ============================================================================
-- rls policies for table: plans
-- rationale: users should only access their own planners
-- ============================================================================

-- policy: users can view their own plans
create policy "Users can view own plans"
on plans for select
using (auth.uid() = user_id);

-- policy: users can create their own plans
create policy "Users can create own plans"
on plans for insert
with check (auth.uid() = user_id);

-- policy: users can update their own plans
create policy "Users can update own plans"
on plans for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- policy: users can delete their own plans
create policy "Users can delete own plans"
on plans for delete
using (auth.uid() = user_id);

-- ============================================================================
-- rls policies for table: long_term_goals
-- rationale: users can only access goals from their own planners
-- ============================================================================

-- policy: users can view goals from their own plans
create policy "Users can view own goals"
on long_term_goals for select
using (
  exists (
    select 1 from plans
    where plans.id = long_term_goals.plan_id
    and plans.user_id = auth.uid()
  )
);

-- policy: users can create goals in their own plans
create policy "Users can create goals in own plans"
on long_term_goals for insert
with check (
  exists (
    select 1 from plans
    where plans.id = long_term_goals.plan_id
    and plans.user_id = auth.uid()
  )
);

-- policy: users can update goals in their own plans
create policy "Users can update own goals"
on long_term_goals for update
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

-- policy: users can delete goals from their own plans
create policy "Users can delete own goals"
on long_term_goals for delete
using (
  exists (
    select 1 from plans
    where plans.id = long_term_goals.plan_id
    and plans.user_id = auth.uid()
  )
);

-- ============================================================================
-- rls policies for table: milestones
-- rationale: users can only access milestones from their own goals
-- ============================================================================

-- policy: users can view milestones from their own goals
create policy "Users can view own milestones"
on milestones for select
using (
  exists (
    select 1 from long_term_goals
    join plans on plans.id = long_term_goals.plan_id
    where long_term_goals.id = milestones.long_term_goal_id
    and plans.user_id = auth.uid()
  )
);

-- policy: users can create milestones in their own goals
create policy "Users can create milestones in own goals"
on milestones for insert
with check (
  exists (
    select 1 from long_term_goals
    join plans on plans.id = long_term_goals.plan_id
    where long_term_goals.id = milestones.long_term_goal_id
    and plans.user_id = auth.uid()
  )
);

-- policy: users can update their own milestones
create policy "Users can update own milestones"
on milestones for update
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

-- policy: users can delete their own milestones
create policy "Users can delete own milestones"
on milestones for delete
using (
  exists (
    select 1 from long_term_goals
    join plans on plans.id = long_term_goals.plan_id
    where long_term_goals.id = milestones.long_term_goal_id
    and plans.user_id = auth.uid()
  )
);

-- ============================================================================
-- rls policies for table: weekly_goals
-- rationale: users can only access weekly goals from their own planners
-- ============================================================================

-- policy: users can view weekly goals from their own plans
create policy "Users can view own weekly goals"
on weekly_goals for select
using (
  exists (
    select 1 from plans
    where plans.id = weekly_goals.plan_id
    and plans.user_id = auth.uid()
  )
);

-- policy: users can create weekly goals in their own plans
create policy "Users can create weekly goals in own plans"
on weekly_goals for insert
with check (
  exists (
    select 1 from plans
    where plans.id = weekly_goals.plan_id
    and plans.user_id = auth.uid()
  )
);

-- policy: users can update their own weekly goals
create policy "Users can update own weekly goals"
on weekly_goals for update
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

-- policy: users can delete their own weekly goals
create policy "Users can delete own weekly goals"
on weekly_goals for delete
using (
  exists (
    select 1 from plans
    where plans.id = weekly_goals.plan_id
    and plans.user_id = auth.uid()
  )
);

-- ============================================================================
-- rls policies for table: tasks
-- rationale: users can only access tasks from their own planners
-- ============================================================================

-- policy: users can view tasks from their own plans
create policy "Users can view own tasks"
on tasks for select
using (
  exists (
    select 1 from plans
    where plans.id = tasks.plan_id
    and plans.user_id = auth.uid()
  )
);

-- policy: users can create tasks in their own plans
create policy "Users can create tasks in own plans"
on tasks for insert
with check (
  exists (
    select 1 from plans
    where plans.id = tasks.plan_id
    and plans.user_id = auth.uid()
  )
);

-- policy: users can update their own tasks
create policy "Users can update own tasks"
on tasks for update
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

-- policy: users can delete their own tasks
create policy "Users can delete own tasks"
on tasks for delete
using (
  exists (
    select 1 from plans
    where plans.id = tasks.plan_id
    and plans.user_id = auth.uid()
  )
);

-- ============================================================================
-- rls policies for table: task_history
-- rationale: users can only access history for their own tasks
-- note: no update/delete policies - history should not be modified manually
-- ============================================================================

-- policy: users can view history for their own tasks
create policy "Users can view own task history"
on task_history for select
using (
  exists (
    select 1 from tasks
    join plans on plans.id = tasks.plan_id
    where tasks.id = task_history.task_id
    and plans.user_id = auth.uid()
  )
);

-- policy: users can create history for their own tasks
create policy "Users can create task history for own tasks"
on task_history for insert
with check (
  exists (
    select 1 from tasks
    join plans on plans.id = tasks.plan_id
    where tasks.id = task_history.task_id
    and plans.user_id = auth.uid()
  )
);

-- ============================================================================
-- rls policies for table: weekly_reviews
-- rationale: users can only access reviews from their own planners
-- ============================================================================

-- policy: users can view reviews from their own plans
create policy "Users can view own weekly reviews"
on weekly_reviews for select
using (
  exists (
    select 1 from plans
    where plans.id = weekly_reviews.plan_id
    and plans.user_id = auth.uid()
  )
);

-- policy: users can create reviews in their own plans
create policy "Users can create weekly reviews in own plans"
on weekly_reviews for insert
with check (
  exists (
    select 1 from plans
    where plans.id = weekly_reviews.plan_id
    and plans.user_id = auth.uid()
  )
);

-- policy: users can update their own reviews (for auto-save functionality)
create policy "Users can update own weekly reviews"
on weekly_reviews for update
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

-- policy: users can delete their own reviews
create policy "Users can delete own weekly reviews"
on weekly_reviews for delete
using (
  exists (
    select 1 from plans
    where plans.id = weekly_reviews.plan_id
    and plans.user_id = auth.uid()
  )
);

-- ============================================================================
-- rls policies for table: user_metrics
-- rationale: users can only access their own metrics
-- ============================================================================

-- policy: users can view their own metrics
create policy "Users can view own metrics"
on user_metrics for select
using (auth.uid() = user_id);

-- policy: users can create their own metrics
create policy "Users can create own metrics"
on user_metrics for insert
with check (auth.uid() = user_id);

-- policy: users can update their own metrics
create policy "Users can update own metrics"
on user_metrics for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- policy: users can delete their own metrics
create policy "Users can delete own metrics"
on user_metrics for delete
using (auth.uid() = user_id);

