# Plan testów manualnych - Widok Podsumowania Tygodnia (Weekly Review)

## 1. Przegląd

Ten dokument zawiera szczegółowy plan testów manualnych dla widoku podsumowania tygodnia. Testy obejmują wszystkie funkcjonalności zaimplementowane zgodnie z planem implementacji, w tym:

- Nawigację między tygodniami
- Auto-save pól refleksji
- Aktualizację postępu celów
- Oznaczanie recenzji jako ukończonej
- Obsługę błędów i przypadki brzegowe

## 2. Warunki wstępne testowania

### Dane testowe
- **Plan**: Istniejący plan z co najmniej 3 celami długoterminowymi
- **Tygodnie**: Dostępne tygodnie 1-12 w planie
- **Recenzje**: Niektóre tygodnie bez recenzji (dla testów lazy creation)

### Środowisko testowe
- **Browser**: Chrome/Firefox/Safari
- **Network**: Stabilne połączenie internetowe
- **Console**: Dostęp do developer tools dla monitorowania błędów

## 3. Scenariusze testowe

### 3.1 Testy nawigacji między tygodniami

#### Test WN-001: Nawigacja przyciskami Previous/Next
**Opis**: Sprawdzenie nawigacji między tygodniami przy użyciu przycisków strzałek.

**Kroki**:
1. Przejdź do `/plans/[planId]/review/5`
2. Kliknij przycisk "Next Week"
3. Sprawdź czy URL zmienił się na `/plans/[planId]/review/6`
4. Kliknij przycisk "Previous Week"
5. Sprawdź czy URL zmienił się z powrotem na `/plans/[planId]/review/5`

**Oczekiwany wynik**:
- Nawigacja działa poprawnie
- Przyciski są odpowiednio włączone/wyłączone na brzegach (1-12)

#### Test WN-002: Nawigacja dropdown Select
**Opis**: Sprawdzenie wyboru tygodnia przez dropdown.

**Kroki**:
1. Przejdź do `/plans/[planId]/review/1`
2. Otwórz dropdown Select
3. Wybierz tydzień 8
4. Sprawdź czy URL zmienił się na `/plans/[planId]/review/8`

**Oczekiwany wynik**:
- Dropdown pokazuje wszystkie tygodnie 1-12
- Wybrany tydzień jest podświetlony
- Nawigacja działa natychmiast

#### Test WN-003: Walidacja zakresu tygodni
**Opis**: Sprawdzenie obsługi nieprawidłowych numerów tygodni.

**Kroki**:
1. Spróbuj przejść bezpośrednio do URL `/plans/[planId]/review/0`
2. Spróbuj przejść bezpośrednio do URL `/plans/[planId]/review/13`
3. Spróbuj przejść bezpośrednio do URL `/plans/[planId]/review/abc`

**Oczekiwany wynik**:
- Aplikacja pokazuje błąd 404 lub przekierowuje
- Nie ma crash aplikacji

### 3.2 Testy auto-save pól refleksji

#### Test AS-001: Tworzenie nowej recenzji (lazy creation)
**Opis**: Sprawdzenie tworzenia recenzji przy pierwszej edycji.

**Kroki**:
1. Przejdź do tygodnia, który nie ma jeszcze recenzji
2. Wpisz tekst w polu "What worked well this week?"
3. Poczekaj 1-2 sekundy na auto-save
4. Odśwież stronę
5. Sprawdź czy tekst został zapisany

**Oczekiwany wynik**:
- Tekst zostaje zapisany automatycznie
- Po odświeżeniu tekst jest nadal widoczny
- Status pokazuje "Last saved: [timestamp]"

#### Test AS-002: Aktualizacja istniejącej recenzji
**Opis**: Sprawdzenie aktualizacji pól w istniejącej recenzji.

**Kroki**:
1. Przejdź do tygodnia z istniejącą recenzją
2. Edytuj tekst w polu "What didn't work or could be improved?"
3. Poczekaj na auto-save
4. Edytuj tekst w innym polu
5. Sprawdź czy oba pola zostały zapisane

**Oczekiwany wynik**:
- Wszystkie zmiany są zapisywane automatycznie
- Status pokazuje "Saving..." podczas zapisywania
- Status zmienia się na "Last saved: [timestamp]" po zapisie

