aktualnie dla planów mamy 3 stany 'active', 'completed', 'archived'.
Do rozważenia:
- Dodać nowy stan 'created' który jest defaultowym stanem dla nowo utworzonych planów
- Dodać endpoint do aktywacji planu
- Dodać endpoint do kompletowania planu
- Powiązać kompletowanie planu z datą (aktywny po zakończeniu 12 tygodni)
- Zastanowić się nad zarządzaniem stanami planów
- Pytanie - czy potrzebny jest stan 'archived' czy moze wystarczy 'completed'?
- W stanie compelted/archived nie mozna modyfikowac planu ani jego zadań
  