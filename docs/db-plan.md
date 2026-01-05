# Database Schema - 12 Weeks Planner

## 1. Tables

### 1.1. plans
Centralna tabela przechowująca 12-tygodniowe planery użytkowników.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator planera |
| user_id | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Właściciel planera |
| name | TEXT | NOT NULL | Nazwa planera (domyślnie: "Planner_<data_startu>") |
| start_date | DATE | NOT NULL | Data rozpoczęcia planera (zawsze poniedziałek) |
| status | TEXT | NOT NULL, DEFAULT 'ready', CHECK (status IN ('ready', 'active', 'completed', 'archived')) | Status planera |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data utworzenia |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data ostatniej modyfikacji |

**Indeksy:**
- `idx_plans_user_id` ON (user_id)
- `idx_plans_status` ON (status)
- `idx_plans_start_date` ON (start_date)

---

### 1.2. long_term_goals
Tabela przechowująca cele długoterminowe (3-5 celów na planer).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator celu |
| plan_id | UUID | NOT NULL, REFERENCES plans(id) ON DELETE CASCADE | Powiązanie z planerem |
| title | TEXT | NOT NULL | Tytuł celu |
| description | TEXT | NULL | Uzasadnienie - dlaczego cel jest ważny |
| category | TEXT | NULL, CHECK (category IN ('work', 'finance', 'hobby', 'relationships', 'health', 'development')) | Kategoria celu (praca, finanse, hobby, relacje, zdrowie, rozwój) |
| progress_percentage | INTEGER | NOT NULL, DEFAULT 0, CHECK (progress_percentage >= 0 AND progress_percentage <= 100) | Manualny postęp celu (0-100%) |
| position | INTEGER | NOT NULL, DEFAULT 1 | Kolejność wyświetlania celów (1-5) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data utworzenia |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data ostatniej modyfikacji |

**Indeksy:**
- `idx_long_term_goals_plan_id` ON (plan_id)
- `idx_long_term_goals_position` ON (plan_id, position)

---

### 1.3. milestones
Tabela przechowująca kamienie milowe (do 5 na cel długoterminowy).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator kamienia milowego |
| long_term_goal_id | UUID | NOT NULL, REFERENCES long_term_goals(id) ON DELETE CASCADE | Powiązanie z celem długoterminowym |
| title | TEXT | NOT NULL | Tytuł kamienia milowego |
| description | TEXT | NULL | Opis kamienia milowego |
| due_date | DATE | NULL | Termin wykonania |
| is_completed | BOOLEAN | NOT NULL, DEFAULT FALSE | Status ukończenia |
| position | INTEGER | NOT NULL, DEFAULT 1 | Kolejność kroków w ramach celu (1-5) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data utworzenia |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data ostatniej modyfikacji |

**Indeksy:**
- `idx_milestones_long_term_goal_id` ON (long_term_goal_id)
- `idx_milestones_position` ON (long_term_goal_id, position)
- `idx_milestones_is_completed` ON (is_completed)

---

### 1.4. weekly_goals
Tabela przechowująca cele tygodniowe (główne zadanie na tydzień).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator celu tygodniowego |
| plan_id | UUID | NOT NULL, REFERENCES plans(id) ON DELETE CASCADE | Powiązanie z planerem |
| long_term_goal_id | UUID | NULL, REFERENCES long_term_goals(id) ON DELETE SET NULL | Opcjonalne powiązanie z celem długoterminowym |
| milestone_id | UUID | NULL, REFERENCES milestones(id) ON DELETE SET NULL | Opcjonalne powiązanie z kamieniem milowym |
| week_number | INTEGER | NOT NULL, CHECK (week_number >= 1 AND week_number <= 12) | Numer tygodnia w ramach planera (1-12) |
| title | TEXT | NOT NULL | Główne zadanie tygodnia |
| description | TEXT | NULL | Opis celu tygodniowego |
| position | INTEGER | NOT NULL, DEFAULT 1 | Kolejność wyświetlania zadania |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data utworzenia |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data ostatniej modyfikacji |

**Indeksy:**
- `idx_weekly_goals_plan_id` ON (plan_id)
- `idx_weekly_goals_long_term_goal_id` ON (long_term_goal_id)
- `idx_weekly_goals_milestone_id` ON (milestone_id)
- `idx_weekly_goals_week_number` ON (plan_id, week_number)

---

### 1.5. tasks
Tabela przechowująca zadania. Zadania mogą być powiązane z celami tygodniowymi lub być zadaniami ad-hoc.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator zadania |
| weekly_goal_id | UUID | NULL, REFERENCES weekly_goals(id) ON DELETE CASCADE | Powiązanie z celem tygodniowym (NULL dla ad-hoc) |
| plan_id | UUID | NOT NULL, REFERENCES plans(id) ON DELETE CASCADE | Powiązanie z planerem (dla zadań ad-hoc) |
| long_term_goal_id | UUID | NULL, REFERENCES long_term_goals(id) ON DELETE SET NULL | Opcjonalne powiązanie z celem długoterminowym |
| milestone_id | UUID | NULL, REFERENCES milestones(id) ON DELETE SET NULL | Opcjonalne powiązanie z kamieniem milowym |
| title | TEXT | NOT NULL | Tytuł zadania |
| description | TEXT | NULL | Opis zadania |
| priority | TEXT | NOT NULL, DEFAULT 'C', CHECK (priority IN ('A', 'B', 'C')) | Priorytet zadania (A-najwyższy, B, C) |
| status | TEXT | NOT NULL, DEFAULT 'todo', CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled', 'postponed')) | Status zadania |
| task_type | TEXT | NOT NULL, DEFAULT 'weekly', CHECK (task_type IN ('weekly_main', 'weekly_sub', 'ad_hoc')) | Typ zadania: główne tygodniowe, podzadanie tygodniowe, ad-hoc |
| week_number | INTEGER | NULL, CHECK (week_number >= 1 AND week_number <= 12) | Numer tygodnia (dla zadań tygodniowych) |
| due_day | INTEGER | NULL, CHECK (due_day >= 1 AND due_day <= 7) | Dzień tygodnia (1-7, gdzie 1=poniedziałek) |
| position | INTEGER | NOT NULL, DEFAULT 1 | Kolejność zadania w liście |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data utworzenia |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data ostatniej modyfikacji |

