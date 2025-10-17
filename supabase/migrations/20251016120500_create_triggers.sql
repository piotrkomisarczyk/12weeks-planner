-- migration: create database triggers for automation and validation
-- purpose: implement automatic timestamp updates, logging, metrics tracking, and business rule validation
-- affected tables: all core tables
-- considerations: triggers enforce business rules at database level for data integrity

-- ============================================================================
-- trigger function: update_updated_at_column
-- purpose: automatically update updated_at timestamp on row modification
-- rationale: ensures consistent timestamp tracking without application-level code
-- ============================================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

comment on function update_updated_at_column is 'automatically updates updated_at timestamp on row modification';

-- apply updated_at trigger to all relevant tables
create trigger set_updated_at before update on plans
for each row execute function update_updated_at_column();

create trigger set_updated_at before update on long_term_goals
for each row execute function update_updated_at_column();

create trigger set_updated_at before update on milestones
for each row execute function update_updated_at_column();

create trigger set_updated_at before update on weekly_goals
for each row execute function update_updated_at_column();

create trigger set_updated_at before update on tasks
for each row execute function update_updated_at_column();

create trigger set_updated_at before update on weekly_reviews
for each row execute function update_updated_at_column();

create trigger set_updated_at before update on user_metrics
for each row execute function update_updated_at_column();

-- ============================================================================
-- trigger function: log_task_status_change
-- purpose: automatically log task status changes to task_history
-- rationale: maintains audit trail of task status changes for multi-day tasks
-- ============================================================================
create or replace function log_task_status_change()
returns trigger as $$
begin
  -- add entry to history only if status changed or on insert
  if (tg_op = 'INSERT') or (old.status is distinct from new.status) then
    insert into task_history (task_id, status, changed_at, due_day)
    values (new.id, new.status, now(), new.due_day);
  end if;
  return new;
end;
$$ language plpgsql;

comment on function log_task_status_change is 'logs task status changes to task_history table';

-- apply task status tracking trigger
create trigger track_task_status_changes
after insert or update of status on tasks
for each row execute function log_task_status_change();

-- ============================================================================
-- trigger function: update_user_metrics_on_plan_creation
-- purpose: update user metrics when planner is created
-- rationale: automatically tracks first planner creation and total planner count
-- ============================================================================
create or replace function update_user_metrics_on_plan_creation()
returns trigger as $$
begin
  -- insert or update user metrics
  insert into user_metrics (user_id, first_planner_created, total_plans_created)
  values (new.user_id, true, 1)
  on conflict (user_id) 
  do update set 
    total_plans_created = user_metrics.total_plans_created + 1,
    updated_at = now();
  
  return new;
end;
$$ language plpgsql;

comment on function update_user_metrics_on_plan_creation is 'updates user metrics when planner is created';

-- apply plan creation metrics trigger
create trigger update_metrics_on_plan_insert
after insert on plans
for each row execute function update_user_metrics_on_plan_creation();

-- ============================================================================
-- trigger function: update_user_metrics_on_goal_completion
-- purpose: update user metrics when goal reaches 100% completion
-- rationale: tracks first planner completion and total completed goals
-- ============================================================================
create or replace function update_user_metrics_on_goal_completion()
returns trigger as $$
declare
  plan_user_id uuid;
  first_plan_id uuid;
  has_completed_goal_in_first_plan boolean;
begin
  -- check if goal reached 100% progress
  if new.progress_percentage = 100 and (old.progress_percentage is null or old.progress_percentage < 100) then
    -- get user_id from planner
    select user_id into plan_user_id
    from plans
    where id = new.plan_id;
    
    -- update count of completed goals
    update user_metrics
    set 
      total_goals_completed = total_goals_completed + 1,
      updated_at = now()
    where user_id = plan_user_id;
    
    -- check if this is user's first planner
    select id into first_plan_id
    from plans
    where user_id = plan_user_id
    order by created_at asc
    limit 1;
    
    -- check if goal belongs to first planner
    if first_plan_id = new.plan_id then
      -- mark that user completed goal in first planner
      update user_metrics
      set 
        first_planner_completed = true,
        updated_at = now()
      where user_id = plan_user_id;
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql;

