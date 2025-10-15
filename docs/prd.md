# Dokument wymagań produktu (PRD) - 12 Weeks Planner

## 1. Przegląd produktu

Aplikacja 12 Weeks Planner to webowa narzędzie do planowania i monitorowania długoterminowych celów, inspirowane książkami \"12 tygodniowy rok\" Briana P. Morina oraz \"Zjedz tę żabę\" Briana Tracy'ego. Celem jest zapewnienie użytkownikom strukturyzowanego podejścia do realizacji celów poprzez 12-tygodniowe planery, z hierarchią celów, zadań tygodniowych i dziennych, oraz mechanizmami śledzenia postępów.

Aplikacja jest dostępna w języku angielskim i polskim i skierowana do indywidualnych użytkowników poszukujących zaawansowanego narzędzia do planowania. MVP obejmuje system uwierzytelniania, tworzenie planerów, zarządzanie celami i zadaniami, oraz widoki nawigacyjne. Technologia: frontend oparty na Astro z React i Tailwind CSS, backend z Supabase dla autentykacji i bazy danych. Rozwój realizowany przez jednego developera, bez integracji zewnętrznych w MVP.

## 2. Problem użytkownika

Większość aplikacji typu to-do list obsługuje jedynie proste, krótkoterminowe zadania z binarnymi stanami (do zrobienia/zrobione), co nie wystarcza dla użytkowników planujących długoterminowe cele. Brakuje hierarchii (cele → zadania tygodniowe → dzienne), zaawansowanych stanów zadań (np. w trakcie, przesunięte), priorytetyzacji (A/B/C), uzasadnień celów oraz mechanizmów monitorowania postępów i refleksji (podsumowania tygodniowe). Użytkownicy potrzebują narzędzia, które motywuje do konsekwentnego działania poprzez wizualne paski postępu, kopiowanie zadań wielodniowych z historią stanów oraz elastyczne widoki (dashboard, cele, tydzień, dzień, podsumowanie), jednocześnie zapewniając prywatność i prostotę bez zbędnych funkcji jak współdzielenie czy wyszukiwanie.

## 3. Wymagania funkcjonalne

### System uwierzytelniania
- Rejestracja i logowanie użytkowników za pomocą email i hasła.
- Reset hasła via email.
- Każdy użytkownik widzi tylko swoje planery; brak współdzielenia.
- Soft-delete planerów jako archiwizacja (flaga w bazie).

### Zarządzanie planerami
- Tworzenie 12-tygodniowych planerów zaczynających się od poniedziałku aktualnego tygodnia.
- Nawigacja między planerami: poprzedni/następny, przeglądanie archiwalnych.
- Minimalnie 1 cel, maksymalnie 5 celów na planer (walidacja formularza).

### Cele
- Tworzenie/edycja 3-5 celów z uzasadnieniem (dlaczego ważny).
- Do każdego celu do 5 zadań (kamieni milowych) z terminami wykonania.
- Manualny pasek postępu (0-100%) niezależny od stanów zadań.
- Wizualizacja w dashboardzie z listą celów i postępami.

### Zadania tygodniowe
- Zadanie główne na tydzień i lista zadań powiązanych. Powinny być powiązane z celami lub kamieniami milowymi. Dodatkowa lista zadań ad-hoc (niezwiązane z celami).
- Priorytetyzacja A (najwyższy), B, C via dropdown.
- Stany: do zrobienia (pusty kwadrat), w trakcie (50% zaciemniony), zakończone (pełny kwadrat), anulowane (dwie przekątne), przesunięte (strzałka).
- Kopiowanie zadań wielodniowych między dniami z zachowaniem historii stanów.
- Możliwość przypisania zadań do konkretnych dni podczas planowania tygodnia lub dnia

### Widok dnia
- 1 najważniejsze zadanie, 2 drugorzędne, 7 dodatkowych (z tygodniowych lub ad-hoc).
- Stany zadań jak wyżej; ad-hoc zadania grupowane osobno.
- Kopiowanie zadań między tygodniami/dniami via menu kontekstowe. Możliwość wybrania na który dzień przesunąć zadanie. Zadania pozostają widoczne w każdym tygodniu i dniu do których były przypisane mimo kopiowania na kolejne dni.


