# Przewodnik Testowania Row Level Security (RLS)

## 1. Przegląd

Ten dokument zawiera szczegółowe instrukcje testowania polityk Row Level Security (RLS) po wdrożeniu migracji `20260127000000_re_enable_rls.sql`.

---

## 2. Weryfikacja Wdrożenia Migracji

### 2.1. Sprawdzenie czy RLS jest włączony

```sql
-- Sprawdź status RLS dla wszystkich tabel
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Oczekiwany wynik:** Wszystkie tabele powinny mieć `rls_enabled = true`

### 2.2. Sprawdzenie utworzonych polityk

```sql
-- Lista wszystkich polityk RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Read'
    WHEN cmd = 'INSERT' THEN 'Create'
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
    ELSE cmd
  END as operation_type
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Oczekiwany wynik:** Powinno być widocznych 34 polityk:
- `plans`: 4 polityki (SELECT, INSERT, UPDATE, DELETE)
- `long_term_goals`: 4 polityki
- `milestones`: 4 polityki
- `weekly_goals`: 4 polityki
- `tasks`: 4 polityki
- `task_history`: 2 polityki (SELECT, INSERT)
- `weekly_reviews`: 4 polityki
- `user_metrics`: 4 polityki

### 2.3. Liczba polityk per tabela

```sql
-- Zlicz polityki dla każdej tabeli
SELECT 
  tablename, 
  COUNT(*) as policy_count 
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename 
ORDER BY tablename;
```

**Oczekiwany wynik:**
| tablename | policy_count |
|-----------|--------------|
| long_term_goals | 4 |
| milestones | 4 |
| plans | 4 |
| task_history | 2 |
| tasks | 4 |
| user_metrics | 4 |
| weekly_goals | 4 |
| weekly_reviews | 4 |

---

## 3. Testy Funkcjonalne

### 3.1. Przygotowanie Środowiska Testowego

#### Krok 1: Utworzenie użytkowników testowych

```sql
-- W Supabase Dashboard lub przez API:
-- Utwórz dwóch użytkowników:
-- User A: test-user-a@example.com
-- User B: test-user-b@example.com
```

#### Krok 2: Pobranie UUID użytkowników

```sql
-- Jako admin/service_role, pobierz UUID użytkowników
SELECT id, email 
FROM auth.users 
WHERE email IN ('test-user-a@example.com', 'test-user-b@example.com')
ORDER BY email;
```

Zapisz UUID dla dalszych testów:
- `USER_A_UUID`: [uuid użytkownika A]
- `USER_B_UUID`: [uuid użytkownika B]

### 3.2. Test 1: Izolacja Danych - Plans

**Cel:** Sprawdzić czy User B nie widzi planerów User A

#### Setup:
```sql
-- Zaloguj się jako User A (lub użyj service_role z SET LOCAL)
SET LOCAL request.jwt.claims TO '{"sub": "USER_A_UUID"}';

-- User A tworzy planer
INSERT INTO plans (user_id, name, start_date, status)
VALUES ('USER_A_UUID', 'Test Plan A', '2026-01-27', 'active')
RETURNING id;
-- Zapisz ID: PLAN_A_ID
```

#### Test:
```sql
-- Zaloguj się jako User B
SET LOCAL request.jwt.claims TO '{"sub": "USER_B_UUID"}';

-- User B próbuje odczytać planer User A
SELECT * FROM plans WHERE id = 'PLAN_A_ID';
```

**Oczekiwany wynik:** Pusty zestaw wyników (0 rows)

#### Weryfikacja:
```sql
-- User A powinien widzieć swój planer
SET LOCAL request.jwt.claims TO '{"sub": "USER_A_UUID"}';
SELECT * FROM plans WHERE id = 'PLAN_A_ID';
```

**Oczekiwany wynik:** 1 wiersz z danymi planera

### 3.3. Test 2: Izolacja Danych - Long Term Goals

**Cel:** Sprawdzić czy User B nie widzi celów User A

#### Setup:
```sql
-- User A tworzy cel
SET LOCAL request.jwt.claims TO '{"sub": "USER_A_UUID"}';

INSERT INTO long_term_goals (plan_id, title, description, progress_percentage)
VALUES ('PLAN_A_ID', 'Test Goal A', 'Description A', 0)
RETURNING id;
-- Zapisz ID: GOAL_A_ID
```

#### Test:
```sql
-- User B próbuje odczytać cel User A
SET LOCAL request.jwt.claims TO '{"sub": "USER_B_UUID"}';
SELECT * FROM long_term_goals WHERE id = 'GOAL_A_ID';
```