**Indeksy:**
- `idx_tasks_weekly_goal_id` ON (weekly_goal_id)
- `idx_tasks_plan_id` ON (plan_id)
- `idx_tasks_long_term_goal_id` ON (long_term_goal_id)
- `idx_tasks_milestone_id` ON (milestone_id)
- `idx_tasks_week_number` ON (plan_id, week_number)
- `idx_tasks_due_day` ON (plan_id, week_number, due_day)
- `idx_tasks_status` ON (status)
- `idx_tasks_priority` ON (priority)
- `idx_tasks_task_type` ON (task_type)

---

### 1.6. task_history
Tabela przechowująca historię zmian stanów zadań (dla zadań wielodniowych).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator wpisu historii |
| task_id | UUID | NOT NULL, REFERENCES tasks(id) ON DELETE CASCADE | Powiązanie z zadaniem |
| status | TEXT | NOT NULL, CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled', 'postponed')) | Status zadania w danym momencie |
| changed_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data zmiany statusu |
| due_day | INTEGER | NULL, CHECK (due_day >= 1 AND due_day <= 7) | Dzień tygodnia, w którym zadanie było w tym statusie |

**Indeksy:**
- `idx_task_history_task_id` ON (task_id)
- `idx_task_history_changed_at` ON (changed_at)

---

### 1.7. weekly_reviews
Tabela przechowująca cotygodniowe podsumowania (3 pytania).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator podsumowania |
| plan_id | UUID | NOT NULL, REFERENCES plans(id) ON DELETE CASCADE | Powiązanie z planerem |
| week_number | INTEGER | NOT NULL, CHECK (week_number >= 1 AND week_number <= 12) | Numer tygodnia (1-12) |
| what_worked | TEXT | NULL | Odpowiedź na pytanie "Co się udało?" |
| what_did_not_work | TEXT | NULL | Odpowiedź na pytanie "Co się nie udało?" |
| what_to_improve | TEXT | NULL | Odpowiedź na pytanie "Co mogę poprawić?" |
| is_completed | BOOLEAN | NOT NULL, DEFAULT FALSE | Czy podsumowanie zostało wypełnione |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data utworzenia |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data ostatniej modyfikacji (auto-save) |

**Indeksy:**
- `idx_weekly_reviews_plan_id` ON (plan_id)
- `idx_weekly_reviews_week_number` ON (plan_id, week_number)
- `idx_weekly_reviews_is_completed` ON (is_completed)


---

### 1.8. user_metrics
Tabela przechowująca metryki użytkowników (do śledzenia sukcesu MVP).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator metryki |
| user_id | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Właściciel metryk |
| first_planner_created | BOOLEAN | NOT NULL, DEFAULT FALSE | Czy użytkownik stworzył pierwszy planer |
| first_planner_completed | BOOLEAN | NOT NULL, DEFAULT FALSE | Czy użytkownik ukończył pierwszy planer (min. 1 cel na 100%) |
| total_plans_created | INTEGER | NOT NULL, DEFAULT 0 | Liczba utworzonych planerów |
| total_goals_completed | INTEGER | NOT NULL, DEFAULT 0 | Liczba ukończonych celów (100% postępu) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data utworzenia |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data ostatniej aktualizacji |

**Indeksy:**
- `idx_user_metrics_user_id` ON (user_id)

**Unique Constraints:**
- `unique_user_metrics` ON (user_id) - Jeden rekord na użytkownika

---

## 2. Relationships

### 2.1. Hierarchia Główna
```
auth.users (1) ---> (N) plans
plans (1) ---> (N) long_term_goals
long_term_goals (1) ---> (N) milestones
```

### 2.2. Cele Tygodniowe i Zadania
```
plans (1) ---> (N) weekly_goals
weekly_goals (1) ---> (N) tasks (jako podzadania)
plans (1) ---> (N) tasks (zadania ad-hoc)
long_term_goals (1) ---> (N) weekly_goals (opcjonalne powiązanie)
long_term_goals (1) ---> (N) tasks (opcjonalne powiązanie bezpośrednie)
milestones (1) ---> (N) weekly_goals (opcjonalne powiązanie)
milestones (1) ---> (N) tasks (opcjonalne powiązanie)
```

### 2.3. Historia Zadań
```
tasks (1) ---> (N) task_history
```

### 2.4. Podsumowania Tygodniowe
```
plans (1) ---> (N) weekly_reviews
```

### 2.5. Metryki Użytkowników
```
auth.users (1) ---> (1) user_metrics
```

