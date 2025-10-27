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
| status | TEXT | NOT NULL, DEFAULT 'active', CHECK (status IN ('active', 'completed', 'archived')) | Status planera |
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
| week_number | INTEGER | NOT NULL, CHECK (week_number >= 1 AND week_number <= 12) | Numer tygodnia w ramach planera (1-12) |
| title | TEXT | NOT NULL | Główne zadanie tygodnia |
| description | TEXT | NULL | Opis celu tygodniowego |
| position | INTEGER | NOT NULL, DEFAULT 1 | Kolejność wyświetlania zadania |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data utworzenia |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data ostatniej modyfikacji |

**Indeksy:**
- `idx_weekly_goals_plan_id` ON (plan_id)
- `idx_weekly_goals_long_term_goal_id` ON (long_term_goal_id)
- `idx_weekly_goals_week_number` ON (plan_id, week_number)

---

### 1.5. tasks
Tabela przechowująca zadania. Zadania mogą być powiązane z celami tygodniowymi lub być zadaniami ad-hoc.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator zadania |
| weekly_goal_id | UUID | NULL, REFERENCES weekly_goals(id) ON DELETE CASCADE | Powiązanie z celem tygodniowym (NULL dla ad-hoc) |
| plan_id | UUID | NOT NULL, REFERENCES plans(id) ON DELETE CASCADE | Powiązanie z planerem (dla zadań ad-hoc) |
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
milestones (1) ---> (N) tasks (opcjonalne powiązanie)
long_term_goals (1) ---> (N) weekly_goals (opcjonalne powiązanie)
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
  - `plans` → `weekly_goals` (0-12 celów tygodniowych)
  - `weekly_goals` → `tasks` (0-10 podzadań)
  - `plans` → `tasks` (zadania ad-hoc)
  - `milestones` → `tasks` (opcjonalnie)
  - `plans` → `weekly_reviews` (0-12 podsumowań)
  - `tasks` → `task_history`

- **1:1 (jeden-do-jednego):**
  - `auth.users` → `user_metrics`

**Kaskadowe Usuwanie:**
- Usunięcie `plan` → kaskadowe usunięcie wszystkich powiązanych `long_term_goals`, `milestones`, `weekly_goals`, `tasks`, `weekly_reviews`
- Usunięcie `long_term_goal` → kaskadowe usunięcie powiązanych `milestones`, ustawienie `long_term_goal_id = NULL` w `weekly_goals`
- Usunięcie `milestone` → ustawienie `milestone_id = NULL` w `tasks`
- Usunięcie `weekly_goal` → kaskadowe usunięcie powiązanych `tasks` (podzadań)
- Usunięcie `task` → kaskadowe usunięcie powiązanych `task_history`
- Usunięcie `auth.users` → kaskadowe usunięcie wszystkich danych użytkownika

---
