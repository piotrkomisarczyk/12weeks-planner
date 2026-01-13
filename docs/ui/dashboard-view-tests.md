# Testy Manualne - Widok Dashboard Planera

## Wprowadzenie

Ten dokument zawiera kompleksową listę testów manualnych dla widoku Dashboard Planera 12-tygodniowego. Testy obejmują funkcjonalność, interakcje użytkownika, obsługę błędów oraz przypadki brzegowe.

## Struktura Testów

Testy są podzielone na kategorie:
- **Funkcjonalność podstawowa** - ładowanie danych, wyświetlanie
- **Interakcje użytkownika** - nawigacja, filtry, rozwijanie drzewa
- **Obsługa błędów** - błędy API, brak danych, błędy walidacji
- **Responsywność** - różne rozmiary ekranów
- **Dostępność** - obsługa klawiatury, czytniki ekranowe

## 1. Funkcjonalność Podstawowa

### 1.1 Ładowanie Dashboardu

#### Test: Ładowanie dashboardu z istniejącym planem
**Warunki wstępne:**
- Użytkownik jest zalogowany
- Istnieje plan z przynajmniej jednym celem

**Kroki:**
1. Przejdź do `/plans/[planId]`
2. Obserwuj ładowanie strony

**Oczekiwane rezultaty:**
- ✅ Wyświetla się animacja ładowania (skeleton)
- ✅ Po załadowaniu widoczny jest nagłówek z nazwą planu
- ✅ Wyświetlane są metryki (cele, zadania, postęp)
- ✅ Widoczny jest panel szybkich akcji
- ✅ Wyświetlane jest drzewo hierarchii

#### Test: Ładowanie pustego dashboardu
**Warunki wstępne:**
- Użytkownik jest zalogowany
- Istnieje pusty plan (bez celów)

**Kroki:**
1. Przejdź do `/plans/[emptyPlanId]`

**Oczekiwane rezultaty:**
- ✅ Wyświetla się stan pusty (EmptyState)
- ✅ Widoczna jest zachęta do stworzenia pierwszego celu
- ✅ Dostępne są przyciski "Create Your First Goal" i "View Planning Wizard"

### 1.2 Wyświetlanie Metryk

#### Test: Wyświetlanie poprawnych metryk
**Warunki wstępne:**
- Plan zawiera cele, zadania w różnych statusach

**Kroki:**
1. Sprawdź wartości w nagłówku dashboardu
2. Porównaj z danymi w bazie/API

**Oczekiwane rezultaty:**
- ✅ Liczba celów całkowita jest prawidłowa
- ✅ Liczba ukończonych celów jest prawidłowa
- ✅ Liczba zadań całkowita jest prawidłowa
- ✅ Liczba ukończonych zadań jest prawidłowa
- ✅ Pasek postępu pokazuje prawidłowy procent

## 2. Interakcje Użytkownika

### 2.1 Panel Szybkich Akcji

#### Test: Nawigacja do bieżącego tygodnia
**Kroki:**
1. Kliknij przycisk "Current Week"
2. Sprawdź czy zostaniesz przekierowany do `/plans/[id]/week/[currentWeek]`

**Oczekiwane rezultaty:**
- ✅ Przekierowanie do poprawnego URL
- ✅ Numer tygodnia odpowiada obliczonemu bieżącemu tygodniowi

#### Test: Nawigacja do celów
**Kroki:**
1. Kliknij przycisk "Goals View"
2. Sprawdź przekierowanie

**Oczekiwane rezultaty:**
- ✅ Przekierowanie do `/plans/[id]/goals`

#### Test: Nawigacja do podsumowania
**Kroki:**
1. Kliknij przycisk "Summary"
2. Sprawdź przekierowanie

**Oczekiwane rezultaty:**
- ✅ Przekierowanie do `/plans/[id]/review/1`

### 2.2 Drzewo Hierarchii

#### Test: Rozwijanie/rozwijanie węzłów
**Kroki:**
1. Znajdź węzeł z dziećmi (ma strzałkę)
2. Kliknij strzałkę/rozwijaną sekcję
3. Sprawdź animację