**Oczekiwany wynik:** Pusty zestaw wyników (0 rows)

### 3.4. Test 3: Próba Nieautoryzowanego Zapisu

**Cel:** Sprawdzić czy User B nie może tworzyć danych w planie User A

#### Test:
```sql
-- User B próbuje utworzyć cel w planie User A
SET LOCAL request.jwt.claims TO '{"sub": "USER_B_UUID"}';

INSERT INTO long_term_goals (plan_id, title, description, progress_percentage)
VALUES ('PLAN_A_ID', 'Malicious Goal', 'Should fail', 0);
```

**Oczekiwany wynik:** Błąd - `new row violates row-level security policy`

### 3.5. Test 4: Próba Nieautoryzowanej Aktualizacji

**Cel:** Sprawdzić czy User B nie może aktualizować danych User A

#### Test:
```sql
-- User B próbuje zaktualizować planer User A
SET LOCAL request.jwt.claims TO '{"sub": "USER_B_UUID"}';

UPDATE plans 
SET name = 'Hacked Plan'
WHERE id = 'PLAN_A_ID';
```

**Oczekiwany wynik:** 0 rows updated (operacja nie powiedzie się, ale nie zwróci błędu)

#### Weryfikacja:
```sql
-- Sprawdź czy nazwa się nie zmieniła
SET LOCAL request.jwt.claims TO '{"sub": "USER_A_UUID"}';
SELECT name FROM plans WHERE id = 'PLAN_A_ID';
```

**Oczekiwany wynik:** Nazwa nadal "Test Plan A"

### 3.6. Test 5: Próba Nieautoryzowanego Usunięcia

**Cel:** Sprawdzić czy User B nie może usuwać danych User A

#### Test:
```sql
-- User B próbuje usunąć planer User A
SET LOCAL request.jwt.claims TO '{"sub": "USER_B_UUID"}';

DELETE FROM plans WHERE id = 'PLAN_A_ID';
```

**Oczekiwany wynik:** 0 rows deleted

#### Weryfikacja:
```sql
-- Sprawdź czy planer nadal istnieje
SET LOCAL request.jwt.claims TO '{"sub": "USER_A_UUID"}';
SELECT * FROM plans WHERE id = 'PLAN_A_ID';
```

**Oczekiwany wynik:** 1 wiersz (planer nadal istnieje)

### 3.7. Test 6: Hierarchia Relacji

**Cel:** Sprawdzić czy polityki działają przez całą hierarchię

#### Setup:
```sql
-- User A tworzy pełną hierarchię
SET LOCAL request.jwt.claims TO '{"sub": "USER_A_UUID"}';

-- Milestone
INSERT INTO milestones (long_term_goal_id, title, due_date)
VALUES ('GOAL_A_ID', 'Test Milestone', '2026-02-15')
RETURNING id;
-- Zapisz ID: MILESTONE_A_ID

-- Weekly Goal
INSERT INTO weekly_goals (plan_id, long_term_goal_id, milestone_id, week_number, title)
VALUES ('PLAN_A_ID', 'GOAL_A_ID', 'MILESTONE_A_ID', 1, 'Test Weekly Goal')
RETURNING id;
-- Zapisz ID: WEEKLY_GOAL_A_ID

-- Task
INSERT INTO tasks (plan_id, weekly_goal_id, long_term_goal_id, milestone_id, title, week_number)
VALUES ('PLAN_A_ID', 'WEEKLY_GOAL_A_ID', 'GOAL_A_ID', 'MILESTONE_A_ID', 'Test Task', 1)
RETURNING id;
-- Zapisz ID: TASK_A_ID
```

#### Test:
```sql
-- User B próbuje odczytać dane z każdego poziomu hierarchii
SET LOCAL request.jwt.claims TO '{"sub": "USER_B_UUID"}';

SELECT * FROM milestones WHERE id = 'MILESTONE_A_ID';
SELECT * FROM weekly_goals WHERE id = 'WEEKLY_GOAL_A_ID';
SELECT * FROM tasks WHERE id = 'TASK_A_ID';
```

**Oczekiwany wynik:** Wszystkie zapytania zwracają 0 rows

### 3.8. Test 7: User Metrics Isolation

**Cel:** Sprawdzić izolację metryk użytkowników

#### Setup:
```sql
-- User A ma metryki (utworzone automatycznie przez trigger)
SET LOCAL request.jwt.claims TO '{"sub": "USER_A_UUID"}';
SELECT * FROM user_metrics WHERE user_id = 'USER_A_UUID';
```