### Widoki i nawigacja
- Dashboard: linki do widoków (cele, tydzień, dzień, podsumowanie), lista celów z postępem, drzewo hierarchii (expand/collapse jak katalogi).
- Widok celów: edycja celów i zadań.
- Widok tygodnia: planowanie zadań z priorytetami.
- Widok dnia: lista zadań na dzień z limitami. Możliwość przechodzenia po dniach danego tygodnia (poprzedni / następny)
- Podsumowanie tygodnia (niedziela): odpowiedzi na 3 pytania (co działało dobrze?, co nie działało?, co poprawić?) w 3 dedykowanych textarea z auto-save; edycja postępów celów.
- Drzewo hierarchii powinno pokazywać wszystkie zadania ad-hoc (czyli nieprzypisane do żadnego celu) pod węzłem o nazwie 'ad-hoc'. Pozostałe zadania mają się wyświetlać zgodnie z hierarchią (cel -> kamień milowy -> zadanie lub cel -> zadanie).

### Interfejs
- Responsywny design z Tailwind CSS.
- Ikony SVG z ARIA labels dla stanów i priorytetów.
- Język angielski i język polski; brak mobile w MVP.

### Baza danych (Supabase)
- Tabele: users, planners, goals, tasks (z foreign keys dla hierarchii), weekly_summaries.
- Flagi dla metryk (np. first_planner_completed).

## 4. Granice produktu

MVP nie obejmuje:
- Współdzielenia planerów między użytkownikami.
- Wyszukiwania zadań lub informacji.
- Timeboxingu zadań (np. przypisywanie czasu).
- Aplikacji mobilnej lub responsywności poza desktopem.
- Integracji zewnętrznych (kalendarz, powiadomienia, raporty).
- Zaawansowanego bezpieczeństwa (2FA, audit logi, retencja danych poza GDPR basics).
- Automatycznego obliczania postępów (manualne).
- Przenoszenia ad-hoc między plannerami bez wpływu na postępy (tylko w obrębie jednego).

Rozwój solo, bez JIRA; tracking via Trello.

## 5. Historyjki użytkowników

### US-001
Tytuł: Rejestracja nowego użytkownika  
Opis: Jako nowy użytkownik, chcę się zarejestrować za pomocą email i hasła, aby utworzyć konto i rozpocząć planowanie.  
Kryteria akceptacji:  
- Formularz rejestracji zawiera pola email i hasło (min. 8 znaków).  
- Po wysłaniu, użytkownik otrzymuje email weryfikacyjny (jeśli wymagany przez Supabase).  
- Po potwierdzeniu, użytkownik jest przekierowany do dashboardu z opcją tworzenia planera.  
- Błąd walidacji dla nieunikalnego email.  
- Edge case: niepoprawny email format blokuje rejestrację.

### US-002
Tytuł: Logowanie użytkownika  
Opis: Jako zarejestrowany użytkownik, chcę się zalogować, aby uzyskać dostęp do swoich planerów.  
Kryteria akceptacji:  
- Formularz logowania z email i hasłem.  
- Po sukcesie, przekierowanie do dashboardu z listą planerów.  
- Błąd dla niepoprawnych danych logowania.  
- Alternatywa: link do resetu hasła.  
- Edge case: sesja wygasa po bezczynności, wymaga ponownego logowania.

### US-003
Tytuł: Reset hasła  
Opis: Jako zalogowany użytkownik, chcę zresetować hasło via email, aby odzyskać dostęp w przypadku zapomnienia.  
Kryteria akceptacji:  
- Link \"Zapomniałem hasła\" na stronie logowania.  
- Wysłanie email z linkiem resetu.  
- Nowy formularz hasła po kliknięciu linku (potwierdzenie nowego hasła).  
- Po sukcesie, przekierowanie do logowania.  
- Edge case: wygaśnięcie linku resetu po 1 godzinie.

