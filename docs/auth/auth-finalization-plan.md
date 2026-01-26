# Plan Finalizacji Modułu Autentykacji - 12 Weeks Planner

## 1. Podsumowanie Wykonawcze

Dokument zawiera kompleksową analizę aktualnego stanu implementacji modułu autentykacji oraz szczegółowy plan finalizacji z naciskiem na wdrożenie Row Level Security (RLS) w bazie danych Supabase.

**Status ogólny:** ✅ Implementacja frontendowa i backendowa jest w dużej mierze kompletna i zgodna z najlepszymi praktykami. Głównym zadaniem pozostaje przywrócenie RLS w bazie danych.

---

## 2. Analiza Aktualnej Implementacji

### 2.1. Frontend - Login Flow ✅

#### Strona Logowania (`src/pages/login.astro`)
**Status:** ✅ Kompletna i zgodna z najlepszymi praktykami

**Pozytywne aspekty:**
- Poprawne użycie `AuthLayout` dla spójnego UI
- Komponent React załadowany z dyrektywą `client:load`
- Integracja z systemem powiadomień (Sonner/Toaster)
- Middleware automatycznie przekierowuje zalogowanych użytkowników

**Zgodność z regułami Astro:**
- ✅ SSR włączone (brak `export const prerender = true`)
- ✅ Wykorzystuje layout system
- ✅ Minimalistyczna struktura strony

#### Komponent LoginForm (`src/components/auth/LoginForm.tsx`)
**Status:** ✅ Kompletny i zgodny z najlepszymi praktykami React

**Pozytywne aspekty:**
- ✅ Funkcyjny komponent z hooks (zgodnie z regułami React)
- ✅ Wykorzystanie `useCallback` dla optymalizacji re-renderów
- ✅ Wykorzystanie `useEffect` do obsługi parametrów URL (verification status)
- ✅ Walidacja po stronie klienta z natychmiastowym feedbackiem
- ✅ Obsługa błędów z API (400, 401, 403)
- ✅ Specjalna obsługa niezweryfikowanych emaili (403 + EMAIL_NOT_VERIFIED)
- ✅ Accessibility: aria-invalid, aria-describedby
- ✅ Loading states podczas submitu
- ✅ Integracja z Shadcn UI (Card, Input, Label, Button)
- ✅ Toast notifications dla UX feedback

**Zgodność z User Stories:**
- ✅ US-002: Formularz logowania z email i hasłem
- ✅ US-002: Link do formularza rejestracji
- ✅ US-002: Przekierowanie do dashboard po sukcesie
- ✅ US-002: Obsługa błędów logowania
- ✅ US-003: Link do "Forgot password"
- ✅ US-002: Wymóg zalogowania do korzystania z systemu

**Potencjalne ulepszenia (opcjonalne):**
- Rozważenie użycia `useTransition` dla non-urgent updates (zgodnie z regułami React)
- Ekstrakcja logiki walidacji do custom hook (`useLoginValidation`)

### 2.2. Backend - API Endpoint ✅

#### Login API (`src/pages/api/auth/login.ts`)
**Status:** ✅ Kompletny i zgodny z najlepszymi praktykami

**Pozytywne aspekty:**
- ✅ `export const prerender = false` (zgodnie z regułami Astro)
- ✅ Walidacja z Zod (zgodnie z regułami backend)
- ✅ Wykorzystanie `locals.supabase` z middleware
- ✅ Early returns dla error conditions (zgodnie z clean code guidelines)
- ✅ Weryfikacja email confirmation (`email_confirmed_at`)
- ✅ Wylogowanie użytkownika z niezweryfikowanym emailem
- ✅ Generyczne komunikaty błędów dla bezpieczeństwa (nie ujawnia czy email istnieje)
- ✅ Proper HTTP status codes (400, 401, 403, 500)
- ✅ Structured error responses z kodem błędu

