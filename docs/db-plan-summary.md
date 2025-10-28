<conversation_summary>
<decisions>
Zarządzanie Użytkownikami: Wykorzystane zostanie standardowe uwierzytelnianie Supabase (auth.users) bez dodatkowej tabeli profiles. Dane takie jak full_name czy avatar_url będą dostępne poprzez widok (view) bazy danych.
Hierarchia Celów: Model został uproszczony i odwrócony. Użytkownik najpierw tworzy 12-tygodniowy plan, do którego przypisuje od 1 do 5 long_term_goals. Każdy long_term_goal jest następnie dzielony na milestones.
Cele Tygodniowe: weekly_goals są tworzone w kontekście planu dla konkretnego tygodnia. Co ważne, cel tygodniowy nie musi być bezpośrednio powiązany z żadnym long_term_goal, co daje elastyczność w planowaniu.
Zadania (Tasks): Stanowią płaską listę w ramach weekly_goals. Każde zadanie może być opcjonalnie powiązane z jednym milestone.
Integralność Danych: Usunięcie planu spowoduje kaskadowe usunięcie wszystkich powiązanych z nim danych (long_term_goals, milestones, weekly_goals, tasks itp.) dzięki ON DELETE CASCADE. Usunięcie milestone ustawi powiązany milestone_id w tasks na NULL.
Typy Danych i Ograniczenia: Wszystkie pola opisowe (description) w tabelach long_term_goals, milestones, weekly_goals i tasks będą typu TEXT. Ewentualne ograniczenia długości będą walidowane po stronie aplikacji.
Przechowywanie Danych: Plany po zakończeniu będą oznaczane statusem completed, a nie usuwane. Weekly_review będzie przechowywane w dedykowanej tabeli z trzema polami tekstowymi. Zadania będą miały przypisany dzień tygodnia (liczba 1-7), a nie konkretną datę.
Obliczenia i Wydajność: Postęp (np. procent ukończonych zadań) będzie obliczany dynamicznie za pomocą widoków bazy danych. Klucze obce oraz kolumny używane do filtrowania (np. status) zostaną zindeksowane.
</decisions>
<matched_recommendations>
Dynamiczne Obliczanie Postępów: Przyjęto rekomendację, aby unikać przechowywania obliczonych wartości (np. wskaźników procentowych) i zamiast tego używać widoków (views) PostgreSQL do ich dynamicznego obliczania, co zapewnia spójność danych.
Bezpieczeństwo na Poziomie Wierszy (RLS): Zaakceptowano kluczową zasadę, że wszystkie tabele zawierające dane użytkownika muszą mieć zaimplementowane polityki RLS, które ograniczają dostęp (SELECT, INSERT, UPDATE, DELETE) wyłącznie do właściciela danych (auth.uid()).
Strategia Kaskadowego Usuwania: Zgodnie z rekomendacją, relacja plan -> long_term_goals (i niższe) będzie używać ON DELETE CASCADE, aby zapewnić spójność referencyjną po usunięciu planu.
Separacja Weekly Review: Zaakceptowano pomysł stworzenia osobnej tabeli weekly_reviews powiązanej z planem i numerem tygodnia, co zapewnia ustrukturyzowane i skalowalne przechowywanie tych danych.
Elastyczne Daty Planu: Przyjęto model, w którym w tabeli plans przechowywana jest tylko start_date, a daty końcowe i granice poszczególnych tygodni są obliczane dynamicznie.
Uporządkowane Milestones: Zgodnie z sugestią, do tabeli milestones zostanie dodana kolumna position (lub order), aby umożliwić użytkownikowi definiowanie kolejności kroków w ramach celu długoterminowego.
Wartości Domyślne: Zaakceptowano użycie wartości domyślnych na poziomie bazy danych (np. is_completed = false dla zadań, status = 'ready' dla planów) w celu uproszczenia logiki i zapewnienia spójności.
</matched_recommendations>
<database_planning_summary>
Na podstawie przeprowadzonej dyskusji, schemat bazy danych dla MVP będzie oparty na hierarchicznej strukturze, której centralnym punktem jest 12-tygodniowy plan. Uwierzytelnianie będzie obsługiwane przez Supabase.
Główne Wymagania:
Schemat musi wspierać tworzenie planów, dekompozycję celów długoterminowych na mniejsze etapy (kamienie milowe) oraz tygodniowe planowanie zadań. Musi zapewniać ścisłą izolację danych pomiędzy użytkownikami i być zoptymalizowany pod kątem typowych zapytań (np. pobieranie danych dla aktywnego planu).
Kluczowe Encje i Relacje:
users (z auth.users Supabase): Główna encja, z którą powiązane są wszystkie inne dane.
plans: Encja nadrzędna. Relacja jeden-do-wielu z users. Zawiera start_date i status.
long_term_goals: Dziecko plans. Relacja jeden-do-wielu z plans.
milestones: Dziecko long_term_goals. Relacja jeden-do-wielu z long_term_goals. Zawiera status is_completed i position.
weekly_goals: Encja opisująca cel na dany tydzień. Powiązana z plans. Opcjonalnie może być powiązana z long_term_goals.
tasks: Najmniejsza jednostka pracy. Powiązana z weekly_goals. Opcjonalnie może być powiązana z milestones. Zawiera status is_completed i due_day.
weekly_reviews: Przechowuje cotygodniowe podsumowania. Powiązana z plans. Powiązana także z weekly_goals.
Bezpieczeństwo i Skalowalność:
Bezpieczeństwo: Wszystkie tabele będą chronione przez polityki Row-Level Security (RLS) w PostgreSQL, zapewniając, że użytkownicy mają dostęp wyłącznie do swoich własnych danych.
Wydajność: Indeksy zostaną utworzone na wszystkich kluczach obcych oraz kolumnach często używanych w warunkach WHERE (np. plans.status). Obliczanie statystyk i postępów będzie realizowane za pomocą widoków, aby zmniejszyć obciążenie i uniknąć redundancji danych.
</database_planning_summary>
<unresolved_issues>
Relacja weekly_goals do long_term_goals: Użytkownik zdecydował, że cel tygodniowy może istnieć bez powiązania z celem długoterminowym. Aby to zaimplementować, klucz obcy long_term_goal_id w tabeli weekly_goals powinien być zdefiniowany jako NULLABLE. Należy to potwierdzić podczas implementacji schematu.
</unresolved_issues>
</conversation_summary>