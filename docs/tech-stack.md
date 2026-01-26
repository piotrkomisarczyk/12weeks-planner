Frontend:
- TypeScript 5 - dla statycznego typowania kodu i lepszego wsparcia IDE
- Astro 5 - pozwala tworzyć szybkie wydajne strony i aplikacje z minimalną ilością javascriptu
- Tailwind 4 - pozwala wygodnie stylować aplikację
- Shadcn/ui - zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI
- React 19 - zapewnia interaktywność tam, gdzie jest potrzebna

Backend:
- Supabase
  - zapewnia bazę danych PostgreSQL
  - zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-service
  - jest rozwiązaniem open-source, które można hostować lokalnie lub na własnym serwerze
  - posiada wbudowaną autentykację użytkowników

CI/CD i Hosting:
- Github Actions - tworzenie pipeline'ów CI/CD
- DigitalOcean - do hostowania aplikacji za pośrednictwem obrazu docker

Testowanie:
- Vitest - testy jednostkowe dla logiki biznesowej i walidacji
- Playwright - testy E2E oraz testy regresji wizualnej
- Axe-core - audyt dostępności (walidacja ARIA labels)
- Postman/REST Client - manualne testy endpointów API (pliki .http w katalogu api-tests/)
- Supabase Dashboard/SQL Editor - weryfikacja stanów bazy danych i polityk RLS