**Zgodność z User Stories:**
- ✅ US-002: Autentykacja z email i hasłem
- ✅ US-001: Wymóg weryfikacji email przed logowaniem
- ✅ US-002: Obsługa błędów logowania

### 2.3. Middleware - Auth Guard ✅

#### Middleware (`src/middleware/index.ts`)
**Status:** ✅ Kompletny i zgodny z najlepszymi praktykami

**Pozytywne aspekty:**
- ✅ Tworzenie Supabase server client per-request
- ✅ Przypisanie `supabase` i `user` do `locals`
- ✅ Weryfikacja email confirmation w middleware
- ✅ Ochrona tras wymagających autentykacji
- ✅ Przekierowanie zalogowanych z auth pages
- ✅ Lista PUBLIC_PATHS dla publicznych endpointów

**Zgodność z User Stories:**
- ✅ US-002: Przekierowanie do /plans dla zalogowanych
- ✅ US-002: Przekierowanie do /login dla niezalogowanych
- ✅ US-011: Ochrona danych użytkownika

**Potencjalne ulepszenia (opcjonalne):**
- Dodanie `/email-confirmed` do PUBLIC_PATHS (obecnie brakuje)

### 2.4. Supabase Integration ✅

#### Server Client (`src/lib/supabase/server.ts`)
**Status:** ✅ Kompletny i zgodny z najlepszymi praktykami SSR

**Pozytywne aspekty:**
- ✅ Wykorzystanie `@supabase/ssr` (zgodnie z regułami Supabase Auth)
- ✅ Użycie TYLKO `getAll` i `setAll` (zgodnie z wymaganiami)
- ✅ Proper cookie options (httpOnly, secure, sameSite)
- ✅ Per-request client creation (brak singleton dla SSR)
- ✅ TypeScript typing z Database types

**Zgodność z regułami Supabase Auth:**
- ✅ Używa `@supabase/ssr` zamiast auth-helpers
- ✅ Używa TYLKO `getAll` i `setAll`
- ✅ Proper cookie management

#### Client (`src/db/supabase.client.ts`)
**Status:** ⚠️ Wymaga weryfikacji

**Uwagi:**
- Obecny plik używa starego podejścia (singleton)
- Dla SSR powinien być zastąpiony przez `src/lib/supabase/server.ts`
- Jeśli jest używany w komponentach React, należy utworzyć dedykowany browser client

**Rekomendacja:**
- Utworzyć `src/lib/supabase/client.ts` dla browser (zgodnie z regułami Supabase Auth)
- Usunąć lub zdeprecjonować `src/db/supabase.client.ts`

### 2.5. Pozostałe Endpointy Auth ✅

#### Register API (`src/pages/api/auth/register.ts`)
**Status:** ✅ Kompletny
- Walidacja z Zod schema
- Email verification flow
- Natychmiastowe wylogowanie po rejestracji
- Redirect URL z parametrem `next=email-confirmed`

#### Logout API (`src/pages/api/auth/logout.ts`)
**Status:** ✅ Kompletny
- Wykorzystuje `locals.supabase.auth.signOut()`
- Proper error handling

#### Callback Handler (`src/pages/auth/callback.ts`)
**Status:** ✅ Kompletny
- Obsługa PKCE flow (code exchange)
- Obsługa OTP flow (token_hash)
- Rozróżnienie między email confirmation a password reset
- Proper error handling i redirects

#### Forgot Password & Update Password
**Status:** ✅ Kompletne (na podstawie plików w projekcie)

### 2.6. TypeScript Types ✅

#### Environment Types (`src/env.d.ts`)
**Status:** ✅ Kompletny
- Definicja `Locals` z `supabase` i `user`
- Environment variables dla Supabase
- Proper typing dla Database

---

## 3. Analiza Zgodności z User Stories

