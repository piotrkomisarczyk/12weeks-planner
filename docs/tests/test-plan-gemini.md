# Plan Testów: 12 Weeks Planner (MVP)

**Wersja:** 1.0  
**Data:** 26 stycznia 2026 r.  
**Przygotowane przez:** Senior QA Engineer

## 1. Wprowadzenie i cele testowania
Niniejszy dokument określa strategię i zakres testów dla aplikacji **12 Weeks Planner**. Głównym celem jest zapewnienie wysokiej jakości wersji MVP, zweryfikowanie poprawności implementacji metodologii "12 Week Year" oraz zagwarantowanie pełnego bezpieczeństwa danych użytkowników w oparciu o infrastrukturę Supabase.

### Cele szczegółowe:
*   Weryfikacja pełnego przepływu autentykacji (rejestracja -> weryfikacja -> logowanie).
*   Potwierdzenie szczelności polityk Row Level Security (RLS) – całkowita izolacja danych.
*   Walidacja limitów biznesowych egzekwowanych przez triggery bazy danych (np. max 6 celów).
*   Sprawdzenie poprawności działania mechanizmów "auto-save" i optymistycznych aktualizacji UI.
*   Weryfikacja poprawności obliczeń dat i numeracji tygodni w cyklu 12-tygodniowym.

## 2. Zakres testów

### W zakresie (In Scope):
*   **Moduł Auth:** Rejestracja, logowanie, reset hasła, weryfikacja e-mail, callbacki PKCE.
*   **Zarządzanie Planami:** Tworzenie, aktywacja, archiwizacja i usuwanie planów.
*   **Zarządzanie Celami:** CRUD celów i kamieni milowych (milestones).
*   **Planowanie Tygodniowe i Dzienne:** Zadania ad-hoc, cele tygodniowe, priorytety A/B/C, stany zadań.
*   **Podsumowania (Weekly Review):** Formularz refleksji, aktualizacja postępów celów.
*   **Widoki:** Dashboard, Hierarchia (Tree View), widok tygodnia i dnia.
*   **Eksport Danych:** Funkcjonalność eksportu JSON (zgodność z RODO).

### Poza zakresem (Out of Scope):
*   Współdzielenie planerów między użytkownikami.
*   Aplikacja mobilna (testujemy tylko Desktop).
*   Integracje z kalendarzami zewnętrznymi (Google/Outlook).

## 3. Typy testów

### 3.1. Testy Jednostkowe (Unit Tests)
*   **Walidacja:** Testy schematów Zod (`src/lib/validation`).
*   **Logika Biznesowa:** Testy usług (`src/lib/services`) – obliczenia postępu, transformacje danych.
*   **Utils:** Testy `plan-utils.ts` i `position-utils.ts` (poprawność kodowania pozycji `weekOrder * 100 + dayRank`).

### 3.2. Testy Integracyjne
*   **API vs Database:** Weryfikacja endpointów `/api/v1/*` z rzeczywistą bazą Supabase.
*   **Triggery DB:** Testowanie wymuszania limitów (np. próba dodania 7. celu musi zwrócić błąd 400).
*   **Auth Flow:** Integracja middleware Astro z sesją Supabase.

### 3.3. Testy Systemowe i E2E (End-to-End)
*   Kompletne ścieżki użytkownika: od rejestracji do wypełnienia 12. tygodnia planu.
*   Testy Drag-and-Drop w widoku tygodnia i dnia.

### 3.4. Testy Bezpieczeństwa (Security)
*   **RLS Audit:** Próba dostępu do `plan_id` użytkownika A przez zalogowanego użytkownika B.
*   **Unverified Email Access:** Próba dostępu do `/plans` bez potwierdzonego adresu e-mail.

### 3.5. Testy Wydajnościowe
*   Weryfikacja czasu odpowiedzi endpointu `/dashboard` przy dużej liczbie zadań (powyżej 100).
*   Weryfikacja czasu generowania pliku eksportu danych.

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1. Autentykacja i Autoryzacja (Auth)
*   **SC-AUTH-01:** Rejestracja z hasłem niespełniającym wymogów (brak cyfry/wielkiej litery) – oczekiwany błąd walidacji.
*   **SC-AUTH-02:** Logowanie na konto z niepotwierdzonym e-mailem – oczekiwany błąd 403 (EMAIL_NOT_VERIFIED).
*   **SC-AUTH-03:** Próba dostępu do `/plans/[id]` przez nieuprawnionego użytkownika – oczekiwany błąd 404 (Security by Obscurity).