### US-004
Tytuł: Tworzenie nowego planera  
Opis: Jako zalogowany użytkownik, chcę utworzyć 12-tygodniowy planer, aby rozpocząć planowanie celów.  
Kryteria akceptacji:  
- Przycisk \"Nowy planer\" na dashboardzie.
- Okno modalne do wprowadzania nazwy i daty startu <data_startu>
- Automatyczne ustawienie daty startu na poniedziałek aktualnego tygodnia <data_startu>. Możliwość ustawiania innej daty (tylko poniedziałki) przy pomocy date pickera
- Domyślna nazwa planera: \"Planner_<data_startu>\"
- Możliwość zmiany nazwy na dowolną przy użyciu input box
- Po kliknięciu przycisku \"Dalej\", przekierowanie do widoku celów.  
- Walidacja: min. 1 cel wymagany przed zapisem.  
- Przycisk \"Stwórz\" tworzy nowy planer w bazie danych
- Edge case: próba utworzenia bez celów pokazuje błąd.
- Edge case2: gdy poprzedni planer jest zarchiwizowany użytkownik musi stworzyć kolejny planner. Nie następuje to automatycznie

### US-005
Tytuł: Nawigacja między planerami  
Opis: Jako użytkownik z wieloma planerami, chcę przeglądać i przełączać się między nimi, aby zarządzać historycznymi i aktualnymi.  
Kryteria akceptacji:  
- Lista planerów na dashboardzie z przyciskami poprzedni/następny.  
- Archiwalne planery oznaczone flagą soft-delete, dostępne do podglądu.  
- Wybór planera ładuje jego dashboard.  
- Alternatywa: brak planerów pokazuje prompt do tworzenia.  
- Edge case: tylko jeden planer – przyciski nieaktywne.

### US-006
Tytuł: Tworzenie i edycja celu  
Opis: Jako użytkownik, chcę dodać/edytować cel z uzasadnieniem, kategorią (praca, finanse, hobby, relacje, zdrowie, rozwój) i zadaniami (kamieniami milowymi), aby zdefiniować priorytety.  
Kryteria akceptacji:  
- Formularz z tytułem, uzasadnieniem (textarea), paskiem postępu (slider 0-100%).  
- Dodawanie do 5 zadań (kamieni milowych) z terminami (data picker).  
- Limity: 1-5 celów na planer.  
- Zapisywanie aktualizuje dashboard.  
- Edge case: edycja po 12 tygodniach blokowana dla archiwalnych.

### US-007
Tytuł: Planowanie zadania tygodniowego  
Opis: Jako użytkownik, chcę przypisać zadania do tygodnia z priorytetami, aby zorganizować pracę.  
Kryteria akceptacji:  
- Widok tygodnia z sekcjami: główne zadanie powiązane z celami lub kamieniami milowymi, podzadania dla zadania głównego, dodatkowe zadania ad-hoc (niezwiązane z celami).  
- Dropdown dla priorytetu A/B/C.  
- Wybór stanu (ikony).  
- Drag-and-drop do przenoszenia.
- Menu podręczne przy każdym zadaniu (... menu obok każdego zadania) pozwalające przypisać zadanie do konkretnego dnia w tygodniu  
- Alternatywa: ad-hoc bez powiązania z celem.  
- Edge case: przekroczenie limitu – ostrzeżenie.
- Limity: 0-10 podzadań zadania głównego, 0-10 zadań ad-hoc.

