# Aplikacja - 12 Weeks Planner (MVP)

## Główny problem
Większość dostępnych na rynku aplikacji typu todo służy do realizacji
prostych zadań. Aplikacje te zwykle posiadają tylko tick przy zadaniu opisujący 2 stany (do zrobienia i zrobione)
Niektórzy użytkownicy poszukują bardziej rozbudowanego narzędzia służącego do planowania długoterminowych celów
oraz monitorowania postępów.
Poniższe rozwiązanie bazuje na książkach "12 tygodniowy rok" oraz "Zjedz tę żabę"


## Najmniejszy zestaw funkcjonalności (MVP)
- Prosty system kont użytkowników do powiązania użytkownika z planerami
- Aplikacja w języku polskim
- Każdy użytkownik widzi tylko swoje planery
- Tworzenie 12 tygodniowych planerów. Każdy planer tworzony jest na 12 tygodni
począwszy od poniedziałku aktualnego tygodnia. Gdy okres 12 tygodni się zakończy
użytkownik może dodać kolejny planer i zacząć planowanie kolejnych celów.
- Każdy planer składa się z:
  - Widoku celów który pozwala na tworzenie/edycję 3-5 celów
    - Możliwość dodawania i edycji do każdego celu 5 zadań z terminem wykonania 
    - Cel powinien też mieć uzasadnienie dlaczego jest ważny
    - Każdy cel ma pasek pos†ępu wykonania 
  - Widoku planu tygodnia
    - zadanie główne na ten tydzień
    - Lista zadań powiązanych z zadaniem głównym oraz zadań dodatkowych. Każde ma priorytetyzację A, B, C - gdzie A oznacza najwyższy priorytet
  - Widoku dnia z listą zadań zaplanowanych na konkretny dzień
    - Każdy dzień może mieć 1 najważniejsze zadanie , 2 zadania drugorzędne i 7 dodatkowych zadań
  - Każde zadanie (z widoku planu tygodnia i widoku dnia) może mieć kilka stanów (do zrobienia, zaczęte, w trakcie, zakończone, anulowane, przesunięte w czasie)
  - Widoku podsumowania tygodnia z odpowiedziami na następujące pytania:
    - Co działało dobrze?
    - Co nie działało?
    - Jaką rzecz można poprawić?


## Co NIE wchodzi w zakres MVP
- Współdzielenie planerów pomiędzy użytkownikami
- Wyszukiwanie informacji i zadań
- Timeboxing zadań na widoku dnia


## Kryteria sukcesu
- 90 % użytkowników ma stworzony przynajmniej 1 planner
- 50 % użytkowników ma wypełniony cały planer i zrealizowane przynajmniej 3 cele