### ✅ US-001: Rejestracja nowego użytkownika
**Status:** Zaimplementowane
- Formularz rejestracji z email i hasłem ✅
- Email weryfikacyjny ✅
- Przekierowanie po potwierdzeniu ✅
- Walidacja unikalności email ✅
- Walidacja formatu email ✅

### ✅ US-002: Logowanie użytkownika
**Status:** Zaimplementowane
- Formularz logowania ✅
- Link do rejestracji ✅
- Przekierowanie do dashboard/planners ✅
- Obsługa błędów ✅
- Link do resetu hasła ✅
- Wymóg logowania dla wszystkich stron ✅

### ✅ US-003: Reset hasła
**Status:** Zaimplementowane
- Link "Forgot password" ✅
- Email z linkiem resetu ✅
- Formularz nowego hasła ✅
- Przekierowanie po sukcesie ✅
- Wygaśnięcie linku ✅
- Zmiana hasła z UserMenu ✅

### ✅ US-011: Wylogowanie i bezpieczeństwo
**Status:** Zaimplementowane
- Wylogowanie z UserMenu ✅
- Czyszczenie sesji ✅
- Automatyczne wylogowanie (token expiry) ✅
- Przekierowanie do logowania ✅

---

## 4. Stan Bazy Danych i RLS

### 4.1. Aktualna Sytuacja ⚠️

**Problem:** RLS został wyłączony w migracji `20251016120600_disable_all_policies.sql`

**Konsekwencje:**
- ❌ Brak izolacji danych między użytkownikami
- ❌ Każdy zalogowany użytkownik ma dostęp do danych innych użytkowników
- ❌ Naruszenie wymagań bezpieczeństwa (US-011)
- ❌ Naruszenie GDPR compliance
- ❌ Brak zgodności z PRD (prywatność danych)

### 4.2. Stan Migracji

**Wykonane migracje:**
1. ✅ `20251016120000_create_initial_schema.sql` - Schemat tabel
2. ✅ `20251016120100_create_indexes.sql` - Indeksy
3. ✅ `20251016120200_enable_rls.sql` - Włączenie RLS
4. ✅ `20251016120300_create_rls_policies.sql` - Polityki RLS
5. ✅ `20251016120400_create_views.sql` - Views
6. ✅ `20251016120500_create_triggers.sql` - Triggery
7. ❌ `20251016120600_disable_all_policies.sql` - **WYŁĄCZENIE RLS**
8. ✅ `20251028163000_add_ready_status_and_single_active_plan.sql` - Status ready
9. ✅ `20260105130000_add_goal_milestone_references.sql` - Referencje
10. ✅ `20260110150000_update_database_limits.sql` - Limity

**Wniosek:** Polityki RLS są zdefiniowane w migracji #4, ale zostały wyłączone w migracji #7.

### 4.3. Analiza Polityk RLS

**Polityki zdefiniowane w `20251016120300_create_rls_policies.sql`:**

#### Tabela: `plans`
```sql
-- SELECT: auth.uid() = user_id
-- INSERT: auth.uid() = user_id
-- UPDATE: auth.uid() = user_id
-- DELETE: auth.uid() = user_id
```
**Status:** ✅ Poprawne - bezpośrednie porównanie user_id

#### Tabela: `long_term_goals`
```sql
-- SELECT/INSERT/UPDATE/DELETE: EXISTS (SELECT 1 FROM plans WHERE plans.id = long_term_goals.plan_id AND plans.user_id = auth.uid())
```
**Status:** ✅ Poprawne - weryfikacja przez relację z plans

#### Tabela: `milestones`
```sql
-- SELECT/INSERT/UPDATE/DELETE: EXISTS (SELECT 1 FROM long_term_goals JOIN plans ...)
```
**Status:** ✅ Poprawne - weryfikacja przez 2 joiny (goals -> plans)

#### Tabela: `weekly_goals`
```sql
-- SELECT/INSERT/UPDATE/DELETE: EXISTS (SELECT 1 FROM plans WHERE plans.id = weekly_goals.plan_id AND plans.user_id = auth.uid())
```
**Status:** ✅ Poprawne