#### Test:
```sql
-- User B próbuje odczytać metryki User A
SET LOCAL request.jwt.claims TO '{"sub": "USER_B_UUID"}';
SELECT * FROM user_metrics WHERE user_id = 'USER_A_UUID';
```

**Oczekiwany wynik:** 0 rows

### 3.9. Test 8: Task History Isolation

**Cel:** Sprawdzić izolację historii zadań

#### Setup:
```sql
-- User A aktualizuje status zadania (trigger utworzy wpis w historii)
SET LOCAL request.jwt.claims TO '{"sub": "USER_A_UUID"}';

UPDATE tasks 
SET status = 'in_progress'
WHERE id = 'TASK_A_ID';

-- Sprawdź historię
SELECT * FROM task_history WHERE task_id = 'TASK_A_ID';
-- Zapisz ID: HISTORY_ID
```

#### Test:
```sql
-- User B próbuje odczytać historię zadania User A
SET LOCAL request.jwt.claims TO '{"sub": "USER_B_UUID"}';
SELECT * FROM task_history WHERE task_id = 'TASK_A_ID';
```

**Oczekiwany wynik:** 0 rows

---

## 4. Testy Wydajnościowe

### 4.1. Test Performance - Simple Query

```sql
-- Włącz timing
\timing on

-- Test jako User A
SET LOCAL request.jwt.claims TO '{"sub": "USER_A_UUID"}';

-- Query z RLS
EXPLAIN ANALYZE
SELECT * FROM plans WHERE user_id = 'USER_A_UUID';
```

**Oczekiwany wynik:** 
- Execution time < 10ms dla małej liczby rekordów
- Index scan na `user_id`

### 4.2. Test Performance - Complex Query z JOIN

```sql
-- Query łączący wiele tabel
EXPLAIN ANALYZE
SELECT 
  p.name as plan_name,
  g.title as goal_title,
  m.title as milestone_title,
  t.title as task_title
FROM plans p
JOIN long_term_goals g ON g.plan_id = p.id
JOIN milestones m ON m.long_term_goal_id = g.id
JOIN tasks t ON t.milestone_id = m.id
WHERE p.user_id = 'USER_A_UUID';
```

**Oczekiwany wynik:**
- Execution time < 50ms dla średniej liczby rekordów
- Proper use of indexes
- RLS policies applied correctly

### 4.3. Benchmark - Przed vs Po RLS

**Przed włączeniem RLS:**
```sql
-- Zapisz baseline (jeśli dostępny)
-- Execution time: X ms
```

**Po włączeniu RLS:**
```sql
-- Porównaj z baseline
-- Overhead powinien być < 10%
```

---

## 5. Testy Integracyjne - Application Level

### 5.1. Test przez API Endpoint

#### Test 1: Login i dostęp do danych
```bash
# Login jako User A
curl -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test-user-a@example.com","password":"password123"}'

# Zapisz cookie/token

# Pobierz planery User A
curl -X GET http://localhost:4321/api/plans \
  -H "Cookie: [cookie from login]"
```

**Oczekiwany wynik:** Zwraca tylko planery User A

#### Test 2: Próba dostępu do cudzych danych
```bash
# Login jako User B
curl -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test-user-b@example.com","password":"password123"}'

# Próba pobrania planera User A (przez ID)
curl -X GET http://localhost:4321/api/plans/PLAN_A_ID \
  -H "Cookie: [cookie from User B login]"
```

**Oczekiwany wynik:** 404 Not Found lub 403 Forbidden

### 5.2. Test przez Frontend

#### Test Manual:
1. Zaloguj się jako User A
2. Utwórz planer
3. Wyloguj się
4. Zaloguj się jako User B
5. Sprawdź listę planerów

**Oczekiwany wynik:** User B nie widzi planera User A

---

## 6. Testy Regresji

### 6.1. Sprawdzenie Istniejących Funkcjonalności

**Test Checklist:**
- [ ] Rejestracja nowego użytkownika działa
- [ ] Logowanie działa
- [ ] Tworzenie planera działa
- [ ] Tworzenie celów działa
- [ ] Tworzenie zadań działa
- [ ] Aktualizacja danych działa
- [ ] Usuwanie danych działa
- [ ] Podsumowania tygodniowe działają
- [ ] Metryki użytkownika są aktualizowane

### 6.2. Sprawdzenie Triggerów

