stateDiagram-v2
[*] --> MiddlewareSprawdzenieSesji

    state "Weryfikacja Sesji (Middleware)" as MiddlewareSprawdzenieSesji {
        state if_sesja <<choice>>
        [*] --> if_sesja
        if_sesja --> Gosc: Brak sesji
        if_sesja --> Zalogowany: Sesja aktywna
    }

    state "Użytkownik Niezalogowany" as Gosc {
        [*] --> EkranLogowania

        state "Ekran Logowania\n(/login)" as EkranLogowania
        state "Ekran Rejestracji\n(/register)" as EkranRejestracji
        state "Odzyskiwanie Hasła\n(/forgot-password)" as OdzyskiwanieHasla
        state "Wysłanie Linku Resetującego" as WyslanieResetu

        EkranLogowania --> EkranRejestracji: "Nie masz konta?"
        EkranLogowania --> OdzyskiwanieHasla: "Zapomniałeś hasła?"
        EkranRejestracji --> EkranLogowania: "Masz już konto?"

        OdzyskiwanieHasla --> WyslanieResetu: Podanie email
        WyslanieResetu --> EkranLogowania: Powrót
    }

    state "Proces Logowania" as ProcesLogowania {
        state if_dane_poprawne <<choice>>
        state if_aktywny_planer <<choice>>

        EkranLogowania --> if_dane_poprawne: "Zaloguj"
        if_dane_poprawne --> BladLogowania: Błędne dane
        BladLogowania --> EkranLogowania

        if_dane_poprawne --> if_aktywny_planer: Dane poprawne
        if_aktywny_planer --> Dashboard: "Posiada aktywny planer"
        if_aktywny_planer --> ListaPlanerow: "Brak aktywnego planera"
    }

    state "Proces Rejestracji" as ProcesRejestracji {
        state if_walidacja <<choice>>

        EkranRejestracji --> if_walidacja: "Zarejestruj"
        if_walidacja --> BladRejestracji: Błąd walidacji / Email zajęty
        BladRejestracji --> EkranRejestracji

        if_walidacja --> OczekiwanieNaWeryfikacje: Dane poprawne
        OczekiwanieNaWeryfikacje: "Oczekiwanie na kliknięcie w emailu"

        OczekiwanieNaWeryfikacje --> CallbackAuth: "Kliknięcie w link aktywacyjny"
    }

    state "Proces Resetu Hasła" as ProcesResetu {
        state "Formularz Nowego Hasła\n(/update-password)" as NoweHaslo
        state if_zmiana_udana <<choice>>

        WyslanieResetu --> NoweHaslo: "Kliknięcie w link z emaila"
        NoweHaslo --> if_zmiana_udana: "Zapisz nowe hasło"
        if_zmiana_udana --> EkranLogowania: Sukces
        if_zmiana_udana --> NoweHaslo: Błąd (np. słabe hasło)
    }

    state "Użytkownik Zalogowany" as Zalogowany {
        state "Dashboard\n(/plans/[id]/dashboard)" as Dashboard
        state "Lista Planerów\n(/plans)" as ListaPlanerow
        state "Ustawienia / Zmiana Hasła" as UstawieniaKonta
        state "Wylogowanie" as WylogowanieStan

        CallbackAuth --> Dashboard: Utworzenie sesji

        Dashboard --> ListaPlanerow: Nawigacja
        ListaPlanerow --> Dashboard: Wybór planera

        Dashboard --> UstawieniaKonta: Menu użytkownika
        UstawieniaKonta --> WylogowanieStan: "Wyloguj"
        WylogowanieStan --> EkranLogowania: Usunięcie sesji
    }

    note right of EkranLogowania
        Sprawdza email i hasło.
        Przekierowuje w zależności od stanu planera.
    end note

    note left of OczekiwanieNaWeryfikacje
        Supabase wysyła email.
        Wymagana weryfikacja przed dostępem.
    end note