#### Tabela: `tasks`
```sql
-- SELECT/INSERT/UPDATE/DELETE: EXISTS (SELECT 1 FROM plans WHERE plans.id = tasks.plan_id AND plans.user_id = auth.uid())
```
**Status:** ✅ Poprawne

#### Tabela: `task_history`
```sql
-- SELECT/INSERT: EXISTS (SELECT 1 FROM tasks JOIN plans ...)
-- No UPDATE/DELETE policies (history immutable)
```
**Status:** ✅ Poprawne

#### Tabela: `weekly_reviews`
```sql
-- SELECT/INSERT/UPDATE/DELETE: EXISTS (SELECT 1 FROM plans WHERE plans.id = weekly_reviews.plan_id AND plans.user_id = auth.uid())
```
**Status:** ✅ Poprawne

#### Tabela: `user_metrics`
```sql
-- SELECT/INSERT/UPDATE/DELETE: auth.uid() = user_id
```
**Status:** ✅ Poprawne

**Wniosek:** Wszystkie polityki RLS są poprawnie zdefiniowane i zgodne z wymaganiami bezpieczeństwa.

### 4.4. Triggery dla User Metrics

**Zdefiniowane triggery (w `20251016120500_create_triggers.sql`):**

1. ✅ `update_user_metrics_on_plan_creation` - Aktualizacja metryk po utworzeniu planera
2. ✅ `update_user_metrics_on_goal_completion` - Aktualizacja metryk po ukończeniu celu (100%)

**Status:** ✅ Triggery są zaimplementowane zgodnie z wymaganiami US-001 (metryki)

---

## 5. Plan Wdrożenia - Przywrócenie RLS

### 5.1. Priorytet: KRYTYCZNY 🔴

**Uzasadnienie:**
- Bezpieczeństwo danych użytkowników
- Zgodność z GDPR
- Zgodność z wymaganiami PRD (prywatność)
- Zgodność z US-011 (bezpieczeństwo)

### 5.2. Kroki Implementacji

#### Krok 1: Utworzenie Nowej Migracji - Re-enable RLS
**Plik:** `supabase/migrations/20260127000000_re_enable_rls.sql`

