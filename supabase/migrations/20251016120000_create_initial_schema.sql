-- migration: create initial schema for 12 weeks planner
-- purpose: create all core tables with proper constraints and relationships
-- affected tables: plans, long_term_goals, milestones, weekly_goals, tasks, task_history, weekly_reviews, user_metrics
-- considerations: this is the foundational schema - all tables use uuid for primary keys and include created_at/updated_at timestamps

-- note: using gen_random_uuid() which is built into postgresql 13+ (no extension needed)

-- ============================================================================
-- table: plans
-- description: central table storing 12-week planners for users
-- ============================================================================
create table plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  start_date date not null,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table plans is 'stores 12-week planners for users';
comment on column plans.user_id is 'owner of the planner';
comment on column plans.name is 'planner name (default: "Planner_<start_date>")';
comment on column plans.start_date is 'planner start date (always monday)';
comment on column plans.status is 'planner status: active, completed, or archived';

-- ============================================================================
-- table: long_term_goals
-- description: stores long-term goals (3-5 goals per planner)
-- ============================================================================
create table long_term_goals (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans(id) on delete cascade,
  title text not null,
  description text,
  category text check (category in ('work', 'finance', 'hobby', 'relationships', 'health', 'development')),
  progress_percentage integer not null default 0 check (progress_percentage >= 0 and progress_percentage <= 100),
  position integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table long_term_goals is 'stores long-term goals (3-5 per planner)';
comment on column long_term_goals.plan_id is 'reference to parent planner';
comment on column long_term_goals.description is 'justification - why this goal is important';
comment on column long_term_goals.category is 'goal category: work, finance, hobby, relationships, health, development';
comment on column long_term_goals.progress_percentage is 'manual goal progress (0-100%)';
comment on column long_term_goals.position is 'display order of goals (1-5)';

-- ============================================================================
-- table: milestones
-- description: stores milestones (up to 5 per long-term goal)
-- ============================================================================
create table milestones (
  id uuid primary key default gen_random_uuid(),
  long_term_goal_id uuid not null references long_term_goals(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  is_completed boolean not null default false,
  position integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table milestones is 'stores milestones (up to 5 per long-term goal)';
comment on column milestones.long_term_goal_id is 'reference to parent long-term goal';
comment on column milestones.due_date is 'milestone deadline';
comment on column milestones.is_completed is 'completion status';
comment on column milestones.position is 'step order within goal (1-5)';

-- ============================================================================
-- table: weekly_goals
-- description: stores weekly goals (main task for the week)
-- ============================================================================
create table weekly_goals (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans(id) on delete cascade,
  long_term_goal_id uuid references long_term_goals(id) on delete set null,
  week_number integer not null check (week_number >= 1 and week_number <= 12),
  title text not null,
  description text,
  position integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table weekly_goals is 'stores weekly goals (main task for the week)';
comment on column weekly_goals.plan_id is 'reference to parent planner';
comment on column weekly_goals.long_term_goal_id is 'optional reference to long-term goal';
comment on column weekly_goals.week_number is 'week number within planner (1-12)';
comment on column weekly_goals.title is 'main task for the week';
comment on column weekly_goals.position is 'display order of task';

-- ============================================================================
-- table: tasks
-- description: stores tasks (can be linked to weekly goals or ad-hoc)
-- ============================================================================
create table tasks (
  id uuid primary key default gen_random_uuid(),
  weekly_goal_id uuid references weekly_goals(id) on delete cascade,
  plan_id uuid not null references plans(id) on delete cascade,
  milestone_id uuid references milestones(id) on delete set null,
  title text not null,
  description text,
  priority text not null default 'C' check (priority in ('A', 'B', 'C')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'completed', 'cancelled', 'postponed')),
  task_type text not null default 'weekly' check (task_type in ('weekly_main', 'weekly_sub', 'ad_hoc')),
  week_number integer check (week_number >= 1 and week_number <= 12),
  due_day integer check (due_day >= 1 and due_day <= 7),
  position integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table tasks is 'stores tasks linked to weekly goals or ad-hoc tasks';
comment on column tasks.weekly_goal_id is 'reference to weekly goal (null for ad-hoc)';
comment on column tasks.plan_id is 'reference to planner (for ad-hoc tasks)';
comment on column tasks.milestone_id is 'optional reference to milestone';
comment on column tasks.priority is 'task priority (a-highest, b, c)';
comment on column tasks.status is 'task status: todo, in_progress, completed, cancelled, postponed';
comment on column tasks.task_type is 'task type: weekly_main, weekly_sub, ad_hoc';
comment on column tasks.week_number is 'week number (for weekly tasks)';
comment on column tasks.due_day is 'day of week (1-7, where 1=monday)';
comment on column tasks.position is 'task order in list';

-- ============================================================================
-- table: task_history
-- description: stores task status change history (for multi-day tasks)
-- ============================================================================
create table task_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  status text not null check (status in ('todo', 'in_progress', 'completed', 'cancelled', 'postponed')),
  changed_at timestamptz not null default now(),
  due_day integer check (due_day >= 1 and due_day <= 7)
);

comment on table task_history is 'stores task status change history';
comment on column task_history.task_id is 'reference to parent task';
comment on column task_history.status is 'task status at this point in time';
comment on column task_history.changed_at is 'timestamp of status change';
comment on column task_history.due_day is 'day of week when task was in this status';

-- ============================================================================
-- table: weekly_reviews
-- description: stores weekly summaries (3 questions)
-- ============================================================================
create table weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans(id) on delete cascade,
  week_number integer not null check (week_number >= 1 and week_number <= 12),
  what_worked text,
  what_did_not_work text,
  what_to_improve text,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table weekly_reviews is 'stores weekly summaries (3 questions)';
comment on column weekly_reviews.plan_id is 'reference to parent planner';
comment on column weekly_reviews.week_number is 'week number (1-12)';
comment on column weekly_reviews.what_worked is 'answer to "what worked?"';
comment on column weekly_reviews.what_did_not_work is 'answer to "what did not work?"';
comment on column weekly_reviews.what_to_improve is 'answer to "what can i improve?"';
comment on column weekly_reviews.is_completed is 'whether summary is filled out';

-- ============================================================================
-- table: user_metrics
-- description: stores user metrics (for tracking mvp success)
-- ============================================================================
create table user_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  first_planner_created boolean not null default false,
  first_planner_completed boolean not null default false,
  total_plans_created integer not null default 0,
  total_goals_completed integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_user_metrics unique (user_id)
);

comment on table user_metrics is 'stores user metrics for tracking mvp success';
comment on column user_metrics.user_id is 'reference to user';
comment on column user_metrics.first_planner_created is 'whether user created first planner';
comment on column user_metrics.first_planner_completed is 'whether user completed first planner (min. 1 goal at 100%)';
comment on column user_metrics.total_plans_created is 'number of planners created';
comment on column user_metrics.total_goals_completed is 'number of completed goals (100% progress)';

