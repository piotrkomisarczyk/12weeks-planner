-- migration: create indexes for performance optimization
-- purpose: add indexes to improve query performance for common access patterns
-- affected tables: all core tables
-- considerations: includes both simple and composite indexes, plus partial indexes for filtered queries

-- ============================================================================
-- indexes for table: plans
-- ============================================================================
create index idx_plans_user_id on plans(user_id);
create index idx_plans_status on plans(status);
create index idx_plans_start_date on plans(start_date);

-- partial index for active planners (common query pattern)
create index idx_plans_user_active on plans(user_id) where status = 'active';

comment on index idx_plans_user_id is 'fast lookup of plans by user';
comment on index idx_plans_status is 'fast filtering by planner status';
comment on index idx_plans_start_date is 'fast sorting/filtering by start date';
comment on index idx_plans_user_active is 'optimized query for active planners';

-- ============================================================================
-- indexes for table: long_term_goals
-- ============================================================================
create index idx_long_term_goals_plan_id on long_term_goals(plan_id);
create index idx_long_term_goals_position on long_term_goals(plan_id, position);

comment on index idx_long_term_goals_plan_id is 'fast lookup of goals by plan';
comment on index idx_long_term_goals_position is 'fast ordered retrieval of goals';

-- ============================================================================
-- indexes for table: milestones
-- ============================================================================
create index idx_milestones_long_term_goal_id on milestones(long_term_goal_id);
create index idx_milestones_position on milestones(long_term_goal_id, position);
create index idx_milestones_is_completed on milestones(is_completed);

-- partial index for incomplete milestones (common query pattern)
create index idx_milestones_incomplete on milestones(long_term_goal_id) where is_completed = false;

comment on index idx_milestones_long_term_goal_id is 'fast lookup of milestones by goal';
comment on index idx_milestones_position is 'fast ordered retrieval of milestones';
comment on index idx_milestones_is_completed is 'fast filtering by completion status';
comment on index idx_milestones_incomplete is 'optimized query for incomplete milestones';

-- ============================================================================
-- indexes for table: weekly_goals
-- ============================================================================
create index idx_weekly_goals_plan_id on weekly_goals(plan_id);
create index idx_weekly_goals_long_term_goal_id on weekly_goals(long_term_goal_id);
create index idx_weekly_goals_week_number on weekly_goals(plan_id, week_number);

-- composite index for common query pattern
create index idx_weekly_goals_plan_week on weekly_goals(plan_id, week_number);

comment on index idx_weekly_goals_plan_id is 'fast lookup of weekly goals by plan';
comment on index idx_weekly_goals_long_term_goal_id is 'fast lookup of weekly goals by long-term goal';
comment on index idx_weekly_goals_week_number is 'fast lookup of weekly goals by plan and week';
comment on index idx_weekly_goals_plan_week is 'optimized composite query for plan weekly views';

-- ============================================================================
-- indexes for table: tasks
-- ============================================================================
create index idx_tasks_weekly_goal_id on tasks(weekly_goal_id);
create index idx_tasks_plan_id on tasks(plan_id);
create index idx_tasks_milestone_id on tasks(milestone_id);
create index idx_tasks_week_number on tasks(plan_id, week_number);
create index idx_tasks_due_day on tasks(plan_id, week_number, due_day);
create index idx_tasks_status on tasks(status);
create index idx_tasks_priority on tasks(priority);
create index idx_tasks_task_type on tasks(task_type);

-- composite indexes for common query patterns
create index idx_tasks_plan_week_day on tasks(plan_id, week_number, due_day);
create index idx_tasks_week_status on tasks(plan_id, week_number, status);

-- partial index for pending tasks (common query pattern)
create index idx_tasks_pending on tasks(plan_id, week_number) 
  where status in ('todo', 'in_progress', 'postponed');

comment on index idx_tasks_weekly_goal_id is 'fast lookup of tasks by weekly goal';
comment on index idx_tasks_plan_id is 'fast lookup of tasks by plan (ad-hoc tasks)';
comment on index idx_tasks_milestone_id is 'fast lookup of tasks by milestone';
comment on index idx_tasks_week_number is 'fast lookup of tasks by plan and week';
comment on index idx_tasks_due_day is 'fast lookup of tasks by plan, week, and day';
comment on index idx_tasks_status is 'fast filtering by task status';
comment on index idx_tasks_priority is 'fast filtering by task priority';
comment on index idx_tasks_task_type is 'fast filtering by task type';
comment on index idx_tasks_plan_week_day is 'optimized composite query for daily task views';
comment on index idx_tasks_week_status is 'optimized composite query for weekly status views';
comment on index idx_tasks_pending is 'optimized query for pending tasks';

-- ============================================================================
-- indexes for table: task_history
-- ============================================================================
create index idx_task_history_task_id on task_history(task_id);
create index idx_task_history_changed_at on task_history(changed_at);

comment on index idx_task_history_task_id is 'fast lookup of history by task';
comment on index idx_task_history_changed_at is 'fast sorting by change timestamp';

-- ============================================================================
-- indexes for table: weekly_reviews
-- ============================================================================
create index idx_weekly_reviews_plan_id on weekly_reviews(plan_id);
create index idx_weekly_reviews_week_number on weekly_reviews(plan_id, week_number);
create index idx_weekly_reviews_is_completed on weekly_reviews(is_completed);

-- composite index for common query pattern
create index idx_weekly_reviews_plan_week on weekly_reviews(plan_id, week_number);

comment on index idx_weekly_reviews_plan_id is 'fast lookup of reviews by plan';
comment on index idx_weekly_reviews_week_number is 'fast lookup of reviews by plan and week';
comment on index idx_weekly_reviews_is_completed is 'fast filtering by completion status';
comment on index idx_weekly_reviews_plan_week is 'optimized composite query for weekly review views';

-- ============================================================================
-- indexes for table: user_metrics
-- ============================================================================
create index idx_user_metrics_user_id on user_metrics(user_id);

comment on index idx_user_metrics_user_id is 'fast lookup of metrics by user';