**Zawartość:**
```sql
-- Migration: Re-enable Row Level Security
-- Purpose: Restore RLS policies for data isolation and security
-- Affected tables: all core tables
-- Considerations: This migration restores the policies from 20251016120300_create_rls_policies.sql

-- ============================================================================
-- Re-create RLS policies for table: plans
-- ============================================================================

CREATE POLICY "Users can view own plans"
ON plans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own plans"
ON plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans"
ON plans FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans"
ON plans FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- Re-create RLS policies for table: long_term_goals
-- ============================================================================

CREATE POLICY "Users can view own goals"
ON long_term_goals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = long_term_goals.plan_id
    AND plans.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create goals in own plans"
ON long_term_goals FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = long_term_goals.plan_id
    AND plans.user_id = auth.uid()
  )
);

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

CREATE POLICY "Users can delete own goals"
ON long_term_goals FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = long_term_goals.plan_id
    AND plans.user_id = auth.uid()
  )
);

-- ============================================================================
-- Re-create RLS policies for table: milestones
-- ============================================================================

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

-- ============================================================================
-- Re-create RLS policies for table: weekly_goals
-- ============================================================================

CREATE POLICY "Users can view own weekly goals"
ON weekly_goals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = weekly_goals.plan_id
    AND plans.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create weekly goals in own plans"
ON weekly_goals FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = weekly_goals.plan_id
    AND plans.user_id = auth.uid()
  )
);

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

CREATE POLICY "Users can delete own weekly goals"
ON weekly_goals FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = weekly_goals.plan_id
    AND plans.user_id = auth.uid()
  )
);

-- ============================================================================
-- Re-create RLS policies for table: tasks
-- ============================================================================

CREATE POLICY "Users can view own tasks"
ON tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = tasks.plan_id
    AND plans.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create tasks in own plans"
ON tasks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = tasks.plan_id
    AND plans.user_id = auth.uid()
  )
);

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

CREATE POLICY "Users can delete own tasks"
ON tasks FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = tasks.plan_id
    AND plans.user_id = auth.uid()
  )
);

-- ============================================================================
-- Re-create RLS policies for table: task_history
-- ============================================================================

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

-- ============================================================================
-- Re-create RLS policies for table: weekly_reviews
-- ============================================================================

CREATE POLICY "Users can view own weekly reviews"
ON weekly_reviews FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = weekly_reviews.plan_id
    AND plans.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create weekly reviews in own plans"
ON weekly_reviews FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = weekly_reviews.plan_id
    AND plans.user_id = auth.uid()
  )
);

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

CREATE POLICY "Users can delete own weekly reviews"
ON weekly_reviews FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM plans
    WHERE plans.id = weekly_reviews.plan_id
    AND plans.user_id = auth.uid()
  )
);

-- ============================================================================
-- Re-create RLS policies for table: user_metrics
-- ============================================================================

CREATE POLICY "Users can view own metrics"
ON user_metrics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own metrics"
ON user_metrics FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own metrics"
ON user_metrics FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own metrics"
ON user_metrics FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- Verification: Check if RLS is enabled on all tables
-- ============================================================================

-- This query should return TRUE for all tables after migration
-- Run manually to verify:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

#### Krok 2: Weryfikacja Migracji

**Przed uruchomieniem:**
1. Backup bazy danych
2. Test na środowisku staging
3. Weryfikacja czy triggery działają poprawnie

**Po uruchomieniu:**
```sql
-- Sprawdź czy RLS jest włączony
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Sprawdź polityki
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

#### Krok 3: Testowanie RLS

**Test Cases:**

1. **Test izolacji danych:**
   - Utwórz dwóch użytkowników (User A, User B)
   - User A tworzy planer
   - User B próbuje odczytać planer User A
   - **Oczekiwany wynik:** User B nie widzi danych User A

2. **Test operacji CRUD:**
   - User A może tworzyć/odczytywać/aktualizować/usuwać swoje dane
   - **Oczekiwany wynik:** Wszystkie operacje działają poprawnie

3. **Test relacji:**
   - User A tworzy plan → goal → milestone → task
   - Sprawdź czy wszystkie polityki działają na całej hierarchii
   - **Oczekiwany wynik:** Dostęp tylko do własnych danych

4. **Test performance:**
   - Sprawdź czy polityki RLS nie spowalniają zapytań
   - Użyj `EXPLAIN ANALYZE` dla kluczowych zapytań
   - **Oczekiwany wynik:** Akceptowalna wydajność

#### Krok 4: Deployment

**Proces:**
1. Przegląd kodu migracji (peer review)
2. Backup produkcyjnej bazy danych
3. Test migracji na staging
4. Deployment na produkcję w oknie maintenance
5. Monitoring po deployment (logi, performance)
6. Rollback plan (jeśli coś pójdzie nie tak)

**Rollback Plan:**
Jeśli wystąpią problemy, można tymczasowo wyłączyć RLS:
```sql
-- TYLKO W PRZYPADKU KRYTYCZNEGO BŁĘDU
ALTER TABLE plans DISABLE ROW LEVEL SECURITY;
-- ... (pozostałe tabele)
```

---

## 6. Pozostałe Zadania i Integracje

### 6.1. Zadania Opcjonalne - Frontend

#### 1. Refaktoryzacja Supabase Client
**Priorytet:** Średni
**Opis:** Utworzenie dedykowanego browser client dla komponentów React

**Kroki:**
1. Utworzyć `src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/db/database.types';

export const createBrowserSupabaseClient = () => {
  return createBrowserClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  );
};
```

