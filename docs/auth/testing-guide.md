# Przewodnik Testowania Procesu Rejestracji

## Przed Testowaniem

### 1. Sprawdź konfigurację Supabase

```bash
# Sprawdź czy zmienne środowiskowe są ustawione
cat .env | grep SUPABASE
```

Powinny być:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Sprawdź ustawienia Auth w Supabase Dashboard

1. Przejdź do: https://supabase.com/dashboard/project/YOUR_PROJECT/auth/url-configuration
2. Sprawdź **Site URL**: powinien być `http://localhost:4321` (dev) lub twoja domena (prod)
3. Sprawdź **Redirect URLs**: dodaj `http://localhost:4321/auth/callback` (dev)

### 3. Sprawdź Email Settings

1. Przejdź do: Project Settings → Auth → Email
2. **Enable email confirmations** - powinno być WŁĄCZONE
3. **Confirm email** - powinno być WŁĄCZONE

## Scenariusze Testowe

### Test 1: Rejestracja z domyślnym Email Provider

**Cel:** Sprawdzić czy proces rejestracji działa poprawnie

**Kroki:**

1. Uruchom aplikację: `npm run dev`
2. Przejdź na: http://localhost:4321/register
3. Wprowadź dane:
   - Email: `test+1@gmail.com` (użyj aliasu Gmail)
   - Password: `Test1234`
   - Confirm Password: `Test1234`
4. Kliknij "Create account"

**Oczekiwany wynik:**

- ✅ Wyświetla się ekran "Check your email"
- ✅ Email jest widoczny na ekranie
- ✅ Przycisk "Back to login" przekierowuje na `/login` (NIE na `/plans`)

**Sprawdź w Supabase Dashboard:**

1. Przejdź do: Authentication → Users
2. Nowy użytkownik powinien być widoczny
3. Kolumna "Confirmed At" powinna być pusta (null)

**Sprawdź email:**

1. Otwórz skrzynkę email (sprawdź również SPAM)
2. Email może przyjść po 1-5 minutach
3. Jeśli nie przychodzi po 10 minutach - zobacz "Troubleshooting" poniżej

---

### Test 2: Próba logowania przed weryfikacją emaila

**Cel:** Sprawdzić czy system blokuje logowanie bez weryfikacji

**Kroki:**

1. Przejdź na: http://localhost:4321/login
2. Wprowadź dane z Test 1:
   - Email: `test+1@gmail.com`
   - Password: `Test1234`
3. Kliknij "Sign in"

**Oczekiwany wynik:**

- ✅ Wyświetla się błąd: "Please verify your email address before logging in"
- ✅ Użytkownik pozostaje na stronie `/login`
- ✅ NIE ma przekierowania na `/plans`

**Sprawdź w DevTools:**

1. Otwórz Network tab
2. Sprawdź response z `/api/auth/login`
3. Status: `403`
4. Body: `{ "error": "...", "code": "EMAIL_NOT_VERIFIED" }`

---

### Test 3: Weryfikacja emaila (z domyślnym providerem)

**Cel:** Sprawdzić czy link weryfikacyjny działa

**Warunek:** Email musi dotrzeć (może zająć do 10 minut)

**Kroki:**

1. Otwórz email weryfikacyjny
2. Kliknij "Confirm your mail"
3. Przeglądarka powinna otworzyć aplikację

**Oczekiwany wynik:**

- ✅ Przekierowanie na: `http://localhost:4321/login?verified=true`
- ✅ Wyświetla się toast: "Email verified successfully! You can now log in."
- ✅ URL zmienia się na: `http://localhost:4321/login` (bez parametrów)

**Sprawdź w Supabase Dashboard:**

1. Przejdź do: Authentication → Users
2. Znajdź użytkownika
3. Kolumna "Confirmed At" powinna mieć datę i czas

---

### Test 4: Logowanie po weryfikacji

**Cel:** Sprawdzić czy użytkownik może się zalogować po weryfikacji

**Kroki:**

1. Na stronie `/login` wprowadź dane:
   - Email: `test+1@gmail.com`
   - Password: `Test1234`
2. Kliknij "Sign in"

**Oczekiwany wynik:**

- ✅ Przekierowanie na: `http://localhost:4321/plans`
- ✅ Użytkownik jest zalogowany
- ✅ Widoczne jest menu użytkownika (UserMenu)

---

### Test 5: Próba ponownego użycia linku weryfikacyjnego

**Cel:** Sprawdzić czy link jest jednorazowy

**Kroki:**

1. Wyloguj się
2. Otwórz ten sam link weryfikacyjny z emaila ponownie

**Oczekiwany wynik:**

- ✅ Przekierowanie na: `http://localhost:4321/login?error=verification_failed`
- ✅ Wyświetla się błąd: "Email verification failed. Please try again."

---

### Test 6: Dostęp do chronionych stron bez logowania

**Cel:** Sprawdzić czy middleware chroni strony

**Kroki:**

1. Wyloguj się (jeśli zalogowany)
2. Spróbuj wejść na: `http://localhost:4321/plans`

**Oczekiwany wynik:**

- ✅ Przekierowanie na: `http://localhost:4321/login`

---

### Test 7: Dostęp do stron auth po zalogowaniu

**Cel:** Sprawdzić czy zalogowani użytkownicy są przekierowywani

**Kroki:**

1. Zaloguj się
2. Spróbuj wejść na: `http://localhost:4321/login`
3. Spróbuj wejść na: `http://localhost:4321/register`

