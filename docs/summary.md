# Conversation Summary for PRD Planning

<conversation_summary></conversation_summary>
<decisions>

1. Aplikacja skupia się na rozwiązaniu problemu braku hierarchii w planowaniu długoterminowych celów, z monitorowaniem postępów i stanami zadań poza binarnymi (do zrobienia/zrobione), inspirowana książkami '12 tygodniowy rok' i 'Zjedz tę żabę'.
2. MVP obejmuje system kont użytkowników (tylko web, po polsku, każdy widzi tylko swoje planery), tworzenie 12-tygodniowych planerów (od poniedziałku aktualnego tygodnia, min. 1 cel, max. 5 celów na planer).
3. Cele mają uzasadnienie, do 5 zadań z terminami, manualny pasek postępu; zadania tygodniowe/dzienne z priorytetami A/B/C (manualny dropdown), ad-hoc zadania dozwolone i grupowane osobno.
4. Stany zadań: do zrobienia (pusty kwadrat), w trakcie (zaciemniony 50%), zakończone (pełny kwadrat), anulowane (dwie przekątne), przesunięte (strzałka); stany nie wpływają na pasek postępu.
5. Widoki: dashboard z linkami do celów/tydzień/dzień/podsumowanie i listą celów z postępem; hierarchia celów → zadania → tygodniowe/dzienne (z opcją drzewa jak katalogi, kopiowanie wielodniowych zadań z historią stanów); podsumowanie tygodnia (niedziela) z 3 pytaniami (co działało, co nie, co poprawić) i edycją postępu.
6. Ścieżka użytkownika: rejestracja → tworzenie planera → cele → tydzień → dzień → podsumowanie; dowolna nawigacja; zadania wielodniowe kopiowane między dniami dla zachowania historii.
7. Tech stack: Astro + React + Tailwind dla frontendu, Supabase dla auth i DB; solo development, Trello do trackingu (bez JIRA, bez integracji zewnętrznych w MVP, np. kalendarz/powiadomienia).
8. Bezpieczeństwo: pełna obsługa kont (zmiana/reset hasła via email), soft-delete planerów jako archiwizacja; zgodność GDPR, bez 2FA/retencji/audit logów w MVP.
9. Brak: współdzielenia, wyszukiwania, timeboxingu, mobile, raportów; zadania ad-hoc niepowiązane z celami.
10. Kryteria sukcesu: 90% zarejestrowanych użytkowników ma ≥1 planner; 50% zrealizowało ≥1 cel na 100% w pierwszym plannerze (śledzone po 12 tygodniach, dla wszystkich zarejestrowanych).
    </decisions>

<matched_recommendations>

1. Zdefiniuj relacyjną strukturę danych dla hierarchii (cele → zadania → tygodniowe/dzienne) z wizualną mapą/drzewem w interfejsie, aby ułatwić nawigację i śledzenie postępów.
2. Wymuś minimalny 1 cel via walidacja formularza z przyjaznym komunikatem, aby zapewnić angażowanie użytkowników od startu.
3. Ogranicz dashboard do esencji (linki, lista celów z sortowalnym postępem), z responsywnym designem Tailwind dla lekkości.
4. Użyj flag backendowych (np. w Supabase) dla KPI jak 'first_planner_completed', zintegrowanych z bazą dla automatycznego trackingu po 12 tygodniach.
5. Użyj SVG ikon z ARIA labels/tooltips dla dostępności i intuicyjności w polskim UI, bez tekstu dla oszczędności miejsca.
6. Dodaj formularz z textarea i auto-save dla podsumowania tygodnia, jako osobną tabelę w Supabase, z linkiem z dashboardu w niedzielę.
7. Pozwól na ad-hoc z dropdownem A/B/C i flagą 'niezwiązane', z opcją grupowania osobno i przenoszenia między tygodniami via drag-and-drop.
8. Użyj Supabase JS client dla auth (z polskim i18n), z ERD tabel (users, planners, goals, tasks) i foreign keys dla relacji hierarchii.
9. Zaimplementuj email reset hasła via Supabase Auth, soft-delete dla planerów; skup się na GDPR-compliant storage bez 2FA w MVP.
   </matched_recommendations>