**Kardynalność:**
- **1:N (jeden-do-wielu):** 
  - `auth.users` → `plans`
  - `plans` → `long_term_goals` (1-5 celów)
  - `long_term_goals` → `milestones` (0-5 kamieni milowych)
  - `long_term_goals` → `weekly_goals` (opcjonalne powiązanie)
  - `long_term_goals` → `tasks` (opcjonalne powiązanie bezpośrednie)
  - `milestones` → `weekly_goals` (opcjonalne powiązanie)
  - `milestones` → `tasks` (opcjonalne powiązanie)
  - `plans` → `weekly_goals` (0-12 celów tygodniowych)
  - `weekly_goals` → `tasks` (0-10 podzadań)
  - `plans` → `tasks` (zadania ad-hoc)
  - `plans` → `weekly_reviews` (0-12 podsumowań)
  - `tasks` → `task_history`

- **1:1 (jeden-do-jednego):**
  - `auth.users` → `user_metrics`

**Kaskadowe Usuwanie:**
- Usunięcie `plan` → kaskadowe usunięcie wszystkich powiązanych `long_term_goals`, `milestones`, `weekly_goals`, `tasks`, `weekly_reviews`
- Usunięcie `long_term_goal` → kaskadowe usunięcie powiązanych `milestones`, ustawienie `long_term_goal_id = NULL` w `weekly_goals` i `tasks`
- Usunięcie `milestone` → ustawienie `milestone_id = NULL` w `weekly_goals` i `tasks`
- Usunięcie `weekly_goal` → kaskadowe usunięcie powiązanych `tasks` (podzadań)
- Usunięcie `task` → kaskadowe usunięcie powiązanych `task_history`
- Usunięcie `auth.users` → kaskadowe usunięcie wszystkich danych użytkownika

---

## 3. Indexes

### 3.1. Performance Indexes (oprócz wymienionych przy tabelach)

**Composite Indexes** (dla często używanych zapytań):
```sql
CREATE INDEX idx_tasks_plan_week_day ON tasks(plan_id, week_number, due_day);
CREATE INDEX idx_tasks_week_status ON tasks(plan_id, week_number, status);
CREATE INDEX idx_tasks_goal_milestone ON tasks(long_term_goal_id, milestone_id) WHERE long_term_goal_id IS NOT NULL OR milestone_id IS NOT NULL;
CREATE INDEX idx_weekly_goals_plan_week ON weekly_goals(plan_id, week_number);
CREATE INDEX idx_weekly_goals_goal_milestone ON weekly_goals(long_term_goal_id, milestone_id) WHERE long_term_goal_id IS NOT NULL OR milestone_id IS NOT NULL;
CREATE INDEX idx_weekly_reviews_plan_week ON weekly_reviews(plan_id, week_number);
```

**Functional Indexes** (dla optymalizacji zapytań):
```sql
-- Szybkie wyszukiwanie aktywnych planerów użytkownika
CREATE INDEX idx_plans_user_active ON plans(user_id) WHERE status = 'active';

-- Szybkie wyszukiwanie nieukończonych kamieni milowych
CREATE INDEX idx_milestones_incomplete ON milestones(long_term_goal_id) WHERE is_completed = FALSE;

-- Szybkie wyszukiwanie zadań do zrobienia
CREATE INDEX idx_tasks_pending ON tasks(plan_id, week_number) WHERE status IN ('todo', 'in_progress', 'postponed');
```

---

## 4. PostgreSQL Row-Level Security (RLS) Policies

### 4.1. Włączenie RLS na wszystkich tabelach
```sql
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE long_term_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_metrics ENABLE ROW LEVEL SECURITY;
```

### 4.2. Polityki dla tabeli `plans`
```sql
-- SELECT: Użytkownik może odczytywać tylko swoje planery
CREATE POLICY "Users can view own plans"
ON plans FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Użytkownik może tworzyć tylko swoje planery
CREATE POLICY "Users can create own plans"
ON plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Użytkownik może aktualizować tylko swoje planery
CREATE POLICY "Users can update own plans"
ON plans FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Użytkownik może usuwać tylko swoje planery
CREATE POLICY "Users can delete own plans"
ON plans FOR DELETE
USING (auth.uid() = user_id);
```

### 4.3. Polityki dla tabeli `long_term_goals`
```sql
-- SELECT: Użytkownik może odczytywać cele ze swoich planerów
CREATE POLICY "Users can view own goals"
ON long_term_goals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = long_term_goals.plan_id
    AND plans.user_id = auth.uid()
  )
);

-- INSERT: Użytkownik może tworzyć cele tylko w swoich planerach
CREATE POLICY "Users can create goals in own plans"
ON long_term_goals FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = long_term_goals.plan_id
    AND plans.user_id = auth.uid()
  )
);

-- UPDATE: Użytkownik może aktualizować cele tylko w swoich planerach
CREATE POLICY "Users can update own goals"
ON long_term_goals FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = long_term_goals.plan_id
    AND plans.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = long_term_goals.plan_id
    AND plans.user_id = auth.uid()
  )
);

-- DELETE: Użytkownik może usuwać cele tylko ze swoich planerów
CREATE POLICY "Users can delete own goals"
ON long_term_goals FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = long_term_goals.plan_id
    AND plans.user_id = auth.uid()
  )
);
```

