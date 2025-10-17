-- migration: create database views for common queries and aggregations
-- purpose: simplify complex queries and provide convenient access to calculated data
-- affected tables: plans, long_term_goals, milestones, tasks, weekly_reviews
-- considerations: views are dynamically calculated - no materialized views for mvp to ensure data consistency

-- ============================================================================
-- view: plan_progress
-- purpose: calculate planner progress based on long-term goals
-- rationale: provides quick overview of planner completion status
-- ============================================================================
create or replace view plan_progress as
select 
  p.id as plan_id,
  p.user_id,
  p.name as plan_name,
  p.start_date,
  p.status,
  count(distinct ltg.id) as total_goals,
  coalesce(avg(ltg.progress_percentage), 0) as average_progress,
  count(distinct case when ltg.progress_percentage = 100 then ltg.id end) as completed_goals
from plans p
left join long_term_goals ltg on p.id = ltg.plan_id
group by p.id, p.user_id, p.name, p.start_date, p.status;

comment on view plan_progress is 'dynamically calculates planner progress based on long-term goals';

-- ============================================================================
-- view: weekly_task_summary
-- purpose: summarize tasks for each week in planner
-- rationale: provides weekly completion statistics for progress tracking
-- ============================================================================
create or replace view weekly_task_summary as
select 
  p.id as plan_id,
  p.user_id,
  t.week_number,
  count(t.id) as total_tasks,
  count(case when t.status = 'completed' then 1 end) as completed_tasks,
  count(case when t.status = 'cancelled' then 1 end) as cancelled_tasks,
  count(case when t.status = 'postponed' then 1 end) as postponed_tasks,
  count(case when t.status in ('todo', 'in_progress') then 1 end) as pending_tasks,
  case 
    when count(t.id) > 0 then 
      round((count(case when t.status = 'completed' then 1 end)::numeric / count(t.id)) * 100, 2)
    else 0 
  end as completion_percentage
from plans p
left join tasks t on p.id = t.plan_id
where t.week_number is not null
group by p.id, p.user_id, t.week_number;

comment on view weekly_task_summary is 'summarizes task completion statistics for each week in planner';

-- ============================================================================
-- view: daily_task_summary
-- purpose: summarize tasks for each day in the week
-- rationale: provides daily task breakdown with priority information
-- ============================================================================
create or replace view daily_task_summary as
select 
  p.id as plan_id,
  p.user_id,
  t.week_number,
  t.due_day,
  count(t.id) as total_tasks,
  count(case when t.status = 'completed' then 1 end) as completed_tasks,
  count(case when t.priority = 'A' then 1 end) as priority_a_tasks,
  count(case when t.priority = 'B' then 1 end) as priority_b_tasks,
  count(case when t.priority = 'C' then 1 end) as priority_c_tasks
from plans p
left join tasks t on p.id = t.plan_id
where t.due_day is not null
group by p.id, p.user_id, t.week_number, t.due_day;

comment on view daily_task_summary is 'summarizes tasks by day with priority breakdown';

-- ============================================================================
-- view: milestone_progress
-- purpose: calculate milestone completion for each long-term goal
-- rationale: shows progress towards goal completion via milestones
-- ============================================================================
create or replace view milestone_progress as
select 
  ltg.id as goal_id,
  ltg.plan_id,
  ltg.title as goal_title,
  count(m.id) as total_milestones,
  count(case when m.is_completed = true then 1 end) as completed_milestones,
  case 
    when count(m.id) > 0 then 
      round((count(case when m.is_completed = true then 1 end)::numeric / count(m.id)) * 100, 2)
    else 0 
  end as completion_percentage
from long_term_goals ltg
left join milestones m on ltg.id = m.long_term_goal_id
group by ltg.id, ltg.plan_id, ltg.title;

comment on view milestone_progress is 'calculates milestone completion percentage for each long-term goal';

-- ============================================================================
-- view: weekly_review_completion
-- purpose: check which weeks have completed reviews
-- rationale: helps track which weeks need review completion
-- ============================================================================
create or replace view weekly_review_completion as
select 
  p.id as plan_id,
  p.user_id,
  wr.week_number,
  wr.is_completed,
  case 
    when wr.what_worked is not null 
      and wr.what_did_not_work is not null 
      and wr.what_to_improve is not null 
    then true 
    else false 
  end as all_questions_answered
from plans p
left join weekly_reviews wr on p.id = wr.plan_id
order by p.id, wr.week_number;

comment on view weekly_review_completion is 'tracks completion status of weekly reviews';

