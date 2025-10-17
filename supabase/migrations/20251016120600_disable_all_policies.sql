-- migration: disable all row level security policies and RLS
-- purpose: remove all RLS policies from all tables and disable RLS entirely
-- affected tables: plans, long_term_goals, milestones, weekly_goals, tasks, task_history, weekly_reviews, user_metrics
-- note: this completely disables RLS - all authenticated users will have full access to all data

-- ============================================================================
-- drop all policies for table: plans
-- ============================================================================

drop policy if exists "Users can view own plans" on plans;
drop policy if exists "Users can create own plans" on plans;
drop policy if exists "Users can update own plans" on plans;
drop policy if exists "Users can delete own plans" on plans;

-- ============================================================================
-- drop all policies for table: long_term_goals
-- ============================================================================

drop policy if exists "Users can view own goals" on long_term_goals;
drop policy if exists "Users can create goals in own plans" on long_term_goals;
drop policy if exists "Users can update own goals" on long_term_goals;
drop policy if exists "Users can delete own goals" on long_term_goals;

-- ============================================================================
-- drop all policies for table: milestones
-- ============================================================================

drop policy if exists "Users can view own milestones" on milestones;
drop policy if exists "Users can create milestones in own goals" on milestones;
drop policy if exists "Users can update own milestones" on milestones;
drop policy if exists "Users can delete own milestones" on milestones;

-- ============================================================================
-- drop all policies for table: weekly_goals
-- ============================================================================

drop policy if exists "Users can view own weekly goals" on weekly_goals;
drop policy if exists "Users can create weekly goals in own plans" on weekly_goals;
drop policy if exists "Users can update own weekly goals" on weekly_goals;
drop policy if exists "Users can delete own weekly goals" on weekly_goals;

-- ============================================================================
-- drop all policies for table: tasks
-- ============================================================================

drop policy if exists "Users can view own tasks" on tasks;
drop policy if exists "Users can create tasks in own plans" on tasks;
drop policy if exists "Users can update own tasks" on tasks;
drop policy if exists "Users can delete own tasks" on tasks;

-- ============================================================================
-- drop all policies for table: task_history
-- ============================================================================

drop policy if exists "Users can view own task history" on task_history;
drop policy if exists "Users can create task history for own tasks" on task_history;

-- ============================================================================
-- drop all policies for table: weekly_reviews
-- ============================================================================

drop policy if exists "Users can view own weekly reviews" on weekly_reviews;
drop policy if exists "Users can create weekly reviews in own plans" on weekly_reviews;
drop policy if exists "Users can update own weekly reviews" on weekly_reviews;
drop policy if exists "Users can delete own weekly reviews" on weekly_reviews;

-- ============================================================================
-- drop all policies for table: user_metrics
-- ============================================================================

drop policy if exists "Users can view own metrics" on user_metrics;
drop policy if exists "Users can create own metrics" on user_metrics;
drop policy if exists "Users can update own metrics" on user_metrics;
drop policy if exists "Users can delete own metrics" on user_metrics;

-- ============================================================================
-- disable row level security on all tables
-- ============================================================================

alter table plans disable row level security;
alter table long_term_goals disable row level security;
alter table milestones disable row level security;
alter table weekly_goals disable row level security;
alter table tasks disable row level security;
alter table task_history disable row level security;
alter table weekly_reviews disable row level security;
alter table user_metrics disable row level security;