<prd_planning_summary>

### a. Główne wymagania funkcjonalne produktu

MVP to webowa aplikacja po polsku do planowania 12-tygodniowych celów z hierarchią: cele (1-5, z uzasadnieniem, do 5 zadań z terminami, manualny pasek postępu) → zadania tygodniowe (główne/poboczne/ad-hoc z priorytetami A/B/C via dropdown) → dzienne (1 najważniejsze, 2 drugorzędne, 7 dodatkowych; stany ikonowe: do zrobienia, w trakcie, zakończone, anulowane, przesunięte; kopiowanie wielodniowych z historią stanów). Widoki: dashboard (linki, lista celów z postępem), cele, tydzień, dzień, podsumowanie (3 pytania tekstowe z edycją postępu w niedzielę). System auth z Supabase (rejestracja, login, reset hasła, archiwizacja planerów via soft-delete). Brak integracji, mobile czy raportów; solo dev z Astro/React/Tailwind/Supabase.

### b. Kluczowe historie użytkownika i ścieżki korzystania

- Użytkownik rejestruje się/loguje, tworzy planer (wymuszony min. 1 cel, max. 5).
- Ścieżka podstawowa: cele (definiowanie z zadaniami/uzasadnieniem/postępem) → plan tygodnia (przypisanie zadań, ad-hoc, priorytety) → widok dnia (przypisanie z stanami, kopiowanie wielodniowych) → niedziela: podsumowanie (odpowiedzi na pytania, edycja postępu celów).
- Dowolna nawigacja via dashboard (linki + drzewo hierarchii jak katalogi dla wizualizacji).
- Ad-hoc zadania: dodawanie/priorytetyzacja/grupowanie osobno, przenoszenie między tygodniami/dniami.
- Po 12 tygodniach: nowy planer; archiwizacja starych.
- Możliwość przeglądania poprzednich i aktualnego planera
- Nawigacja między planerami 'poprzedni', 'następny'

### c. Ważne kryteria sukcesu i sposoby ich mierzenia

- 90% zarejestrowanych użytkowników tworzy ≥1 planner (śledzone via flaga w Supabase users table, metryka MAU/DAU).
- 50% użytkowników realizuje ≥1 cel na 100% w pierwszym plannerze (definiowane jako manualny postęp=100%, śledzone po 12 tygodniach via backend flagi jak 'first_planner_completed' w tabeli planners/goals; analityka Supabase dla wszystkich zarejestrowanych, z pomiarem po czasie launchu).

### d. Wszelkie nierozwiązane kwestie lub obszary wymagające dalszego wyjaśnienia

Podsumowanie opiera się na iteracyjnych odpowiedziach, ale PRD powinno sprecyzować: dokładny mechanizm kopiowania wielodniowych zadań (manualny vs. auto-sugestie), szczegółowy ERD bazy Supabase (relacje tabel), interaktywność drzewa hierarchii (expand/collapse), obsługę edge cases jak przenoszenie ad-hoc między plannerami.
</prd_planning_summary>

<unresolved_issues>

- Dokładny schemat bazy Supabase (ERD z foreign keys dla hierarchii, tabeli podsumowań).
- Mechanizm kopiowania wielodniowych zadań: czy manualne przypisanie z auto-duplikacją stanów, czy sugestie oparte na terminach.
- Interaktywność drzewa hierarchii: czy expand/collapse, pozycja (dashboard vs. dedykowany widok).
- Obsługa przenoszenia ad-hoc zadań między tygodniami/plannerami i wpływ na postępy.
  </unresolved_issues>
  </conversation_summary>