### 4.4. Polityki dla tabeli `milestones`
```sql
-- SELECT: Użytkownik może odczytywać kamienie milowe ze swoich celów
CREATE POLICY "Users can view own milestones"
ON milestones FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM long_term_goals
    JOIN plans ON plans.id = long_term_goals.plan_id
    WHERE long_term_goals.id = milestones.long_term_goal_id
    AND plans.user_id = auth.uid()
  )
);

-- INSERT: Użytkownik może tworzyć kamienie milowe tylko w swoich celach
CREATE POLICY "Users can create milestones in own goals"
ON milestones FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM long_term_goals
    JOIN plans ON plans.id = long_term_goals.plan_id
    WHERE long_term_goals.id = milestones.long_term_goal_id
    AND plans.user_id = auth.uid()
  )
);

-- UPDATE: Użytkownik może aktualizować swoje kamienie milowe
CREATE POLICY "Users can update own milestones"
ON milestones FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM long_term_goals
    JOIN plans ON plans.id = long_term_goals.plan_id
    WHERE long_term_goals.id = milestones.long_term_goal_id
    AND plans.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM long_term_goals
    JOIN plans ON plans.id = long_term_goals.plan_id
    WHERE long_term_goals.id = milestones.long_term_goal_id
    AND plans.user_id = auth.uid()
  )
);

-- DELETE: Użytkownik może usuwać swoje kamienie milowe
CREATE POLICY "Users can delete own milestones"
ON milestones FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM long_term_goals
    JOIN plans ON plans.id = long_term_goals.plan_id
    WHERE long_term_goals.id = milestones.long_term_goal_id
    AND plans.user_id = auth.uid()
  )
);
```

### 4.5. Polityki dla tabeli `weekly_goals`
```sql
-- SELECT: Użytkownik może odczytywać cele tygodniowe ze swoich planerów
CREATE POLICY "Users can view own weekly goals"
ON weekly_goals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = weekly_goals.plan_id
    AND plans.user_id = auth.uid()
  )
);

-- INSERT: Użytkownik może tworzyć cele tygodniowe w swoich planerach
CREATE POLICY "Users can create weekly goals in own plans"
ON weekly_goals FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = weekly_goals.plan_id
    AND plans.user_id = auth.uid()
  )
);

-- UPDATE: Użytkownik może aktualizować swoje cele tygodniowe
CREATE POLICY "Users can update own weekly goals"
ON weekly_goals FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = weekly_goals.plan_id
    AND plans.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = weekly_goals.plan_id
    AND plans.user_id = auth.uid()
  )
);

-- DELETE: Użytkownik może usuwać swoje cele tygodniowe
CREATE POLICY "Users can delete own weekly goals"
ON weekly_goals FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = weekly_goals.plan_id
    AND plans.user_id = auth.uid()
  )
);
```

### 4.6. Polityki dla tabeli `tasks`
```sql
-- SELECT: Użytkownik może odczytywać zadania ze swoich planerów
CREATE POLICY "Users can view own tasks"
ON tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = tasks.plan_id
    AND plans.user_id = auth.uid()
  )
);

-- INSERT: Użytkownik może tworzyć zadania w swoich planerach
CREATE POLICY "Users can create tasks in own plans"
ON tasks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = tasks.plan_id
    AND plans.user_id = auth.uid()
  )
);

-- UPDATE: Użytkownik może aktualizować swoje zadania
CREATE POLICY "Users can update own tasks"
ON tasks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = tasks.plan_id
    AND plans.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = tasks.plan_id
    AND plans.user_id = auth.uid()
  )
);

-- DELETE: Użytkownik może usuwać swoje zadania
CREATE POLICY "Users can delete own tasks"
ON tasks FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = tasks.plan_id
    AND plans.user_id = auth.uid()
  )
);
```

### 4.7. Polityki dla tabeli `task_history`
```sql
-- SELECT: Użytkownik może odczytywać historię swoich zadań
CREATE POLICY "Users can view own task history"
ON task_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tasks
    JOIN plans ON plans.id = tasks.plan_id
    WHERE tasks.id = task_history.task_id
    AND plans.user_id = auth.uid()
  )
);

-- INSERT: Użytkownik może tworzyć historię dla swoich zadań
CREATE POLICY "Users can create task history for own tasks"
ON task_history FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks
    JOIN plans ON plans.id = tasks.plan_id
    WHERE tasks.id = task_history.task_id
    AND plans.user_id = auth.uid()
  )
);

-- UPDATE: Brak - historia nie powinna być modyfikowana
-- DELETE: Brak - historia nie powinna być usuwana ręcznie (tylko kaskadowo)
```

### 4.8. Polityki dla tabeli `weekly_reviews`
```sql
-- SELECT: Użytkownik może odczytywać podsumowania ze swoich planerów
CREATE POLICY "Users can view own weekly reviews"
ON weekly_reviews FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = weekly_reviews.plan_id
    AND plans.user_id = auth.uid()
  )
);

-- INSERT: Użytkownik może tworzyć podsumowania w swoich planerach
CREATE POLICY "Users can create weekly reviews in own plans"
ON weekly_reviews FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = weekly_reviews.plan_id
    AND plans.user_id = auth.uid()
  )
);

-- UPDATE: Użytkownik może aktualizować swoje podsumowania (auto-save)
CREATE POLICY "Users can update own weekly reviews"
ON weekly_reviews FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = weekly_reviews.plan_id
    AND plans.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = weekly_reviews.plan_id
    AND plans.user_id = auth.uid()
  )
);

-- DELETE: Użytkownik może usuwać swoje podsumowania
CREATE POLICY "Users can delete own weekly reviews"
ON weekly_reviews FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = weekly_reviews.plan_id
    AND plans.user_id = auth.uid()
  )
);
```