2. Zaktualizować komponenty React aby używały nowego clienta
3. Usunąć lub zdeprecjonować `src/db/supabase.client.ts`

#### 2. Dodanie `/email-confirmed` do PUBLIC_PATHS
**Priorytet:** Niski
**Opis:** Dodać `/email-confirmed` do listy publicznych ścieżek w middleware

**Zmiana w `src/middleware/index.ts`:**
```typescript
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/update-password',
  '/email-confirmed', // <- Dodać
  '/auth/callback',
  // ... API endpoints
];
```

#### 3. Custom Hook dla Walidacji
**Priorytet:** Niski (optymalizacja)
**Opis:** Ekstrakcja logiki walidacji do custom hook

**Przykład:**
```typescript
// src/components/hooks/useLoginValidation.ts
export function useLoginValidation() {
  const validate = useCallback((formData: LoginFormData) => {
    // ... validation logic
  }, []);
  
  return { validate };
}
```

### 6.2. Zadania Opcjonalne - Backend

#### 1. Rate Limiting dla Login Endpoint
**Priorytet:** Średni (security)
**Opis:** Dodanie rate limiting dla ochrony przed brute-force attacks

**Implementacja:**
- Użyć middleware lub Supabase Edge Functions
- Limit: np. 5 prób logowania na 15 minut
- Zwracać HTTP 429 (Too Many Requests)

#### 2. Audit Logging
**Priorytet:** Niski (dla przyszłości)
**Opis:** Logowanie ważnych zdarzeń (login, logout, failed attempts)

**Implementacja:**
- Utworzyć tabelę `audit_logs`
- Trigger lub application-level logging
- Przechowywać: user_id, action, timestamp, IP, user_agent

### 6.3. Zadania Opcjonalne - Baza Danych

#### 1. Optymalizacja Polityk RLS
**Priorytet:** Niski (po wdrożeniu RLS)
**Opis:** Monitorowanie i optymalizacja wydajności polityk RLS

**Kroki:**
1. Użyć `EXPLAIN ANALYZE` dla kluczowych zapytań
2. Sprawdzić czy indeksy są wykorzystywane
3. Rozważyć materialized views dla złożonych polityk

#### 2. Backup Strategy
**Priorytet:** Średni
**Opis:** Weryfikacja i dokumentacja strategii backupu

**Elementy:**
- Automated daily backups (Supabase)
- Manual export scripts (pg_dump)
- Retention policy (7 dni dla free tier)
- Recovery testing (test restore)

### 6.4. Zadania Opcjonalne - Testing

#### 1. Integration Tests dla Auth Flow
**Priorytet:** Średni
**Opis:** Testy end-to-end dla pełnego flow autentykacji

**Test Cases:**
- Registration → Email verification → Login
- Login → Access protected route
- Logout → Redirect to login
- Forgot password → Reset → Login

#### 2. RLS Policy Tests
**Priorytet:** Wysoki (po wdrożeniu RLS)
**Opis:** Testy jednostkowe dla polityk RLS

**Narzędzia:**
- pgTAP dla PostgreSQL
- Supabase Test Helpers

### 6.5. Zadania Opcjonalne - Documentation

#### 1. API Documentation
**Priorytet:** Niski
**Opis:** Dokumentacja wszystkich endpointów auth API

**Format:** OpenAPI/Swagger lub Markdown

#### 2. User Guide
**Priorytet:** Niski
**Opis:** Instrukcja dla użytkowników (rejestracja, logowanie, reset hasła)

---

## 7. Podsumowanie Stanu Prac

### 7.1. Zakończone Zadania ✅

**Frontend:**
- ✅ Strona logowania (`/login`)
- ✅ Komponent LoginForm z walidacją
- ✅ Strona rejestracji (`/register`)
- ✅ Komponent RegisterForm
- ✅ Strona forgot password (`/forgot-password`)
- ✅ Strona update password (`/update-password`)
- ✅ Email confirmation page (`/email-confirmed`)
- ✅ AuthLayout dla stron auth
- ✅ Integracja z Shadcn UI
- ✅ Toast notifications (Sonner)

