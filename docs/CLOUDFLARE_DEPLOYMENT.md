# Cloudflare Pages Deployment

## Przegląd zmian

Projekt został skonfigurowany do wdrożenia na Cloudflare Pages. Poniżej znajduje się lista wprowadzonych zmian:

### 1. Adapter Astro

- **Zainstalowano**: `@astrojs/cloudflare` adapter
- **Usunięto**: `@astrojs/node` adapter
- **Zaktualizowano**: `astro.config.mjs` aby używać adaptera Cloudflare z włączonym `platformProxy`

### 2. GitHub Actions Workflow

Utworzono nowy workflow `.github/workflows/master.yml` który:

- Uruchamia się automatycznie przy każdym push do brancha `main`
- Wykonuje linting kodu
- Uruchamia testy jednostkowe z pokryciem kodu
- Buduje aplikację
- Wdraża na Cloudflare Pages

**Uwaga**: W przeciwieństwie do workflow `pull-request.yml`, workflow `master.yml` NIE uruchamia testów E2E, aby przyspieszyć deployment.

## Konfiguracja Secrets w GitHub

Aby workflow działał poprawnie, należy skonfigurować następujące secrets w repozytorium GitHub:

### Secrets dla środowiska `production`

Przejdź do: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

1. **CLOUDFLARE_API_TOKEN**
   - Token API z Cloudflare z uprawnieniami do Cloudflare Pages
   - Jak uzyskać: Cloudflare Dashboard → My Profile → API Tokens → Create Token → Edit Cloudflare Workers template

2. **CLOUDFLARE_ACCOUNT_ID**
   - ID konta Cloudflare
   - Jak uzyskać: Cloudflare Dashboard → Workers & Pages → Overview (w prawym panelu)

3. **CLOUDFLARE_PROJECT_NAME**
   - Nazwa projektu Cloudflare Pages (musi już istnieć)
   - Przykład: `12weeks-planner`

4. **SUPABASE_URL**
   - URL serwera Supabase (server-side)

5. **SUPABASE_KEY**
   - Service Role Key z Supabase (server-side, prywatny)

6. **PUBLIC_SUPABASE_URL**
   - URL serwera Supabase (client-side, publiczny)

7. **PUBLIC_SUPABASE_ANON_KEY**
   - Anonymous Key z Supabase (client-side, publiczny)

## Konfiguracja projektu Cloudflare Pages

### Opcja 1: Przez Cloudflare Dashboard (Zalecane dla pierwszego deploymentu)

1. Zaloguj się do Cloudflare Dashboard
2. Przejdź do **Workers & Pages**
3. Kliknij **Create application** → **Pages** → **Connect to Git**
4. Wybierz repozytorium GitHub
5. Skonfiguruj build settings:
   - **Framework preset**: Astro
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. Dodaj zmienne środowiskowe (Environment Variables):
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
7. Kliknij **Save and Deploy**

### Opcja 2: Przez GitHub Actions (Automatyczny deployment)

Po skonfigurowaniu secrets w GitHub, każdy push do brancha `main` automatycznie:

1. Zbuduje aplikację
2. Wdroży na Cloudflare Pages
3. Zwróci URL deploymentu w logach workflow

## Weryfikacja deploymentu

Po udanym wdrożeniu:

1. Sprawdź logi workflow w GitHub Actions
2. Znajdź URL deploymentu w output kroku "Deploy to Cloudflare Pages"
3. Otwórz URL w przeglądarce i zweryfikuj działanie aplikacji

## Troubleshooting

### Błąd: "Project not found"

- Upewnij się, że projekt Cloudflare Pages został utworzony
- Sprawdź czy `CLOUDFLARE_PROJECT_NAME` jest poprawny

### Błąd: "Authentication failed"

- Sprawdź czy `CLOUDFLARE_API_TOKEN` ma odpowiednie uprawnienia
- Sprawdź czy `CLOUDFLARE_ACCOUNT_ID` jest poprawny

### Błąd: "Build failed"

- Sprawdź czy wszystkie zmienne środowiskowe są ustawione
- Sprawdź logi build w Cloudflare Dashboard

## Różnice między środowiskami

| Workflow | Branch | Środowisko | Testy E2E | Deployment |
|----------|--------|------------|-----------|------------|
| `pull-request.yml` | PR → main | integration | ✅ Tak | ❌ Nie |
| `master.yml` | main | production | ❌ Nie | ✅ Tak |

## Kolejne kroki

1. Skonfiguruj custom domain w Cloudflare Pages (opcjonalnie)
2. Skonfiguruj preview deployments dla pull requests (opcjonalnie)
3. Skonfiguruj monitoring i alerty w Cloudflare (opcjonalnie)

## Przydatne linki

- [Astro Cloudflare Adapter Documentation](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Wrangler Action](https://github.com/cloudflare/wrangler-action)