**Oczekiwane rezultaty:**
- ✅ Węzeł się rozwija/zwinie z animacją
- ✅ Ikona strzałki się zmienia (ChevronRight/ChevronDown)
- ✅ Dzieci są widoczne/ukryte

#### Test: Nawigacja z węzłów drzewa

##### Test: Kliknięcie w cel
**Kroki:**
1. Kliknij w tytuł węzła typu "goal"
2. Sprawdź przekierowanie

**Oczekiwane rezultaty:**
- ✅ Przekierowanie do `/plans/[id]/goals` ze scroll do odpowiedniego celu

##### Test: Kliknięcie w kamień milowy
**Kroki:**
1. Kliknij w tytuł węzła typu "milestone"

**Oczekiwane rezultaty:**
- ✅ Przekierowanie do `/plans/[id]/goals`

##### Test: Kliknięcie w cel tygodniowy
**Kroki:**
1. Kliknij w tytuł węzła typu "weekly_goal"

**Oczekiwane rezultaty:**
- ✅ Przekierowanie do `/plans/[id]/week/[weekNumber]`

##### Test: Kliknięcie w zadanie
**Kroki:**
1. Kliknij w tytuł węzła typu "task"

**Oczekiwane rezultaty:**
- ✅ Jeśli zadanie ma due_day: przekierowanie do `/plans/[id]/week/[week]/day/[day]`
- ✅ Jeśli nie ma due_day: przekierowanie do `/plans/[id]/week/[week]`

### 2.3 Filtry

#### Test: Filtr "Show completed"
**Warunki wstępne:**
- Plan zawiera ukończone i nieukończone elementy

**Kroki:**
1. Domyślnie filtr jest wyłączony
2. Włącz filtr "Show completed"
3. Sprawdź drzewo

**Oczekiwane rezultaty:**
- ✅ Ukończone elementy stają się widoczne
- ✅ Status "completed" ma zielony kolor i ikonę CheckCircle

#### Test: Filtr "Show all weeks"
**Warunki wstępne:**
- Plan ma elementy z różnych tygodni

**Kroki:**
1. Domyślnie filtr jest wyłączony
2. Włącz filtr "Show all weeks"
3. Sprawdź drzewo

**Oczekiwane rezultaty:**
- ✅ Elementy z przyszłych tygodni stają się widoczne
- ✅ Elementy z przeszłych tygodni stają się widoczne

## 3. Obsługa Błędów

### 3.1 Błędy API

#### Test: Błąd 404 - plan nie istnieje
**Warunki wstępne:**
- Próba dostępu do nieistniejącego planu

**Kroki:**
1. Przejdź do `/plans/non-existent-id`

**Oczekiwane rezultaty:**
- ✅ Przekierowanie do listy planów lub komunikat błędu

#### Test: Błąd 500 - błąd serwera
**Warunki wstępne:**
- Symuluj błąd API (np. wyłącz bazę danych)

**Kroki:**
1. Odśwież stronę

**Oczekiwane rezultaty:**
- ✅ Wyświetla się komunikat błędu
- ✅ Dostępny jest przycisk "Try again"
- ✅ Po kliknięciu próba ponownego załadowania

### 3.2 Błędy Walidacji

#### Test: Nieprawidłowy planId
**Kroki:**
1. Przejdź do `/plans/invalid-id`

**Oczekiwane rezultaty:**
- ✅ Odpowiednia obsługa błędu

## 4. Responsywność

### 4.1 Desktop (>1024px)
**Kroki:**
1. Sprawdź layout na dużym ekranie

**Oczekiwane rezultaty:**
- ✅ Wszystkie komponenty są obok siebie
- ✅ Nagłówek z metrykami w jednym rzędzie
- ✅ Panel akcji w grid 4 kolumny
- ✅ Cele w grid 3 kolumny

### 4.2 Tablet (768px - 1024px)
**Kroki:**
1. Zmień rozmiar okna przeglądarki

**Oczekiwane rezultaty:**
- ✅ Metryki w nagłówku dostosowują się
- ✅ Panel akcji w 2 kolumny
- ✅ Cele w 2 kolumny