**Backend:**
- ✅ API endpoint: `/api/auth/login`
- ✅ API endpoint: `/api/auth/register`
- ✅ API endpoint: `/api/auth/logout`
- ✅ API endpoint: `/api/auth/forgot-password`
- ✅ API endpoint: `/api/auth/update-password`
- ✅ Callback handler: `/auth/callback`
- ✅ Middleware z auth guard
- ✅ Supabase SSR integration
- ✅ Walidacja z Zod
- ✅ Email verification flow
- ✅ Password reset flow

**Baza Danych:**
- ✅ Schemat tabel
- ✅ Indeksy
- ✅ Views
- ✅ Triggery (updated_at, user_metrics)
- ✅ Definicje polityk RLS (w migracji)

**Dokumentacja:**
- ✅ Specyfikacja techniczna (auth-spec.md)
- ✅ Dokumentacja forgot password flow
- ✅ Dokumentacja registration confirmation fix

### 7.2. Zadania Krytyczne do Wykonania 🔴

1. **Przywrócenie RLS w bazie danych** (PRIORYTET 1)
   - Utworzenie migracji `20260127000000_re_enable_rls.sql`
   - Testowanie polityk RLS
   - Deployment na produkcję

### 7.3. Zadania Opcjonalne do Rozważenia

**Wysoki priorytet:**
- Testy RLS policies
- Rate limiting dla login endpoint

**Średni priorytet:**
- Refaktoryzacja Supabase client (browser vs server)
- Backup strategy verification
- Integration tests dla auth flow

**Niski priorytet:**
- Custom hooks dla walidacji
- Audit logging
- API documentation
- User guide

---

## 8. Metryki Sukcesu

### 8.1. Metryki Techniczne

**Bezpieczeństwo:**
- ✅ RLS włączony na wszystkich tabelach
- ✅ Polityki RLS działają poprawnie (100% test coverage)
- ✅ Brak wycieków danych między użytkownikami
- ✅ Proper cookie management (httpOnly, secure, sameSite)

**Wydajność:**
- ✅ Czas odpowiedzi login endpoint < 500ms (p95)
- ✅ Polityki RLS nie spowalniają zapytań > 10%
- ✅ Brak błędów 500 w production

**Funkcjonalność:**
- ✅ Wszystkie User Stories (US-001, US-002, US-003, US-011) zaimplementowane
- ✅ Email verification flow działa
- ✅ Password reset flow działa
- ✅ Middleware poprawnie chroni trasy

### 8.2. Metryki Biznesowe (z PRD)

**Z User Stories:**
- 90% zarejestrowanych użytkowników tworzy co najmniej 1 planer
- 50% użytkowników realizuje co najmniej 1 cel na 100% w pierwszym planerze
- Czas sesji >5 min dla 70% wizyt

**Tracking:**
- Flaga `first_planner_created` w `user_metrics` ✅
- Flaga `first_planner_completed` w `user_metrics` ✅
- Triggery aktualizujące metryki ✅

---

## 9. Harmonogram Wdrożenia

### Faza 1: Przywrócenie RLS (KRYTYCZNE)
**Czas: 1-2 dni**

**Dzień 1:**
- Utworzenie migracji `20260127000000_re_enable_rls.sql`
- Przegląd kodu (peer review)
- Backup bazy danych
- Test na staging

**Dzień 2:**
- Deployment na produkcję
- Weryfikacja polityk RLS
- Testy izolacji danych
- Monitoring performance

### Faza 2: Testy i Weryfikacja (WAŻNE)
**Czas: 2-3 dni**

- Testy RLS policies (pgTAP)
- Integration tests dla auth flow
- Performance testing
- Security audit

