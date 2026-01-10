-- migration: update database limits and validation rules
-- purpose: align database triggers with updated business requirements for goal, task, and milestone limits
-- affected tables: long_term_goals, tasks, weekly_goals
-- considerations: 
--   - updates goal count limit from 5 to 6 per plan
--   - updates weekly subtask limit from 10 to 15 per weekly goal
--   - updates weekly ad-hoc task limit from 10 to 100 per week
--   - adds daily task limit of 10 tasks per day
--   - adds weekly goal limit of 3 goals per week
--   - these limits are enforced at the database level for data integrity

-- ============================================================================
-- step 1: update validate_goal_count_per_plan function
-- description: increase maximum goal count from 5 to 6 per planner
-- rationale: allows users more flexibility in planning their 12-week cycle
-- ============================================================================

create or replace function validate_goal_count_per_plan()
returns trigger as $$
declare
  goal_count integer;
begin
  -- count current goals for planner
  select count(*) into goal_count
  from long_term_goals
  where plan_id = new.plan_id;
  
  -- check maximum goal count (6)
  -- note: goal_count is the number of existing goals before this insert
  if (tg_op = 'insert') and goal_count >= 6 then
    raise exception 'cannot add more than 6 goals to a plan';
  end if;
  
  return new;
end;
$$ language plpgsql;

comment on function validate_goal_count_per_plan is 'validates maximum of 6 goals per planner';

-- ============================================================================
-- step 2: update validate_weekly_subtask_count function
-- description: increase maximum weekly subtasks from 10 to 15 per weekly goal
-- rationale: allows more detailed breakdown of complex weekly goals
-- ============================================================================

create or replace function validate_weekly_subtask_count()
returns trigger as $$
declare
  subtask_count integer;
begin
  -- count subtasks only if task_type = 'weekly_sub'
  if new.task_type = 'weekly_sub' and new.weekly_goal_id is not null then
    select count(*) into subtask_count
    from tasks
    where weekly_goal_id = new.weekly_goal_id
    and task_type = 'weekly_sub';
    
    -- check maximum subtask count (15)
    if (tg_op = 'insert') and subtask_count >= 15 then
      raise exception 'cannot add more than 15 subtasks to a weekly goal';
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql;

comment on function validate_weekly_subtask_count is 'validates maximum of 15 subtasks per weekly goal';

-- ============================================================================
-- step 3: update validate_ad_hoc_task_count function
-- description: increase maximum ad-hoc tasks from 10 to 100 per week
-- rationale: supports users with many smaller tasks or busy weeks
-- ============================================================================

create or replace function validate_ad_hoc_task_count()
returns trigger as $$
declare
  ad_hoc_count integer;
begin
  -- count ad-hoc tasks only if task_type = 'ad_hoc'
  if new.task_type = 'ad_hoc' and new.week_number is not null then
    select count(*) into ad_hoc_count
    from tasks
    where plan_id = new.plan_id
    and week_number = new.week_number
    and task_type = 'ad_hoc';
    
    -- check maximum ad-hoc task count (100)
    if (tg_op = 'insert') and ad_hoc_count >= 100 then
      raise exception 'cannot add more than 100 ad-hoc tasks per week';
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql;

comment on function validate_ad_hoc_task_count is 'validates maximum of 100 ad-hoc tasks per week';

-- ============================================================================
-- step 4: create validate_daily_task_count function
-- description: enforce maximum of 10 tasks per day
-- rationale: promotes focus and prevents daily over-scheduling
-- ============================================================================

create or replace function validate_daily_task_count()
returns trigger as $$
declare
  daily_count integer;
begin
  -- count tasks for a specific day
  if new.week_number is not null and new.due_day is not null then
    select count(*) into daily_count
    from tasks
    where plan_id = new.plan_id
    and week_number = new.week_number
    and due_day = new.due_day;
    
    -- check maximum daily task count (10)
    if (tg_op = 'insert') and daily_count >= 10 then
      raise exception 'cannot add more than 10 tasks per day';
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql;

comment on function validate_daily_task_count is 'validates maximum of 10 tasks per day';

-- apply daily task count validation trigger
drop trigger if exists check_daily_task_count on tasks;
create trigger check_daily_task_count
before insert on tasks
for each row execute function validate_daily_task_count();

comment on trigger check_daily_task_count on tasks is 'enforces business rule: max 10 tasks per day';

-- ============================================================================
-- step 5: create validate_weekly_goal_count function
-- description: enforce maximum of 3 weekly goals per week
-- rationale: encourages prioritization of key focus areas each week
-- ============================================================================

create or replace function validate_weekly_goal_count()
returns trigger as $$
declare
  wg_count integer;
begin
  -- count weekly goals for a specific week
  select count(*) into wg_count
  from weekly_goals
  where plan_id = new.plan_id
  and week_number = new.week_number;
  
  -- check maximum weekly goal count (3)
  if (tg_op = 'insert') and wg_count >= 3 then
    raise exception 'cannot add more than 3 weekly goals per week';
  end if;
  
  return new;
end;
$$ language plpgsql;

comment on function validate_weekly_goal_count is 'validates maximum of 3 weekly goals per week';

-- apply weekly goal count validation trigger
drop trigger if exists check_weekly_goal_count on weekly_goals;
create trigger check_weekly_goal_count
before insert on weekly_goals
for each row execute function validate_weekly_goal_count();

comment on trigger check_weekly_goal_count on weekly_goals is 'enforces business rule: max 3 weekly goals per week';
