-- migration: add missing foreign key references for flexible goal hierarchy
-- purpose: add long_term_goal_id to tasks and milestone_id to weekly_goals to support direct linking
-- affected tables: tasks, weekly_goals
-- affected columns: tasks.long_term_goal_id, weekly_goals.milestone_id
-- considerations: these optional references allow flexible hierarchical linking:
--                 - tasks can link directly to long-term goals or milestones
--                 - weekly goals can link directly to milestones
--                 - enables multi-level hierarchy tracking
--                 - all existing data remains valid (nullable columns)

-- ============================================================================
-- step 1: add long_term_goal_id column to tasks table
-- description: allow tasks to be directly linked to long-term goals
-- rationale: provides flexible hierarchy - tasks can be linked to goals 
--            directly without requiring weekly_goal as intermediary
-- behavior: nullable reference with on delete set null
-- ============================================================================

alter table tasks add column long_term_goal_id uuid 
  references long_term_goals(id) on delete set null;

comment on column tasks.long_term_goal_id is 'optional reference to long-term goal for direct linking';

-- ============================================================================
-- step 2: add milestone_id column to weekly_goals table
-- description: allow weekly goals to be directly linked to milestones
-- rationale: enables direct connection between weekly goals and specific 
--            milestone steps, providing better progress tracking
-- behavior: nullable reference with on delete set null
-- ============================================================================

alter table weekly_goals add column milestone_id uuid 
  references milestones(id) on delete set null;

comment on column weekly_goals.milestone_id is 'optional reference to milestone for direct linking';

-- ============================================================================
-- step 3: create indexes for new foreign key columns
-- description: add indexes to optimize queries using the new references
-- rationale: improves performance when filtering/joining by these columns
-- ============================================================================

-- index for tasks.long_term_goal_id
create index idx_tasks_long_term_goal_id on tasks(long_term_goal_id);

comment on index idx_tasks_long_term_goal_id is 'fast lookup of tasks by long-term goal';

-- index for weekly_goals.milestone_id
create index idx_weekly_goals_milestone_id on weekly_goals(milestone_id);

comment on index idx_weekly_goals_milestone_id is 'fast lookup of weekly goals by milestone';

-- ============================================================================
-- step 4: create composite partial indexes for hierarchical queries
-- description: add optimized indexes for common query patterns involving 
--              goal-milestone hierarchies
-- rationale: these partial indexes optimize queries that filter by both
--            long_term_goal_id and milestone_id, but only when at least
--            one of them is not null (avoiding indexing pure ad-hoc items)
-- ============================================================================

-- composite partial index for tasks with goal/milestone links
-- only indexes rows where at least one reference exists
create index idx_tasks_goal_milestone on tasks(long_term_goal_id, milestone_id) 
  where long_term_goal_id is not null or milestone_id is not null;

comment on index idx_tasks_goal_milestone is 'optimized query for tasks linked to goals or milestones';

-- composite partial index for weekly goals with goal/milestone links
-- only indexes rows where at least one reference exists
create index idx_weekly_goals_goal_milestone on weekly_goals(long_term_goal_id, milestone_id) 
  where long_term_goal_id is not null or milestone_id is not null;

comment on index idx_weekly_goals_goal_milestone is 'optimized query for weekly goals linked to goals or milestones';