### 4.2. Zarządzanie Planem (Plan Management)
*   **SC-PLAN-01:** Tworzenie planu z datą startu inną niż poniedziałek – oczekiwany błąd triggera DB.
*   **SC-PLAN-02:** Aktywacja planu B, gdy plan A jest aktywny – oczekiwana automatyczna zmiana statusu planu A na `ready`.
*   **SC-PLAN-03:** Usunięcie planu – weryfikacja kaskadowego usunięcia wszystkich celów, zadań i historii z bazy.

### 4.3. Hierarchia i Zadania (Tasks)
*   **SC-TASK-01:** Próba dodania 11. zadania do konkretnego dnia – blokada UI i błąd 400 z API.
*   **SC-TASK-02:** Zmiana priorytetu zadania w widoku dnia z C na A – weryfikacja automatycznego przeniesienia do slotu "Most Important".
*   **SC-TASK-03:** Kopiowanie zadania z poniedziałku na wtorek – sprawdzenie, czy historia statusów została zachowana, a status nowego zadania zresetowany do `todo`.

### 4.4. Podsumowanie Tygodnia (Weekly Review)
*   **SC-REV-01:** Auto-save: wpisanie refleksji, odczekanie 1500ms, odświeżenie strony – dane muszą zostać zachowane.
*   **SC-REV-02:** Aktualizacja postępu celu do 100% – weryfikacja wyzwolenia animacji konfetti i zapisu w bazie.

## 5. Środowisko testowe
*   **Lokalne:** Node.js 22.14.0, Supabase CLI (Local Docker instance).
*   **Staging:** Środowisko odizolowane na DigitalOcean (Docker) połączone z testowym projektem Supabase Cloud.
*   **Przeglądarki:** Chrome (Latest), Firefox (Latest), Safari (macOS).

## 6. Narzędzia do testowania
*   **Vitest:** Testy jednostkowe logiki i walidacji.
*   **Playwright:** Testy E2E oraz testy wizualne (Visual Regression).
*   **Supabase Dashboard / SQL Editor:** Weryfikacja stanów bazy i polityk RLS.
*   **Postman/REST Client:** Testy manualne endpointów API (wykorzystanie plików `.http` z katalogu `api-tests/`).
*   **Axe-core:** Audyt dostępności (ARIA labels).

## 7. Harmonogram testów

| Faza | Opis | Czas trwania |
|------|------|--------------|
| **Faza 1** | Testy API i Triggery DB (Sanity Check) | 2 dni |
| **Faza 2** | Testy modułu Auth i izolacji danych (RLS) | 2 dni |
| **Faza 3** | Testy funkcjonalne widoków Plan/Goal/Task | 4 dni |
| **Faza 4** | Testy interakcji (DnD, Auto-save, Confetti) | 2 dni |
| **Faza 5** | Testy regresji i Bug Fixing | 3 dni |

## 8. Kryteria akceptacji testów
*   100% scenariuszy krytycznych (Auth, Plan Management) zakończonych sukcesem.
*   Brak błędów typu "Critical" i "High" w raporcie końcowym.
*   Potwierdzona izolacja danych – brak możliwości wycieku danych między `user_id`.
*   Poprawne wyświetlanie na Desktop (zgodnie z założeniem Desktop First).
*   Czas ładowania Dashboardu poniżej 1.5s w sieci 4G/LTE.

## 9. Role i odpowiedzialności
*   **Lead QA:** Nadzór nad strategią, testy bezpieczeństwa (RLS), raport końcowy.
*   **Developer:** Pisanie testów jednostkowych, naprawa błędów, utrzymanie środowiska testowego.
*   **Product Owner:** Akceptacja scenariuszy biznesowych, testy UAT (User Acceptance Testing).

## 10. Procedury raportowania błędów
Wszystkie błędy należy zgłaszać w systemie trackingowym (np. GitHub Issues) według szablonu:
1.  **Tytuł:** [Moduł] Krótki opis problemu.
2.  **Priorytet:** Critical / High / Medium / Low.
3.  **Kroki do reprodukcji:** Dokładna instrukcja.
4.  **Oczekiwany wynik:** Co powinno się stać.
5.  **Rzeczywisty wynik:** Co się stało (załączyć screen/logi).
6.  **Środowisko:** (np. Local, Chrome v120).

---
*Zatwierdzono przez: Senior QA Engineer*  
*Status: Gotowy do rozpoczęcia testów Fazy 1.*