### US-008
Tytuł: Zarządzanie zadaniami dziennymi  
Opis: Jako użytkownik, chcę przypisać zadania do dnia z limitami i stanami, aby skupić się na priorytetach.  
Kryteria akceptacji:  
- Widok dnia z slotami: 1 najważniejsze, 2 drugorzędne, 7 dodatkowych.
- Zadania związane z celami/kamieniami milowymi powinny być w 2 pierwszych kategoriach
- Zadania ad-hoc w liście 7 dodatkowych
- Jeśli zabraknie miejsca w 2 pierwszych kategoriach, to zadania związane z celami umieść w liście dodatkowych 
- Możliwość kopiowania zadania z tygodniowego planu z historią stanów dla wielodniowych zadań. (W danych zadania powinna być przechowana informacja z datami i stanami w jakich zadanie się znajdowało).  
- Zmiana stanu ikoną (kliknięcie - cykliczne przechodzenie przez wszystkie stany).
- Ad-hoc umieszczane na liście dodatkowej.  
- Edge case: zadanie wielodniowe – auto-duplikacja do następnych dni o ile stan jest różny od zakończone i różny od anulowane.

### US-009
Tytuł: Podsumowanie tygodnia  
Opis: Jako użytkownik, chcę wypełnić podsumowanie w niedzielę, w celu refleksji nad minionym tygodniem i edycji postępów celów.  
Kryteria akceptacji:  
- Dostępne każdego dnia.
- W niedzielę sugestia z przypomnieniem wypełnienia podsumowania tygodnia wraz z linkiem do podstrony.  
- Formularz z 3 pytaniami (3 x textarea, auto-save). 
  - Pytania:
    - Co się udało?
    - Co się nie udało?
    - Co mogę poprawić (1 rzecz), by kolejny tydzień był lepszy? 
- Opcja edycji postępów celów. Możliwość przesuwania slidera, skok o 5% lub wpisania wartości w polu input (od 0 do 100 %, skok o 5%)  
- Zapis do osobnej tabeli.  
- Alternatywa: pominięcie – brak błędu.  
- Edge case: podsumowanie dla przeszłego tygodnia edytowalne.

### US-010
Tytuł: Wizualizacja hierarchii na dashboardzie  
Opis: Jako użytkownik, chcę widzieć drzewo hierarchii, aby łatwo nawigować po zadaniach. Jest to widok domyślny na dashboardzie.
Kryteria akceptacji:  
- Drzewo jak katalogi z expand/collapse.
- Kliknięcie na celu prowadzi do widoku celów
- Kliknięcie na zadania prowadzi do ostatniego dnia w którym to zadanie było realizowane.
- Pokazuje postępy celów.
- Responsywne na desktopie.
- Edge case: pusty planer – placeholder.

### US-011
Tytuł: Wylogowanie i bezpieczeństwo  
Opis: Jako użytkownik, chcę się wylogować, aby chronić dane.  
Kryteria akceptacji:  
- Przycisk wylogowania na dashboardzie.  
- Czyszczenie sesji.  
- Automatyczne wylogowanie po bezczynności 1h.  
- Edge case: próba dostępu bez logowania – przekierowanie do login.

### US-012
Tytuł: Archiwizacja planera  
Opis: Jako użytkownik, chcę archiwizować stary planer, aby zachować historię bez usuwania.  
Kryteria akceptacji:  
- Opcja soft-delete po 12 tygodniach.  
- Flaga w bazie; planer ukryty, ale dostępny.  
- Przywracanie możliwe.  
- Edge case: archiwizacja w trakcie – ostrzeżenie o utracie postępu.

### US-013
Tytuł: Obsługa błędów i walidacji  
Opis: Jako użytkownik, chcę otrzymywać jasne komunikaty błędów, aby korygować akcje.  
Kryteria akceptacji:  
- Walidacje formularzy (np. puste pola).  
- Komunikaty po angielsku lub po polsku.  
- Edge case: awaria sieci – retry button.

### US-014
Tytuł: Zmiana języka aplikacji na dashboardzie  
Opis: Jako użytkownik, chcę móc zmienić język aplikacji. Do wyboru są język angielski i polski.  
Kryteria akceptacji:  
- Na dashboardzie po prawej u góry dostępne 2 ikonki z flagami
- Po kliknięciu w odpowiednią ikonę zmienia się język aplikacji

