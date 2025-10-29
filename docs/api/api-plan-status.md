# API Implementation Status

Status aktualnej implementacji endpointów REST API zgodnie z dokumentem `api-plan.md`.

**Legenda:**
- ✅ [x] - Endpoint zaimplementowany
- ⬜ [ ] - Endpoint niezaimplementowany

**Stan:** 6 / 69 endpointów zaimplementowanych (8.7%)

Ostatnia aktualizacja: 2025-10-29

---

## 3. API Endpoints

### 3.1 Authentication
Authentication jest obsługiwane przez Supabase Auth SDK po stronie klienta - nie wymaga implementacji custom API endpoints.

---

### 3.2 Plans (6 / 8 zaimplementowane)

- [x] **3.2.1** Get User's Plans - **GET** `/api/v1/plans`
  - Query params: `status`, `limit`, `offset`
  - Plik: `src/pages/api/v1/plans.ts`

- [x] **3.2.2** Get Active Plan - **GET** `/api/v1/plans/active`
  - Plik: `src/pages/api/v1/plans/active.ts`

- [x] **3.2.3** Get Plan by ID - **GET** `/api/v1/plans/:id`
  - Plik: `src/pages/api/v1/plans/[id].ts`

- [x] **3.2.4** Create Plan - **POST** `/api/v1/plans`
  - Request body: `name`, `start_date`
  - Plik: `src/pages/api/v1/plans.ts`

- [x] **3.2.5** Update Plan - **PATCH** `/api/v1/plans/:id`
  - Request body: `name`, `status`
  - Plik: `src/pages/api/v1/plans/[id].ts`

- [ ] **3.2.6** Delete Plan - **DELETE** `/api/v1/plans/:id`
  - Permanent delete (hard delete) z cascade
  - **NIE ZAIMPLEMENTOWANE**

- [x] **3.2.7** Archive Plan - **POST** `/api/v1/plans/:id/archive`
  - Soft delete (zmiana status na 'archived')
  - Plik: `src/pages/api/v1/plans/[id]/archive.ts`

- [ ] **3.2.8** Get Plan Dashboard Data - **GET** `/api/v1/plans/:id/dashboard`
  - Agregowane dane: plan, goals, milestones, tasks, progress
  - **NIE ZAIMPLEMENTOWANE**

---

### 3.3 Goals (Long-term Goals) (0 / 6 zaimplementowane)

- [ ] **3.3.1** List Goals - **GET** `/api/v1/goals`
  - Query params: `plan_id`, `limit`, `offset`
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.3.2** Get Goals by Plan - **GET** `/api/v1/plans/:planId/goals`
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.3.3** Get Goal by ID - **GET** `/api/v1/goals/:id`
  - Zwraca goal z milestones
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.3.4** Create Goal - **POST** `/api/v1/goals`
  - Request body: `plan_id`, `title`, `description`, `category`, `progress_percentage`, `position`
  - Max 5 goals per plan
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.3.5** Update Goal - **PATCH** `/api/v1/goals/:id`
  - Request body: partial goal data
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.3.6** Delete Goal - **DELETE** `/api/v1/goals/:id`
  - Cascade do milestones
  - **NIE ZAIMPLEMENTOWANE**

---

### 3.4 Milestones (0 / 6 zaimplementowane)

- [ ] **3.4.1** List Milestones - **GET** `/api/v1/milestones`
  - Query params: `long_term_goal_id`, `is_completed`, `limit`, `offset`
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.4.2** Get Milestones by Goal - **GET** `/api/v1/goals/:goalId/milestones`
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.4.3** Get Milestone by ID - **GET** `/api/v1/milestones/:id`
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.4.4** Create Milestone - **POST** `/api/v1/milestones`
  - Request body: `long_term_goal_id`, `title`, `description`, `due_date`, `position`
  - Max 5 milestones per goal
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.4.5** Update Milestone - **PATCH** `/api/v1/milestones/:id`
  - Request body: partial milestone data
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.4.6** Delete Milestone - **DELETE** `/api/v1/milestones/:id`
  - **NIE ZAIMPLEMENTOWANE**

---

### 3.5 Weekly Goals (0 / 5 zaimplementowane)

- [ ] **3.5.1** List Weekly Goals - **GET** `/api/v1/weekly-goals`
  - Query params: `plan_id` (required), `week_number`, `long_term_goal_id`, `limit`, `offset`
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.5.2** Get Weekly Goal by ID - **GET** `/api/v1/weekly-goals/:id`
  - Zwraca weekly goal z subtasks
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.5.3** Create Weekly Goal - **POST** `/api/v1/weekly-goals`
  - Request body: `plan_id`, `long_term_goal_id`, `week_number`, `title`, `description`, `position`
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.5.4** Update Weekly Goal - **PATCH** `/api/v1/weekly-goals/:id`
  - Request body: partial weekly goal data
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.5.5** Delete Weekly Goal - **DELETE** `/api/v1/weekly-goals/:id`
  - Cascade do subtasks
  - **NIE ZAIMPLEMENTOWANE**

---

### 3.6 Tasks (0 / 7 zaimplementowane)