### 4.9. Polityki dla tabeli `user_metrics`
```sql
-- SELECT: Użytkownik może odczytywać tylko swoje metryki
CREATE POLICY "Users can view own metrics"
ON user_metrics FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Użytkownik może tworzyć tylko swoje metryki
CREATE POLICY "Users can create own metrics"
ON user_metrics FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Użytkownik może aktualizować tylko swoje metryki
CREATE POLICY "Users can update own metrics"
ON user_metrics FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Użytkownik może usuwać tylko swoje metryki
CREATE POLICY "Users can delete own metrics"
ON user_metrics FOR DELETE
USING (auth.uid() = user_id);
```

---

## 5. Database Views

### 5.1. View: plan_progress
Dynamiczne obliczanie postępu planera na podstawie celów długoterminowych.

```sql
CREATE OR REPLACE VIEW plan_progress AS
SELECT 
  p.id AS plan_id,
  p.user_id,
  p.name AS plan_name,
  p.start_date,
  p.status,
  COUNT(DISTINCT ltg.id) AS total_goals,
  COALESCE(AVG(ltg.progress_percentage), 0) AS average_progress,
  COUNT(DISTINCT CASE WHEN ltg.progress_percentage = 100 THEN ltg.id END) AS completed_goals
FROM plans p
LEFT JOIN long_term_goals ltg ON p.id = ltg.plan_id
GROUP BY p.id, p.user_id, p.name, p.start_date, p.status;
```

### 5.2. View: weekly_task_summary
Podsumowanie zadań dla każdego tygodnia w planerze.

```sql
CREATE OR REPLACE VIEW weekly_task_summary AS
SELECT 
  p.id AS plan_id,
  p.user_id,
  t.week_number,
  COUNT(t.id) AS total_tasks,
  COUNT(CASE WHEN t.status = 'completed' THEN 1 END) AS completed_tasks,
  COUNT(CASE WHEN t.status = 'cancelled' THEN 1 END) AS cancelled_tasks,
  COUNT(CASE WHEN t.status = 'postponed' THEN 1 END) AS postponed_tasks,
  COUNT(CASE WHEN t.status IN ('todo', 'in_progress') THEN 1 END) AS pending_tasks,
  CASE 
    WHEN COUNT(t.id) > 0 THEN 
      ROUND((COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::NUMERIC / COUNT(t.id)) * 100, 2)
    ELSE 0 
  END AS completion_percentage
FROM plans p
LEFT JOIN tasks t ON p.id = t.plan_id
WHERE t.week_number IS NOT NULL
GROUP BY p.id, p.user_id, t.week_number;
```

### 5.3. View: daily_task_summary
Podsumowanie zadań dla każdego dnia w tygodniu.

```sql
CREATE OR REPLACE VIEW daily_task_summary AS
SELECT 
  p.id AS plan_id,
  p.user_id,
  t.week_number,
  t.due_day,
  COUNT(t.id) AS total_tasks,
  COUNT(CASE WHEN t.status = 'completed' THEN 1 END) AS completed_tasks,
  COUNT(CASE WHEN t.priority = 'A' THEN 1 END) AS priority_a_tasks,
  COUNT(CASE WHEN t.priority = 'B' THEN 1 END) AS priority_b_tasks,
  COUNT(CASE WHEN t.priority = 'C' THEN 1 END) AS priority_c_tasks
FROM plans p
LEFT JOIN tasks t ON p.id = t.plan_id
WHERE t.due_day IS NOT NULL
GROUP BY p.id, p.user_id, t.week_number, t.due_day;
```

### 5.4. View: milestone_progress
Postęp kamieni milowych dla każdego celu długoterminowego.

```sql
CREATE OR REPLACE VIEW milestone_progress AS
SELECT 
  ltg.id AS goal_id,
  ltg.plan_id,
  ltg.title AS goal_title,
  COUNT(m.id) AS total_milestones,
  COUNT(CASE WHEN m.is_completed = TRUE THEN 1 END) AS completed_milestones,
  CASE 
    WHEN COUNT(m.id) > 0 THEN 
      ROUND((COUNT(CASE WHEN m.is_completed = TRUE THEN 1 END)::NUMERIC / COUNT(m.id)) * 100, 2)
    ELSE 0 
  END AS completion_percentage
FROM long_term_goals ltg
LEFT JOIN milestones m ON ltg.id = m.long_term_goal_id
GROUP BY ltg.id, ltg.plan_id, ltg.title;
```

### 5.5. View: weekly_review_completion
Sprawdzanie, które tygodnie mają wypełnione podsumowania.

```sql
CREATE OR REPLACE VIEW weekly_review_completion AS
SELECT 
  p.id AS plan_id,
  p.user_id,
  wr.week_number,
  wr.is_completed,
  CASE 
    WHEN wr.what_worked IS NOT NULL 
      AND wr.what_did_not_work IS NOT NULL 
      AND wr.what_to_improve IS NOT NULL 
    THEN TRUE 
    ELSE FALSE 
  END AS all_questions_answered
FROM plans p
LEFT JOIN weekly_reviews wr ON p.id = wr.plan_id
ORDER BY p.id, wr.week_number;
```

---

## 6. Database Triggers

### 6.1. Trigger: update_updated_at_timestamp
Automatyczne aktualizowanie kolumny `updated_at` przy modyfikacji rekordu.

```sql
-- Funkcja pomocnicza
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggery dla wszystkich tabel
CREATE TRIGGER set_updated_at BEFORE UPDATE ON plans
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON long_term_goals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON milestones
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON weekly_goals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON weekly_reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON user_metrics
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 6.2. Trigger: log_task_status_change
Automatyczne logowanie zmian statusu zadania do tabeli `task_history`.

```sql
-- Funkcja pomocnicza
CREATE OR REPLACE FUNCTION log_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Dodaj wpis do historii tylko jeśli status się zmienił
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO task_history (task_id, status, changed_at, due_day)
    VALUES (NEW.id, NEW.status, NOW(), NEW.due_day);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER track_task_status_changes