### 4.3 Mobile (<768px)
**Kroki:**
1. Zmień rozmiar okna przeglądarki

**Oczekiwane rezultaty:**
- ✅ Metryki w nagłówku jedna pod drugą
- ✅ Panel akcji jedna kolumna
- ✅ Cele jedna kolumna
- ✅ Drzewo ma odpowiednie wcięcia

## 5. Dostępność

### 5.1 Nawigacja Klawiaturą

#### Test: Focus management
**Kroki:**
1. Użyj Tab do nawigacji po elementach

**Oczekiwane rezultaty:**
- ✅ Wszystkie interaktywne elementy są focusowalne
- ✅ Focus indicator jest widoczny
- ✅ Kolejność focus jest logiczna

#### Test: Keyboard shortcuts dla drzewa
**Kroki:**
1. Użyj strzałek do nawigacji po drzewie
2. Użyj Enter/Space do rozwijania

**Oczekiwane rezultaty:**
- ✅ Arrow keys poruszają focus po węzłach
- ✅ Enter/Space rozwija/zwinie węzły
- ✅ Escape zamyka rozwinięte węzły

### 5.2 Czytniki Ekranowe

#### Test: ARIA labels
**Kroki:**
1. Użyj czytnika ekranowego do sprawdzenia

**Oczekiwane rezultaty:**
- ✅ Wszystkie przyciski mają odpowiednie labels
- ✅ Statusy są ogłoszone
- ✅ Progres jest opisany

## 6. Wydajność

### 6.1 Ładowanie Danych

#### Test: Czas ładowania
**Warunki wstępne:**
- Plan z dużą ilością danych

**Kroki:**
1. Zmierz czas ładowania strony

**Oczekiwane rezultaty:**
- ✅ Ładowanie trwa mniej niż 2 sekundy
- ✅ Skeleton wyświetla się płynnie

#### Test: Lazy loading filtrów
**Kroki:**
1. Włącz/wyłącz filtry
2. Sprawdź czy nie ma dodatkowych zapytań API

**Oczekiwane rezultaty:**
- ✅ Filtrowanie działa po stronie klienta
- ✅ Brak dodatkowych zapytań do API

## 7. Przypadki Brzegowe

### 7.1 Puste Stany

#### Test: Plan bez celów
**Oczekiwane rezultaty:**
- ✅ EmptyState wyświetla się poprawnie
- ✅ Przyciski działają

#### Test: Cele bez zadań
**Oczekiwane rezultaty:**
- ✅ Cele wyświetlane z 0 zadań
- ✅ Hierarchia poprawna

### 7.2 Statusy

#### Test: Wszystkie statusy zadań
**Warunki wstępne:**
- Plan z zadaniami w różnych statusach

**Oczekiwane rezultaty:**
- ✅ Każdy status ma odpowiedni kolor
- ✅ Każdy status ma odpowiednią ikonę
- ✅ Status "cancelled" ma przekreślenie

### 7.3 Daty i Tygodnie

#### Test: Plan w pierwszym tygodniu
**Oczekiwane rezultaty:**
- ✅ Current week = 1
- ✅ Wszystkie elementy widoczne domyślnie

#### Test: Plan w ostatnim tygodniu
**Oczekiwane rezultaty:**
- ✅ Current week = 12
- ✅ Wszystkie tygodnie dostępne

#### Test: Przeszłe daty
**Warunki wstępne:**
- Plan rozpoczęty w przeszłości

**Oczekiwane rezultaty:**
- ✅ Current week obliczony poprawnie
- ✅ Przeszłe tygodnie ukryte domyślnie

## Checklist Końcowy

- [ ] Wszystkie testy funkcjonalności podstawowej przechodzą
- [ ] Wszystkie interakcje użytkownika działają
- [ ] Obsługa błędów jest kompletna
- [ ] Layout jest responsywny na wszystkich urządzeniach
- [ ] Aplikacja jest dostępna dla użytkowników z niepełnosprawnościami
- [ ] Wydajność jest akceptowalna
- [ ] Wszystkie przypadki brzegowe są obsłużone