```sql
-- Test trigger: update_user_metrics_on_plan_creation
SET LOCAL request.jwt.claims TO '{"sub": "USER_A_UUID"}';

-- Sprawdź metryki przed
SELECT total_plans_created FROM user_metrics WHERE user_id = 'USER_A_UUID';

-- Utwórz nowy planer
INSERT INTO plans (user_id, name, start_date, status)
VALUES ('USER_A_UUID', 'New Plan', '2026-02-03', 'active');

-- Sprawdź metryki po
SELECT total_plans_created FROM user_metrics WHERE user_id = 'USER_A_UUID';
```

**Oczekiwany wynik:** `total_plans_created` zwiększył się o 1

---

## 7. Cleanup - Usunięcie Danych Testowych

```sql
-- Usuń dane testowe (jako admin/service_role)
DELETE FROM plans WHERE user_id IN ('USER_A_UUID', 'USER_B_UUID');
DELETE FROM user_metrics WHERE user_id IN ('USER_A_UUID', 'USER_B_UUID');

-- Usuń użytkowników testowych (przez Supabase Dashboard lub API)
```

---

## 8. Checklist Wdrożenia

### Pre-Deployment
- [ ] Backup bazy danych wykonany
- [ ] Migracja przetestowana na staging
- [ ] Peer review migracji wykonany
- [ ] Rollback plan przygotowany

### Deployment
- [ ] Migracja uruchomiona na produkcji
- [ ] Weryfikacja: RLS włączony na wszystkich tabelach
- [ ] Weryfikacja: Wszystkie polityki utworzone
- [ ] Test 1: Izolacja danych (plans) - PASSED
- [ ] Test 2: Izolacja danych (goals) - PASSED
- [ ] Test 3: Nieautoryzowany zapis - BLOCKED
- [ ] Test 4: Nieautoryzowana aktualizacja - BLOCKED
- [ ] Test 5: Nieautoryzowane usunięcie - BLOCKED
- [ ] Test 6: Hierarchia relacji - PASSED
- [ ] Test 7: User metrics isolation - PASSED
- [ ] Test 8: Task history isolation - PASSED

### Post-Deployment
- [ ] Monitoring performance przez 24h
- [ ] Sprawdzenie logów błędów
- [ ] Weryfikacja metryk aplikacji
- [ ] Feedback od użytkowników (jeśli dotyczy)

---

## 9. Troubleshooting

### Problem 1: RLS nie jest włączony
**Symptom:** `rowsecurity = false` w pg_tables

**Rozwiązanie:**
```sql
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;
```

### Problem 2: Polityki nie działają
**Symptom:** User B widzi dane User A

**Diagnoza:**
```sql
-- Sprawdź czy polityki istnieją
SELECT * FROM pg_policies WHERE tablename = '[table_name]';

-- Sprawdź definicję polityki
SELECT pg_get_expr(polqual, polrelid) as using_expression,
       pg_get_expr(polwithcheck, polrelid) as with_check_expression
FROM pg_policy
WHERE polname = '[policy_name]';
```

**Rozwiązanie:** Upewnij się, że polityki są poprawnie zdefiniowane i używają `auth.uid()`

### Problem 3: Wolne zapytania po włączeniu RLS
**Symptom:** Znaczny wzrost czasu wykonania zapytań

**Diagnoza:**
```sql
EXPLAIN ANALYZE [your_query];
```

**Rozwiązanie:**
- Sprawdź czy indeksy są używane
- Rozważ dodanie indeksów na kolumnach używanych w politykach
- Optymalizuj polityki (unikaj zbędnych JOINów)

### Problem 4: Błędy w aplikacji po wdrożeniu
**Symptom:** 500 errors, "permission denied" errors

**Diagnoza:**
- Sprawdź logi aplikacji
- Sprawdź logi Supabase
- Zweryfikuj czy `auth.uid()` jest dostępny w kontekście

**Rozwiązanie:**
- Upewnij się, że middleware poprawnie ustawia sesję
- Sprawdź czy `locals.supabase` jest używany w API endpoints
- Zweryfikuj konfigurację Supabase client

---

## 10. Kontakt w Razie Problemów

Jeśli napotkasz problemy podczas testowania:

1. Sprawdź logi Supabase Dashboard
2. Uruchom diagnostic queries z sekcji 2
3. Przejrzyj dokumentację: `docs/auth/auth-finalization-plan.md`
4. W razie krytycznego błędu: wykonaj rollback (wyłącz RLS tymczasowo)

---

**Dokument utworzony:** 2026-01-27
**Wersja:** 1.0
**Status:** Gotowy do użycia