**Oczekiwany wynik:**

- ✅ Przekierowanie na: `http://localhost:4321/plans`

---

## Troubleshooting

### Problem: Email nie dociera

**Możliwe przyczyny:**

1. Domyślny provider Supabase ma limit 3-4 emaile/godzinę
2. Email trafił do spamu
3. Provider jest zablokowany przez dostawcę email

**Rozwiązania:**

#### Opcja 1: Sprawdź spam

1. Otwórz folder SPAM
2. Szukaj emaila od: `noreply@mail.app.supabase.io`
3. Oznacz jako "Not spam"

#### Opcja 2: Użyj aliasów Gmail

Gmail traktuje `email+cokolwiek@gmail.com` jako ten sam adres:

- `test+1@gmail.com`
- `test+2@gmail.com`
- `test+3@gmail.com`

Wszystkie emaile trafią do `test@gmail.com`

#### Opcja 3: Sprawdź logi Supabase

1. Dashboard → Logs → Auth Logs
2. Szukaj eventów typu:
   - `user.signup` - rejestracja użytkownika
   - `email.sent` - email wysłany
   - `email.failed` - błąd wysyłki

#### Opcja 4: Skonfiguruj SMTP (ZALECANE)

Zobacz: `docs/auth/supabase-email-configuration.md`

Szybka konfiguracja SendGrid:

1. Zarejestruj się: https://sendgrid.com
2. Utwórz API Key
3. Supabase Dashboard → Project Settings → Auth → SMTP Settings
4. Enable Custom SMTP:
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - Username: `apikey`
   - Password: `<twój_sendgrid_api_key>`

#### Opcja 5: Tymczasowo wyłącz weryfikację (TYLKO DEV!)

1. Dashboard → Project Settings → Auth → Email
2. Wyłącz "Enable email confirmations"
3. **PAMIĘTAJ:** Włącz to przed wdrożeniem na produkcję!

---

### Problem: Błąd "Invalid callback"

**Przyczyna:** URL callback nie jest w Redirect URLs

**Rozwiązanie:**

1. Dashboard → Authentication → URL Configuration
2. Dodaj do **Redirect URLs**:
   - `http://localhost:4321/auth/callback` (dev)
   - `https://yourdomain.com/auth/callback` (prod)

---

### Problem: Błąd "Link expired"

**Przyczyna:** Link weryfikacyjny jest ważny 24 godziny

**Rozwiązanie:**

1. Zaimplementuj funkcję "Resend verification email" (TODO)
2. Lub: Usuń użytkownika z Dashboard i zarejestruj ponownie

---

### Problem: Użytkownik może wejść na /plans bez weryfikacji

**Przyczyna:** Middleware nie sprawdza `email_confirmed_at`

**Sprawdź:**

1. Otwórz: `src/middleware/index.ts`
2. Znajdź linię:

```typescript
const isEmailVerified = user?.email_confirmed_at !== null;
```

3. Sprawdź czy `locals.user` jest ustawiany tylko gdy `isEmailVerified === true`

---

## Testowanie z Custom SMTP

Po skonfigurowaniu SendGrid/Mailgun:

### Test 1: Szybkość dostarczenia

1. Zarejestruj nowego użytkownika
2. Sprawdź czas dostarczenia emaila
3. **Oczekiwany czas:** < 30 sekund

### Test 2: Spam score

1. Sprawdź czy email trafia do Inbox (nie Spam)
2. Sprawdź nagłówki emaila (SPF, DKIM)

### Test 3: Dostosowany szablon

1. Dashboard → Project Settings → Auth → Email Templates
2. Edytuj "Confirm signup"
3. Zarejestruj testowego użytkownika
4. Sprawdź czy email ma nowy wygląd

---

## Checklist przed Produkcją

- [ ] SMTP provider skonfigurowany (SendGrid/Mailgun)
- [ ] Redirect URLs zawierają domenę produkcyjną
- [ ] Site URL ustawiony na domenę produkcyjną
- [ ] Email confirmations WŁĄCZONE
- [ ] Szablony email dostosowane do brandingu
- [ ] SPF i DKIM skonfigurowane dla domeny
- [ ] Przetestowany pełny przepływ rejestracji
- [ ] Przetestowany pełny przepływ logowania
- [ ] Przetestowane błędne scenariusze (wygasły link, etc.)
- [ ] Rate limiting skonfigurowany (opcjonalnie)
- [ ] Monitoring emaili skonfigurowany

---

## Przydatne Komendy

### Sprawdź logi aplikacji

```bash
npm run dev
# Sprawdź terminal pod kątem błędów
```

### Sprawdź cookies w przeglądarce

```javascript
// W DevTools Console:
document.cookie;
```

### Wyczyść cookies (wyloguj się)

```javascript
// W DevTools Console:
document.cookie.split(";").forEach((c) => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
location.reload();
```

### Sprawdź session w Supabase

```javascript
// W DevTools Console (na stronie aplikacji):
fetch("/api/auth/session")
  .then((r) => r.json())
  .then(console.log);
```

---

## Kontakt z Supportem Supabase

Jeśli problemy z emailami nie ustępują:

1. **Discord:** https://discord.supabase.com
2. **GitHub Issues:** https://github.com/supabase/supabase/issues
3. **Support Email:** support@supabase.io

Przygotuj:

- Project ID
- Timestamp problemu
- Logi z Dashboard → Logs
- Opis problemu