- [ ] **3.6.1** List Tasks - **GET** `/api/v1/tasks`
  - Query params: `plan_id` (required), `week_number`, `due_day`, `task_type`, `weekly_goal_id`, `milestone_id`, `status`, `priority`, `limit`, `offset`
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.6.2** Get Daily Tasks - **GET** `/api/v1/tasks/daily`
  - Query params: `plan_id`, `week_number`, `due_day` (all required)
  - Zwraca tasks pogrupowane: most_important, secondary, additional
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.6.3** Get Task by ID - **GET** `/api/v1/tasks/:id`
  - Zwraca task z history
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.6.4** Create Task - **POST** `/api/v1/tasks`
  - Request body: `plan_id`, `weekly_goal_id`, `milestone_id`, `title`, `description`, `priority`, `status`, `task_type`, `week_number`, `due_day`, `position`
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.6.5** Update Task - **PATCH** `/api/v1/tasks/:id`
  - Request body: partial task data
  - Status changes automatycznie logowane do task_history
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.6.6** Copy Task - **POST** `/api/v1/tasks/:id/copy`
  - Request body: `week_number`, `due_day`
  - Kopiuje task na inny dzień/tydzień
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.6.7** Delete Task - **DELETE** `/api/v1/tasks/:id`
  - Cascade do task_history
  - **NIE ZAIMPLEMENTOWANE**

---

### 3.7 Task History (0 / 1 zaimplementowane)

- [ ] **3.7.1** Get Task History - **GET** `/api/v1/tasks/:taskId/history`
  - Historia zmian statusu task'a
  - **NIE ZAIMPLEMENTOWANE**

---

### 3.8 Weekly Reviews (0 / 7 zaimplementowane)

- [ ] **3.8.1** List Weekly Reviews - **GET** `/api/v1/weekly-reviews`
  - Query params: `plan_id` (required), `week_number`, `is_completed`, `limit`, `offset`
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.8.2** Get Weekly Review by Week - **GET** `/api/v1/weekly-reviews/week/:weekNumber`
  - Query params: `plan_id` (required)
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.8.3** Get Weekly Review by ID - **GET** `/api/v1/weekly-reviews/:id`
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.8.4** Create Weekly Review - **POST** `/api/v1/weekly-reviews`
  - Request body: `plan_id`, `week_number`, `what_worked`, `what_did_not_work`, `what_to_improve`
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.8.5** Update Weekly Review - **PATCH** `/api/v1/weekly-reviews/:id`
  - Request body: partial review data
  - Wspiera auto-save z partial updates
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.8.6** Mark Review as Complete - **POST** `/api/v1/weekly-reviews/:id/complete`
  - **NIE ZAIMPLEMENTOWANE**

- [ ] **3.8.7** Delete Weekly Review - **DELETE** `/api/v1/weekly-reviews/:id`
  - **NIE ZAIMPLEMENTOWANE**

---

### 3.9 User Metrics (0 / 1 zaimplementowane)

- [ ] **3.9.1** Get User Metrics - **GET** `/api/v1/users/metrics`
  - Metryki aktualizowane automatycznie przez database triggers
  - **NIE ZAIMPLEMENTOWANE**

---

### 3.10 Data Export (0 / 1 zaimplementowane)

- [ ] **3.10.1** Export User Data - **GET** `/api/v1/export`
  - Eksport wszystkich danych użytkownika (GDPR compliance)
  - **NIE ZAIMPLEMENTOWANE**

---

## Podsumowanie według zasobów

| Zasób | Zaimplementowane | Wszystkie | Procent |
|-------|------------------|-----------|---------|
| Plans | 6 | 8 | 75.0% |
| Goals | 0 | 6 | 0.0% |
| Milestones | 0 | 6 | 0.0% |
| Weekly Goals | 0 | 5 | 0.0% |
| Tasks | 0 | 7 | 0.0% |
| Task History | 0 | 1 | 0.0% |
| Weekly Reviews | 0 | 7 | 0.0% |
| User Metrics | 0 | 1 | 0.0% |
| Data Export | 0 | 1 | 0.0% |
| **RAZEM** | **6** | **42** | **14.3%** |

*(Uwaga: Authentication nie jest liczone, bo jest obsługiwane przez Supabase Auth SDK)*

---

## Priorytety implementacji

### Faza 1: Core Planning (Zaimplementowane częściowo)
- [x] Plans - podstawowe operacje (GET, POST, PATCH, Archive)
- [ ] Plans - DELETE endpoint
- [ ] Plans - Dashboard endpoint

### Faza 2: Goals & Milestones (Do implementacji)
- [ ] Goals - wszystkie operacje CRUD
- [ ] Milestones - wszystkie operacje CRUD

### Faza 3: Weekly Planning (Do implementacji)
- [ ] Weekly Goals - wszystkie operacje CRUD
- [ ] Tasks - wszystkie operacje CRUD + Copy
- [ ] Task History - odczyt

### Faza 4: Reviews & Analytics (Do implementacji)
- [ ] Weekly Reviews - wszystkie operacje CRUD + Complete
- [ ] User Metrics - odczyt
- [ ] Data Export

---

## Uwagi implementacyjne

### Co działa dobrze w aktualnej implementacji:
1. ✅ Konsystentna struktura endpointów
2. ✅ Walidacja danych z użyciem Zod schemas
3. ✅ Prawidłowa obsługa błędów z szczegółowymi komunikatami
4. ✅ Separation of concerns (validation, service, endpoint)
5. ✅ TypeScript types dla request/response

### Co należy dokończyć w sekcji Plans:
1. ⬜ DELETE endpoint dla hard delete
2. ⬜ Dashboard endpoint dla zagregowanych danych

### Kolejne kroki:
1. Implementacja Goals endpoints (priorytet wysoki - podstawowa funkcjonalność)
2. Implementacja Milestones endpoints (priorytet wysoki)
3. Implementacja Weekly Goals endpoints (priorytet wysoki)
4. Implementacja Tasks endpoints (priorytet wysoki)
5. Implementacja Weekly Reviews endpoints (priorytet średni)
6. Implementacja User Metrics i Export (priorytet niski - nice to have)

