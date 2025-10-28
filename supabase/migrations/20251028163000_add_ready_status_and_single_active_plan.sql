-- migration: add 'ready' status to plans and enforce single active plan per user
-- purpose: update plans status constraint to include 'ready' state and ensure only one active plan per user
-- affected tables: plans
-- affected columns: plans.status
-- considerations: this migration updates existing constraints and adds business logic trigger
--                 existing data with 'active' status will remain valid
--                 the trigger ensures users can only have one active plan at a time

-- ============================================================================
-- step 1: drop existing check constraint on plans.status
-- description: remove old constraint that only allowed 'active', 'completed', 'archived'
-- rationale: need to add 'ready' status as a valid option
-- ============================================================================

alter table plans drop constraint if exists plans_status_check;

-- ============================================================================
-- step 2: add new check constraint with 'ready' status
-- description: create updated constraint that includes all four status values
-- rationale: aligns with db-plan specification - ready, active, completed, archived
-- ============================================================================

alter table plans add constraint plans_status_check 
  check (status in ('ready', 'active', 'completed', 'archived'));

comment on column plans.status is 'planner status: ready (default), active (only one per user), completed, or archived';

-- ============================================================================
-- step 3: change default status from 'active' to 'ready'
-- description: update default value for new plans to 'ready'
-- rationale: new plans should start in 'ready' state and be explicitly activated by user
-- note: this does not affect existing rows, only new inserts
-- ============================================================================

alter table plans alter column status set default 'ready';

-- ============================================================================
-- step 4: create trigger function to enforce single active plan
-- description: ensures user can only have one plan in 'active' status at a time
-- rationale: business rule - when a plan is activated, all other active plans 
--            for that user should be changed back to 'ready' status
-- behavior: 
--   - when a plan status is changed to 'active' (insert or update)
--   - all other plans for the same user with status='active' are set to 'ready'
--   - the newly activated plan remains 'active'
-- ============================================================================

create or replace function ensure_single_active_plan()
returns trigger as $$
begin
  -- check if plan is being changed to 'active'
  if new.status = 'active' and (tg_op = 'INSERT' or old.status is distinct from 'active') then
    -- change all other active plans for this user to 'ready'
    -- exclude the current plan being updated/inserted
    update plans
    set status = 'ready', updated_at = now()
    where user_id = new.user_id
    and id != new.id
    and status = 'active';
  end if;
  
  return new;
end;
$$ language plpgsql;

comment on function ensure_single_active_plan is 'ensures only one plan can be active per user at a time';

-- ============================================================================
-- step 5: create trigger on plans table
-- description: apply the ensure_single_active_plan function before insert/update
-- rationale: enforce single active plan rule at database level
-- timing: before insert or update - prevents invalid state from being committed
-- scope: triggers on status column changes
-- ============================================================================

create trigger enforce_single_active_plan
before insert or update of status on plans
for each row execute function ensure_single_active_plan();

comment on trigger enforce_single_active_plan on plans is 'enforces business rule: only one active plan per user';


