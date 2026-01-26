-- enable rls for plans table
alter table plans enable row level security;

-- enable rls for long_term_goals table
alter table long_term_goals enable row level security;

-- enable rls for milestones table
alter table milestones enable row level security;

-- enable rls for weekly_goals table
alter table weekly_goals enable row level security;

-- enable rls for tasks table
alter table tasks enable row level security;

-- enable rls for task_history table
alter table task_history enable row level security;

-- enable rls for weekly_reviews table
alter table weekly_reviews enable row level security;

-- enable rls for user_metrics table
alter table user_metrics enable row level security;