#### Test AS-003: Debounced save - szybka edycja
**Opis**: Sprawdzenie działania debounce przy szybkich zmianach.

**Kroki**:
1. Wpisz tekst szybko w jednym polu (kilka zmian w <1s)
2. Sprawdź czy nie ma wielu wywołań API
3. Poczekaj na zakończenie debounce
4. Sprawdź czy tylko ostatnia zmiana została zapisana

**Oczekiwany wynik**:
- Tylko jedno wywołanie API po zakończeniu edycji
- Nie ma nadmiernych zapytań do serwera

#### Test AS-004: Obsługa błędów auto-save
**Opis**: Sprawdzenie obsługi błędów podczas zapisywania.

**Kroki**:
1. Symuluj błąd sieci (odłącz internet lub użyj developer tools)
2. Wpisz tekst w polu refleksji
3. Sprawdź reakcję aplikacji na błąd

**Oczekiwany wynik**:
- Pojawia się komunikat błędu "Failed to save changes"
- Status pokazuje błąd zamiast "Last saved"
- Toast notification z błędem

### 3.3 Testy aktualizacji postępu celów

#### Test GP-001: Aktualizacja postępu przez slider
**Opis**: Sprawdzenie aktualizacji postępu przy użyciu slidera.

**Kroki**:
1. Przesuń slider dla jednego z celów
2. Puść slider (onValueCommit)
3. Sprawdź czy postęp został zaktualizowany
4. Odśwież stronę i sprawdź czy zmiana została zapisana

**Oczekiwany wynik**:
- Postęp aktualizuje się natychmiast (optimistic update)
- Pokazuje się "Updating..." podczas zapisywania
- Zmiana zostaje zapisana w bazie danych

#### Test GP-002: Aktualizacja postępu przez input numeryczny
**Opis**: Sprawdzenie aktualizacji przez bezpośrednie wpisanie wartości.

**Kroki**:
1. Wpisz nową wartość procentową w polu input
2. Naciśnij Enter lub kliknij poza polem
3. Sprawdź czy slider również się zaktualizował
4. Sprawdź czy zmiana została zapisana

**Oczekiwany wynik**:
- Input i slider są zsynchronizowane
- Postęp zostaje zapisany
- Walidacja zakresu 0-100 działa

#### Test GP-003: Obsługa błędów aktualizacji celu
**Opis**: Sprawdzenie obsługi błędów podczas aktualizacji postępu.

**Kroki**:
1. Symuluj błąd API dla endpointu PATCH goals
2. Przesuń slider dla celu
3. Sprawdź reakcję aplikacji

**Oczekiwany wynik**:
- Postęp wraca do poprzedniej wartości (rollback)
- Pokazuje się komunikat błędu
- Toast notification z informacją o przywróceniu zmian

#### Test GP-004: Walidacja zakresu postępu
**Opis**: Sprawdzenie walidacji wartości postępu.

**Kroki**:
1. Spróbuj wpisać wartość -5 w input
2. Spróbuj wpisać wartość 150 w input
3. Spróbuj przesunąć slider poza zakres

**Oczekiwany wynik**:
- Wartości są automatycznie clampowane do 0-100
- Slider wymusza krok 5
- Nie można wprowadzić nieprawidłowych wartości

### 3.4 Testy ukończenia recenzji

#### Test CR-001: Oznaczanie recenzji jako ukończonej
**Opis**: Sprawdzenie oznaczania recenzji jako ukończonej.

**Kroki**:
1. Przejdź do recenzji z treścią
2. Kliknij przycisk "Mark as Complete"
3. Sprawdź zmianę statusu
4. Odśwież stronę i sprawdź czy status został zapisany

**Oczekiwany wynik**:
- Status zmienia się na "Review Completed"
- Przycisk zmienia się na "Mark as Incomplete"
- Status zostaje zapisany

#### Test CR-002: Próba ukończenia pustej recenzji
**Opis**: Sprawdzenie walidacji przed oznaczeniem jako ukończoną.

**Kroki**:
1. Przejdź do nowej recenzji bez treści
2. Kliknij przycisk "Mark as Complete"

**Oczekiwany wynik**:
- Pojawia się komunikat błędu
- Status nie zostaje zmieniony
- Toast notification z informacją

#### Test CR-003: Przełączanie statusu ukończenia
**Opis**: Sprawdzenie przełączania między ukończoną i nieukończoną.