comment on function update_user_metrics_on_goal_completion is 'updates user metrics when goal reaches 100% completion';

-- apply goal completion metrics trigger
create trigger update_metrics_on_goal_complete
after insert or update of progress_percentage on long_term_goals
for each row execute function update_user_metrics_on_goal_completion();

-- ============================================================================
-- trigger function: validate_plan_start_date
-- purpose: ensure planner start date is always monday
-- rationale: enforces business rule that planners must start on monday
-- ============================================================================
create or replace function validate_plan_start_date()
returns trigger as $$
begin
  -- check if start_date is monday (1 = monday in iso)
  if extract(isodow from new.start_date) != 1 then
    raise exception 'Plan start_date must be a Monday';
  end if;
  return new;
end;
$$ language plpgsql;

comment on function validate_plan_start_date is 'validates that planner start date is monday';

-- apply plan start date validation trigger
create trigger check_plan_start_date
before insert or update of start_date on plans
for each row execute function validate_plan_start_date();

-- ============================================================================
-- trigger function: validate_goal_count_per_plan
-- purpose: ensure max 5 goals per planner
-- rationale: enforces business rule limiting goals to prevent overwhelming users
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
  
  -- check maximum goal count (5)
  if (tg_op = 'INSERT') and goal_count >= 5 then
    raise exception 'Cannot add more than 5 goals to a plan';
  end if;
  
  return new;
end;
$$ language plpgsql;

comment on function validate_goal_count_per_plan is 'validates maximum of 5 goals per planner';

-- apply goal count validation trigger
create trigger check_goal_count
before insert on long_term_goals
for each row execute function validate_goal_count_per_plan();

-- ============================================================================
-- trigger function: validate_milestone_count_per_goal
-- purpose: ensure max 5 milestones per goal
-- rationale: enforces business rule to keep milestones manageable
-- ============================================================================
create or replace function validate_milestone_count_per_goal()
returns trigger as $$
declare
  milestone_count integer;
begin
  -- count current milestones for goal
  select count(*) into milestone_count
  from milestones
  where long_term_goal_id = new.long_term_goal_id;
  
  -- check maximum milestone count (5)
  if (tg_op = 'INSERT') and milestone_count >= 5 then
    raise exception 'Cannot add more than 5 milestones to a goal';
  end if;
  
  return new;
end;
$$ language plpgsql;

comment on function validate_milestone_count_per_goal is 'validates maximum of 5 milestones per goal';

-- apply milestone count validation trigger
create trigger check_milestone_count
before insert on milestones
for each row execute function validate_milestone_count_per_goal();

-- ============================================================================
-- trigger function: validate_weekly_subtask_count
-- purpose: ensure max 10 subtasks per weekly goal
-- rationale: enforces business rule to keep weekly tasks manageable
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
    
    -- check maximum subtask count (10)
    if (tg_op = 'INSERT') and subtask_count >= 10 then
      raise exception 'Cannot add more than 10 subtasks to a weekly goal';
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql;

comment on function validate_weekly_subtask_count is 'validates maximum of 10 subtasks per weekly goal';

-- apply weekly subtask count validation trigger
create trigger check_weekly_subtask_count
before insert on tasks
for each row execute function validate_weekly_subtask_count();

-- ============================================================================
-- trigger function: validate_ad_hoc_task_count
-- purpose: ensure max 10 ad-hoc tasks per week
-- rationale: enforces business rule to prevent task overload
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
    
    -- check maximum ad-hoc task count (10)
    if (tg_op = 'INSERT') and ad_hoc_count >= 10 then
      raise exception 'Cannot add more than 10 ad-hoc tasks per week';
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql;

comment on function validate_ad_hoc_task_count is 'validates maximum of 10 ad-hoc tasks per week';

-- apply ad-hoc task count validation trigger
create trigger check_ad_hoc_task_count
before insert on tasks
for each row execute function validate_ad_hoc_task_count();