AFTER INSERT OR UPDATE OF status ON tasks
FOR EACH ROW EXECUTE FUNCTION log_task_status_change();
```

### 6.3. Trigger: update_user_metrics_on_plan_creation
Aktualizacja metryk użytkownika po utworzeniu planera.

```sql
-- Funkcja pomocnicza
CREATE OR REPLACE FUNCTION update_user_metrics_on_plan_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Wstaw lub zaktualizuj metryki użytkownika
  INSERT INTO user_metrics (user_id, first_planner_created, total_plans_created)
  VALUES (NEW.user_id, TRUE, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_plans_created = user_metrics.total_plans_created + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER update_metrics_on_plan_insert
AFTER INSERT ON plans
FOR EACH ROW EXECUTE FUNCTION update_user_metrics_on_plan_creation();
```

### 6.4. Trigger: update_user_metrics_on_goal_completion
Aktualizacja metryk użytkownika po ukończeniu celu (100% postępu).

```sql
-- Funkcja pomocnicza
CREATE OR REPLACE FUNCTION update_user_metrics_on_goal_completion()
RETURNS TRIGGER AS $$
DECLARE
  plan_user_id UUID;
  first_plan_id UUID;
  has_completed_goal_in_first_plan BOOLEAN;
BEGIN
  -- Sprawdź, czy cel osiągnął 100% postępu
  IF NEW.progress_percentage = 100 AND (OLD.progress_percentage IS NULL OR OLD.progress_percentage < 100) THEN
    -- Pobierz user_id z planera
    SELECT user_id INTO plan_user_id
    FROM plans
    WHERE id = NEW.plan_id;
    
    -- Zaktualizuj liczbę ukończonych celów
    UPDATE user_metrics
    SET 
      total_goals_completed = total_goals_completed + 1,
      updated_at = NOW()
    WHERE user_id = plan_user_id;
    
    -- Sprawdź, czy to pierwszy planer użytkownika
    SELECT id INTO first_plan_id
    FROM plans
    WHERE user_id = plan_user_id
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Sprawdź, czy cel należy do pierwszego planera
    IF first_plan_id = NEW.plan_id THEN
      -- Oznacz, że użytkownik ukończył cel w pierwszym planerze
      UPDATE user_metrics
      SET 
        first_planner_completed = TRUE,
        updated_at = NOW()
      WHERE user_id = plan_user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER update_metrics_on_goal_complete
AFTER INSERT OR UPDATE OF progress_percentage ON long_term_goals
FOR EACH ROW EXECUTE FUNCTION update_user_metrics_on_goal_completion();
```

### 6.5. Trigger: ensure_single_active_plan
Zapewnia, że użytkownik ma tylko jeden plan w stanie 'active'. Gdy plan jest zmieniany na 'active', wszystkie inne aktywne plany użytkownika są zmieniane na 'ready'.

```sql
-- Funkcja pomocnicza
CREATE OR REPLACE FUNCTION ensure_single_active_plan()
RETURNS TRIGGER AS $$
BEGIN
  -- Jeśli plan jest zmieniany na 'active'
  IF NEW.status = 'active' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'active') THEN
    -- Zmień wszystkie inne aktywne plany tego użytkownika na 'ready'
    UPDATE plans
    SET status = 'ready', updated_at = NOW()
    WHERE user_id = NEW.user_id
    AND id != NEW.id
    AND status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER enforce_single_active_plan
BEFORE INSERT OR UPDATE OF status ON plans
FOR EACH ROW EXECUTE FUNCTION ensure_single_active_plan();
```

### 6.6. Trigger: validate_plan_start_date
Walidacja, że data rozpoczęcia planera zawsze przypada na poniedziałek.

```sql
-- Funkcja pomocnicza
CREATE OR REPLACE FUNCTION validate_plan_start_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Sprawdź, czy start_date przypada na poniedziałek (1 = poniedziałek w ISO)
  IF EXTRACT(ISODOW FROM NEW.start_date) != 1 THEN
    RAISE EXCEPTION 'Plan start_date must be a Monday';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER check_plan_start_date
BEFORE INSERT OR UPDATE OF start_date ON plans
FOR EACH ROW EXECUTE FUNCTION validate_plan_start_date();
```

### 6.7. Trigger: validate_goal_count_per_plan
Walidacja liczby celów na planer (min 1, max 5).

```sql
-- Funkcja pomocnicza
CREATE OR REPLACE FUNCTION validate_goal_count_per_plan()
RETURNS TRIGGER AS $$
DECLARE
  goal_count INTEGER;
BEGIN
  -- Policz aktualną liczbę celów dla planera
  SELECT COUNT(*) INTO goal_count
  FROM long_term_goals
  WHERE plan_id = NEW.plan_id;
  
  -- Sprawdź maksymalną liczbę celów (5)
  IF (TG_OP = 'INSERT') AND goal_count >= 5 THEN
    RAISE EXCEPTION 'Cannot add more than 5 goals to a plan';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER check_goal_count
BEFORE INSERT ON long_term_goals
FOR EACH ROW EXECUTE FUNCTION validate_goal_count_per_plan();
```

### 6.8. Trigger: validate_milestone_count_per_goal
Walidacja liczby kamieni milowych na cel (max 5).

```sql
-- Funkcja pomocnicza
CREATE OR REPLACE FUNCTION validate_milestone_count_per_goal()
RETURNS TRIGGER AS $$
DECLARE
  milestone_count INTEGER;