### Faza 3: Optymalizacje (OPCJONALNE)
**Czas: 3-5 dni**

- Rate limiting
- Refaktoryzacja Supabase client
- Audit logging
- Documentation

---

## 10. Ryzyka i Mitigation

### Ryzyko 1: Problemy z wydajnością po włączeniu RLS
**Prawdopodobieństwo:** Średnie
**Impact:** Średni

**Mitigation:**
- Testowanie performance przed deployment
- Monitoring po deployment
- Optymalizacja indeksów jeśli potrzebne
- Rollback plan gotowy

### Ryzyko 2: Błędy w politykach RLS
**Prawdopodobieństwo:** Niskie
**Impact:** Wysoki (wyciek danych)

**Mitigation:**
- Dokładne testy izolacji danych
- Peer review migracji
- Test na staging z realnymi danymi
- Automated tests dla polityk

### Ryzyko 3: Breaking changes dla istniejących użytkowników
**Prawdopodobieństwo:** Niskie
**Impact:** Wysoki

**Mitigation:**
- Migracja nie zmienia struktury danych
- Tylko dodaje polityki RLS
- Istniejące zapytania powinny działać bez zmian
- Backup przed deployment

---

## 11. Wnioski

### 11.1. Stan Implementacji

**Ogólna ocena:** ✅ Bardzo dobra

Implementacja modułu autentykacji jest w dużej mierze kompletna i zgodna z najlepszymi praktykami:
- Frontend wykorzystuje nowoczesne podejście React z hooks
- Backend wykorzystuje SSR z Astro i proper Supabase integration
- Middleware zapewnia ochronę tras
- Wszystkie User Stories są zaimplementowane
- Kod jest zgodny z regułami projektu (Astro, React, Backend)

### 11.2. Główne Zadanie

**Krytyczne:** Przywrócenie RLS w bazie danych

Jest to jedyne krytyczne zadanie pozostałe do wykonania. Polityki RLS są już zdefiniowane w migracji `20251016120300_create_rls_policies.sql`, ale zostały wyłączone w późniejszej migracji. Wystarczy je przywrócić poprzez nową migrację.

### 11.3. Rekomendacje

1. **Natychmiast:** Wdrożyć migrację przywracającą RLS (Faza 1)
2. **W najbliższym czasie:** Przeprowadzić testy RLS policies (Faza 2)
3. **Opcjonalnie:** Rozważyć implementację rate limiting i audit logging (Faza 3)

### 11.4. Zgodność z PRD i User Stories

**Wszystkie wymagania spełnione:**
- ✅ US-001: Rejestracja z weryfikacją email
- ✅ US-002: Logowanie z przekierowaniem
- ✅ US-003: Reset hasła i zmiana hasła
- ✅ US-011: Wylogowanie i bezpieczeństwo (po wdrożeniu RLS)

**Metryki:**
- ✅ Triggery dla user_metrics działają
- ✅ Tracking first_planner_created i first_planner_completed

---

## 12. Kontakt i Pytania

Jeśli masz pytania dotyczące tego planu lub potrzebujesz dodatkowych informacji:

1. Sprawdź dokumentację:
   - `docs/auth/auth-spec.md` - Specyfikacja techniczna
   - `docs/prd.md` - Wymagania produktowe
   - `.cursor/rules/supabase-auth.mdc` - Reguły integracji Supabase

2. Przejrzyj kod:
   - `src/pages/login.astro` - Strona logowania
   - `src/pages/api/auth/login.ts` - API endpoint
   - `src/middleware/index.ts` - Auth middleware
   - `supabase/migrations/` - Migracje bazy danych

3. Testy:
   - Uruchom aplikację lokalnie: `npm run dev`
   - Przetestuj flow logowania
   - Sprawdź logi w konsoli przeglądarki i terminalu

---

**Dokument utworzony:** 2026-01-27
**Wersja:** 1.0
**Status:** Gotowy do wdrożenia