**Kroki**:
1. Oznacz recenzję jako ukończoną
2. Kliknij "Mark as Incomplete"
3. Sprawdź czy status zmienił się z powrotem

**Oczekiwany wynik**:
- Status przełącza się poprawnie
- Przyciski działają w obie strony

### 3.5 Testy przypadków brzegowych

#### Test EC-001: Brak celów w planie
**Opis**: Sprawdzenie zachowania gdy plan nie ma celów.

**Kroki**:
1. Przejdź do recenzji planu bez celów

**Oczekiwany wynik**:
- Sekcja celów pokazuje komunikat "No goals found"
- Reszta funkcjonalności działa normalnie

#### Test EC-002: Duża ilość celów
**Opis**: Sprawdzenie wydajności z wieloma celami.

**Kroki**:
1. Przejdź do recenzji planu z 10+ celami
2. Sprawdź ładowanie i responsywność

**Oczekiwany wynik**:
- Wszystkie cele są wyświetlane
- Wydajność nie spada znacząco

#### Test EC-003: Długie teksty w refleksjach
**Opis**: Sprawdzenie obsługi długich tekstów.

**Kroki**:
1. Wpisz bardzo długi tekst (>1000 znaków) w każdym polu
2. Sprawdź auto-save i wyświetlanie

**Oczekiwany wynik**:
- Długie teksty są obsługiwane poprawnie
- Auto-save działa dla długich tekstów

#### Test EC-004: Szybkie przełączanie między tygodniami
**Opis**: Sprawdzenie zachowania przy szybkiej nawigacji.

**Kroki**:
1. Szybko przełączaj między różnymi tygodniami
2. Sprawdź czy dane są ładowane poprawnie

**Oczekiwany wynik**:
- Nie ma wyścigów warunków (race conditions)
- Każda strona pokazuje poprawne dane

### 3.6 Testy responsywności i dostępności

#### Test RA-001: Responsywność na urządzeniach mobilnych
**Opis**: Sprawdzenie działania na małych ekranach.

**Kroki**:
1. Otwórz widok na urządzeniu mobilnym lub w trybie responsywnym
2. Przetestuj wszystkie funkcjonalności

**Oczekiwany wynik**:
- Wszystkie elementy są dostępne i funkcjonalne
- Nawigacja działa na małych ekranach

#### Test RA-002: Dostępność klawiatury
**Opis**: Sprawdzenie nawigacji klawiaturą.

**Kroki**:
1. Użyj Tab do nawigacji między elementami
2. Sprawdź focus indicators
3. Użyj Enter/Space do aktywacji przycisków

**Oczekiwany wynik**:
- Wszystkie interaktywne elementy są dostępne klawiaturą
- Focus indicators są widoczne

## 4. Kryteria akceptacji

### Funkcjonalne
- [ ] Wszystkie scenariusze testowe przechodzą pomyślnie
- [ ] Nie ma błędów JavaScript w konsoli
- [ ] Wszystkie API calls zwracają oczekiwane odpowiedzi
- [ ] Stan aplikacji jest spójny po odświeżeniu strony

### Wydajnościowe
- [ ] Auto-save nie powoduje nadmiernych zapytań API
- [ ] Optimistic updates działają płynnie
- [ ] Nie ma zauważalnych opóźnień w interfejsie

### Jakościowe
- [ ] UI jest responsywny i dostępny
- [ ] Komunikaty błędów są zrozumiałe dla użytkownika
- [ ] Loading states są wyraźnie widoczne

## 5. Raportowanie błędów

Przy znalezieniu błędów, należy zgłosić:

1. **Tytuł błędu** - Krótki opis problemu
2. **Środowisko** - Browser, OS, warunki
3. **Kroki reprodukcji** - Dokładne kroki do odtworzenia
4. **Oczekiwany wynik** - Co powinno się stać
5. **Aktualny wynik** - Co się dzieje zamiast tego
6. **Dodatkowe informacje** - Logi, screenshoty, network requests

## 6. Checklist końcowy

Po zakończeniu wszystkich testów:

- [ ] Wszystkie testy przeszły pomyślnie
- [ ] Nie znaleziono krytycznych błędów
- [ ] Wydajność jest akceptowalna
- [ ] Funkcjonalność jest kompletna zgodnie z planem
- [ ] Kod jest gotowy do przeglądu i deploymentu