BEGIN
  -- Policz aktualną liczbę kamieni milowych dla celu
  SELECT COUNT(*) INTO milestone_count
  FROM milestones
  WHERE long_term_goal_id = NEW.long_term_goal_id;
  
  -- Sprawdź maksymalną liczbę kamieni milowych (5)
  IF (TG_OP = 'INSERT') AND milestone_count >= 5 THEN
    RAISE EXCEPTION 'Cannot add more than 5 milestones to a goal';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER check_milestone_count
BEFORE INSERT ON milestones
FOR EACH ROW EXECUTE FUNCTION validate_milestone_count_per_goal();
```

### 6.9. Trigger: validate_weekly_subtask_count
Walidacja liczby podzadań tygodniowych (max 10).

```sql
-- Funkcja pomocnicza
CREATE OR REPLACE FUNCTION validate_weekly_subtask_count()
RETURNS TRIGGER AS $$
DECLARE
  subtask_count INTEGER;
BEGIN
  -- Policz podzadania tylko jeśli task_type = 'weekly_sub'
  IF NEW.task_type = 'weekly_sub' AND NEW.weekly_goal_id IS NOT NULL THEN
    SELECT COUNT(*) INTO subtask_count
    FROM tasks
    WHERE weekly_goal_id = NEW.weekly_goal_id
    AND task_type = 'weekly_sub';
    
    -- Sprawdź maksymalną liczbę podzadań (10)
    IF (TG_OP = 'INSERT') AND subtask_count >= 10 THEN
      RAISE EXCEPTION 'Cannot add more than 10 subtasks to a weekly goal';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER check_weekly_subtask_count
BEFORE INSERT ON tasks
FOR EACH ROW EXECUTE FUNCTION validate_weekly_subtask_count();
```

### 6.10. Trigger: validate_ad_hoc_task_count
Walidacja liczby zadań ad-hoc na tydzień (max 10).

```sql
-- Funkcja pomocnicza
CREATE OR REPLACE FUNCTION validate_ad_hoc_task_count()
RETURNS TRIGGER AS $$
DECLARE
  ad_hoc_count INTEGER;
BEGIN
  -- Policz zadania ad-hoc tylko jeśli task_type = 'ad_hoc'
  IF NEW.task_type = 'ad_hoc' AND NEW.week_number IS NOT NULL THEN
    SELECT COUNT(*) INTO ad_hoc_count
    FROM tasks
    WHERE plan_id = NEW.plan_id
    AND week_number = NEW.week_number
    AND task_type = 'ad_hoc';
    
    -- Sprawdź maksymalną liczbę zadań ad-hoc (10)
    IF (TG_OP = 'INSERT') AND ad_hoc_count >= 10 THEN
      RAISE EXCEPTION 'Cannot add more than 10 ad-hoc tasks per week';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER check_ad_hoc_task_count