### US-015 
Tytuł: Wyświetlanie numeru tygodnia na dashboardzie oraz na widoku (plan tygodnia, dzień, podsumowanie)
Opis: Jako użytkownik, chcę móc widzieć na dashboardzie oraz na   
Kryteria akceptacji:  
- Na dashboardzie na środku u góry pokazany jest napis \"tydzień <numer_tygodnia>\"
- <numer_tygodnia> liczony jest od pierwszego tygodnia w którym utworzono planer
- Widoki posiadają numer tygodnia wyświetlany na górze
  
### US-016
Tytuł: Nawigacja po widoku dnia
Opis: Jako użytkownik, chcę móc przeglądać zadania przypisane do poszczególnych dni i przechodzić pomiędzy dniami przy użyciu przycisków 'poprzedni dzień', 'następny dzień'. Użytkownik ma też możliwość wybrać dzień przy użyciu date picker.
Kryteria akceptacji:
- Link z dashboardu do widoku dnia. 
- Przycisk 'następny dzień' przenosi na widok kolejnego dnia
- Przycisk 'poprzedni dzień' przenosi na widok poprzedniego dnia
- DatePicker pozwala wybrać dowolny dzień z zakresu dat aktywnego planera
- Nawigacja działa także przy oglądaniu archiwalnych planerów
- Aby móc oglądać archiwalny planer trzeba go najpierw wybrać na widoku dashboard

### US-017  
Tytuł: Nawigacja po widoku tygodnia
Opis: Jako użytkownik, chcę móc przeglądać zadania przypisane do poszczególnych tygodni i przechodzić pomiędzy tygodniami przy użyciu przycisków 'poprzedni tydzień', 'następny tydzień'. Użytkownik ma też możliwość wybrać tydzień przy użyciu listy rozwijalnej (zakres 1-12).   
Kryteria akceptacji:
- Link z dashboardu do widoku tygodnia. 
- Przycisk 'następny tydzień' przenosi na widok kolejnego tygodnia
- Przycisk 'poprzedni tydzień' przenosi na widok poprzedniego tygodnia
- lista rozwijalna pozwala wybrać dowolny tydzień od 1 do 12 w ramach aktywnego planera
- Nawigacja działa także przy oglądaniu archiwalnych planerów
- Aby móc oglądać archiwalny planer trzeba go najpierw wybrać na widoku dashboard

### US-018
Tytuł: Nawigacja po widoku podsumowań
Opis: Jako użytkownik, chcę móc przeglądać podsumowania poszczególnych tygodni i przechodzić pomiędzy podsumowaniami przy użyciu przycisków 'poprzednie podsumowanie', 'następne podsumowanie'. Użytkownik ma też możliwość wybrać podsumowanie tygodnia przy użyciu listy rozwijalnej (zakres 1-12).   
Kryteria akceptacji:
- Link z dashboardu do listy podsumowań. 
- Przycisk 'następne podsumowanie' przenosi na widok kolejnego podsumowania tygodnia
- Przycisk 'poprzednie podsumowanie' przenosi na widok poprzedniego podsumowania tygodnia
- lista rozwijalna pozwala wybrać dowolne podsumowanie tygodnia od 1 do 12 w ramach aktywnego planera
- Nawigacja działa także przy oglądaniu archiwalnych planerów
- Aby móc oglądać archiwalny planer trzeba go najpierw wybrać na widoku dashboard


## 6. Metryki sukcesu

- 90% zarejestrowanych użytkowników tworzy co najmniej 1 planer (śledzone via flaga w tabeli users, mierzone jako MAU/DAU w Supabase analytics).
- 50% użytkowników realizuje co najmniej 1 cel na 100% postępu w pierwszym plannerze (manualny postęp=100%, śledzone po 12 tygodniach via flaga first_planner_completed w tabeli goals/planners; pomiar dla wszystkich zarejestrowanych po launchu).
- Czas sesji >5 min dla 70% wizyt (analityka Supabase).
- Wypełnienie podsumowań tygodniowych w >70% przypadków (flaga w weekly_summaries).