BEFORE INSERT ON tasks
FOR EACH ROW EXECUTE FUNCTION validate_ad_hoc_task_count();
```

---

## 7. Additional Notes

### 7.1. Data Normalization
Schemat bazy danych jest znormalizowany do **3NF (Third Normal Form)**:
- Eliminacja powtarzających się grup danych (1NF)
- Wszystkie atrybuty niekluczowe są w pełni zależne od klucza podstawowego (2NF)
- Brak zależności przechodnich między atrybutami niekluczowymi (3NF)

Jedyne odstępstwa od pełnej normalizacji (celowa denormalizacja dla wydajności):
- `plan_id` w tabeli `tasks` (dla zadań ad-hoc) - pozwala na szybsze zapytania bez JOIN przez `weekly_goals`
- `long_term_goal_id` w tabeli `tasks` - umożliwia bezpośrednie wiązanie zadań z celami długoterminowymi dla elastyczności w hierarchii
- `milestone_id` w tabeli `weekly_goals` - pozwala na bezpośrednie powiązanie celów tygodniowych z kamieniami milowymi

### 7.2. UUID vs. Serial IDs
Wszystkie klucze podstawowe używają **UUID** zamiast SERIAL/BIGSERIAL z następujących powodów:
- Bezpieczeństwo: trudniejsze do odgadnięcia niż sekwencyjne ID
- Distributed systems: możliwość generowania ID po stronie klienta
- Merge conflicts: brak konfliktów przy replikacji/synchronizacji
- Zgodność z Supabase auth.users (używa UUID)

### 7.3. Timestamps
Wszystkie tabele posiadają kolumny `created_at` i `updated_at`:
- `created_at`: Automatycznie ustawiany przy INSERT (DEFAULT NOW())
- `updated_at`: Automatycznie aktualizowany przy UPDATE (przez trigger)

Użycie `TIMESTAMPTZ` (timestamp with time zone) zapewnia:
- Przechowywanie czasu w UTC
- Automatyczną konwersję do lokalnej strefy czasowej klienta

### 7.4. Soft Delete vs. Hard Delete
Planery używają **soft delete** (flaga `status = 'archived'`):
- Zachowanie historii dla metryk i analizy
- Możliwość przywrócenia archiwalnych planerów
- Zgodność z wymaganiem GDPR (dane można usunąć na żądanie użytkownika)

**Stany planera:**
- `ready` (domyślny): Plan utworzony, gotowy do aktywacji
- `active`: Aktywny plan użytkownika (tylko jeden może być aktywny jednocześnie)
- `completed`: Plan zakończony (wszystkie 12 tygodni minęło)
- `archived`: Plan zarchiwizowany przez użytkownika

Pozostałe encje używają **hard delete** z kaskadowym usuwaniem (ON DELETE CASCADE).

### 7.5. Constraints and Validation
Walidacja danych odbywa się na trzech poziomach:

**Poziom 1: Database Constraints**
- CHECK constraints dla enum-like values (status, priority, category)
- NOT NULL constraints dla wymaganych pól
- UNIQUE constraints dla unikalności danych
- Foreign keys dla integralności referencyjnej

**Poziom 2: Database Triggers**
- Zapewnienie pojedynczego aktywnego planu (tylko jeden plan może być 'active')
- Walidacja liczby celów (1-5 na planer)
- Walidacja liczby kamieni milowych (0-5 na cel)
- Walidacja liczby podzadań (0-10 na cel tygodniowy)
- Walidacja liczby zadań ad-hoc (0-10 na tydzień)
- Walidacja daty rozpoczęcia planera (musi być poniedziałek)

**Poziom 3: Application Layer**
- Długość pól tekstowych (description, title)
- Format email przy rejestracji
- Siła hasła (min. 8 znaków)
- Logika biznesowa (np. nie można edytować archiwalnych planerów)

### 7.6. Performance Considerations

**Query Optimization:**
- Indeksy na wszystkich kluczach obcych (w tym nowe `long_term_goal_id` i `milestone_id`)
- Indeksy na kolumnach używanych w WHERE (status, week_number, due_day)
- Composite indexes dla często używanych kombinacji:
  - `tasks(long_term_goal_id, milestone_id)` - optymalizacja dla zapytań po hierarchii celów
  - `weekly_goals(long_term_goal_id, milestone_id)` - filtrowanie celów tygodniowych po powiązaniach
- Partial indexes dla często filtrowanych podzbiorów danych
- Nowe indeksy wykorzystują WHERE clauses do optymalizacji tylko dla rekordów z faktycznymi powiązaniami

**Denormalization Trade-offs:**
- Dynamiczne obliczanie postępów (views) zamiast przechowywania obliczonych wartości
- Trade-off: nieznacznie wolniejsze zapytania vs. pełna spójność danych
- Dla MVP akceptowalne, możliwa optymalizacja w przyszłości (materialized views, caching)

### 7.7. Scalability Considerations

**Current Design (MVP):**
- Obsługa pojedynczych użytkowników (no sharing)
- RLS policies zapewniają izolację danych
- Indexed queries dla typowych operacji
- Expected load: <1000 użytkowników, <100 concurrent users

**Future Scalability:**
- Partycjonowanie tabeli `tasks` po `plan_id` dla dużych zbiorów danych
- Materialized views dla często używanych agregacji
- Read replicas dla separacji read/write operations
- Caching layer (Redis) dla często odczytywanych danych (np. active plan)

### 7.8. Data Integrity

**Referential Integrity:**
- Wszystkie relacje chronione przez foreign keys
- Kaskadowe usuwanie zapewnia spójność (orphaned records)
- ON DELETE SET NULL dla opcjonalnych relacji:
  - `milestone_id` w tabelach `tasks` i `weekly_goals`
  - `long_term_goal_id` w tabelach `tasks` i `weekly_goals`
- Elastyczne wiązanie pozwala na wielopoziomową hierarchię: zadania mogą być powiązane zarówno bezpośrednio z celami długoterminowymi, jak i z kamieniami milowymi

**Business Logic Integrity:**
- Triggers walidują limity zgodnie z wymaganiami biznesowymi
- Trigger zapewnia, że użytkownik ma tylko jeden aktywny plan
- Check constraints zapewniają poprawność wartości enum
- Unique constraints zapewniają unikalność tam, gdzie wymagana

### 7.9. Backup and Recovery Strategy

**Supabase Automated Backups:**
- Daily automated backups (retention: 7 days for free tier)
- Point-in-time recovery dla paid plans
- Manual export możliwy poprzez pg_dump

**Application-Level Considerations:**
- Soft delete dla planerów - łatwe odzyskanie danych
- Task history - audyt zmian statusów zadań
- Auto-save dla weekly_reviews - minimalizacja utraty danych

### 7.10. GDPR Compliance

**Personal Data:**
- Dane użytkownika w `auth.users` (zarządzane przez Supabase Auth)
- Dane aplikacyjne powiązane przez `user_id`

**Right to be Forgotten:**
- ON DELETE CASCADE na wszystkich tabelach powiązanych z użytkownikiem
- Usunięcie użytkownika z `auth.users` automatycznie usuwa wszystkie jego dane
- Możliwość exportu danych przed usunięciem (application layer)

**Data Minimization:**
- Brak zbędnych danych osobowych
- Brak logów IP, lokalizacji, device info w MVP
- Metryki anonimizowane dla analytics (aggregated data only)

### 7.11. Testing Considerations

**Database Testing:**
- Unit tests dla funkcji i triggerów (pgTAP)
- Integration tests dla RLS policies
- Performance tests dla często używanych queries
- Migration tests (up/down) przed deployment

**Test Data:**
- Seed scripts dla development environment
- Factory functions dla generowania test data
- Cleanup scripts po testach

### 7.12. Migration Strategy

**Versioning:**
- Migracje numerowane sekwencyjnie (001_initial_schema.sql, 002_add_indexes.sql, etc.)
- Każda migracja z UP i DOWN scripts
- Tracking w Supabase migration table

**Deployment:**
- Review przed deployment (peer review)
- Backup przed każdą migracją
- Test migration na staging environment
- Rollback plan dla każdej migracji

