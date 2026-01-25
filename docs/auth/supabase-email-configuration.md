# Konfiguracja Email Provider w Supabase

## Problem
Po rejestracji użytkownika email weryfikacyjny nie dociera na skrzynkę pocztową.

## Przyczyna
Supabase domyślnie używa wbudowanego email providera, który ma ograniczenia:
- Maksymalnie 3-4 emaile na godzinę
- Może być blokowany przez filtry spamu
- Nie jest zalecany do użytku produkcyjnego
- Może nie działać poprawnie dla niektórych domen email

## Rozwiązania

### Opcja 1: Konfiguracja Custom SMTP (Zalecane dla produkcji)

#### 1.1. Wybierz Email Provider
Popularne opcje:
- **SendGrid** (darmowy plan: 100 emaili/dzień)
- **Mailgun** (darmowy plan: 5000 emaili/miesiąc)
- **AWS SES** (bardzo tani, wymaga weryfikacji)
- **Resend** (nowoczesny, prosty w konfiguracji)

#### 1.2. Konfiguracja w Supabase Dashboard

1. Przejdź do **Project Settings** → **Auth** → **Email Templates**
2. Przewiń do sekcji **SMTP Settings**
3. Włącz **Enable Custom SMTP**
4. Uzupełnij dane:
   ```
   Sender name: 12 Weeks Planner
   Sender email: noreply@yourdomain.com
   Host: smtp.sendgrid.net (lub inny provider)
   Port: 587
   Username: apikey (dla SendGrid) lub twój username
   Password: twój API key lub hasło
   ```

#### 1.3. Przykład konfiguracji dla SendGrid

```env
# W Supabase Dashboard SMTP Settings:
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: SG.xxxxxxxxxxxxxxxxxxxxx (twój SendGrid API Key)
Sender: noreply@yourdomain.com
```

**Kroki dla SendGrid:**
1. Zarejestruj się na https://sendgrid.com
2. Zweryfikuj swój email
3. Przejdź do **Settings** → **API Keys**
4. Utwórz nowy API Key z uprawnieniami "Mail Send"
5. Skopiuj API Key i użyj jako hasło w Supabase

### Opcja 2: Użyj Supabase Email Limits (Tylko dla testów)

Jeśli chcesz tylko przetestować funkcjonalność:

1. **Sprawdź limity** w Supabase Dashboard:
   - Project Settings → Auth → Rate Limits
   - Domyślnie: 3-4 emaile/godzinę na adres

2. **Testuj z różnymi adresami email:**
   - Użyj Gmail + aliasów: `twojmail+test1@gmail.com`, `twojmail+test2@gmail.com`
   - Wszystkie trafią do tej samej skrzynki

3. **Sprawdź folder SPAM:**
   - Emaile z domyślnego providera często trafiają do spamu
   - Oznacz jako "Not spam" dla przyszłych emaili

### Opcja 3: Wyłącz weryfikację email (NIE zalecane)

Tylko dla środowiska deweloperskiego:

1. Przejdź do **Project Settings** → **Auth** → **Email**
2. Wyłącz **Enable email confirmations**
3. **WAŻNE:** Pamiętaj włączyć to przed wdrożeniem na produkcję!

## Weryfikacja konfiguracji

Po skonfigurowaniu SMTP:

1. Zarejestruj nowego użytkownika
2. Sprawdź logi w Supabase Dashboard:
   - **Logs** → **Auth Logs**
   - Szukaj eventów typu `user.signup` i `email.sent`
3. Sprawdź czy email dotarł (może potrwać 1-2 minuty)

## Dostosowanie szablonów email

Możesz dostosować wygląd emaili weryfikacyjnych:

1. Przejdź do **Project Settings** → **Auth** → **Email Templates**
2. Wybierz **Confirm signup**
3. Edytuj szablon HTML
4. Użyj zmiennych:
   - `{{ .ConfirmationURL }}` - link weryfikacyjny
   - `{{ .SiteURL }}` - URL twojej aplikacji
   - `{{ .Email }}` - email użytkownika

### Przykładowy szablon

```html
<h2>Witaj w 12 Weeks Planner!</h2>
<p>Dziękujemy za rejestrację. Kliknij poniższy link, aby zweryfikować swój adres email:</p>
<p><a href="{{ .ConfirmationURL }}">Zweryfikuj email</a></p>
<p>Link jest ważny przez 24 godziny.</p>
<p>Jeśli nie rejestrowałeś się w naszej aplikacji, zignoruj ten email.</p>
```

## Troubleshooting

### Email nie dociera nawet po konfiguracji SMTP

1. **Sprawdź logi SMTP w Supabase:**
   - Dashboard → Logs → Auth Logs
   - Szukaj błędów związanych z wysyłką

2. **Zweryfikuj dane SMTP:**
   - Upewnij się, że port jest poprawny (587 dla TLS, 465 dla SSL)
   - Sprawdź czy API Key/hasło jest aktualne

3. **Sprawdź limity providera:**
   - SendGrid: sprawdź czy nie przekroczyłeś darmowego limitu
   - Mailgun: sprawdź czy domena jest zweryfikowana

### Email trafia do spamu

1. **Skonfiguruj SPF i DKIM:**
   - Dodaj rekordy DNS dla swojej domeny
   - Instrukcje znajdziesz w dokumentacji swojego email providera

2. **Użyj zweryfikowanej domeny:**
   - Zamiast `noreply@gmail.com` użyj `noreply@twojadomena.com`

## Rekomendacje dla produkcji

1. ✅ Użyj custom SMTP providera (SendGrid, Mailgun, AWS SES)
2. ✅ Skonfiguruj własną domenę dla emaili
3. ✅ Ustaw SPF i DKIM rekordy
4. ✅ Dostosuj szablony email do brandingu aplikacji
5. ✅ Monitoruj logi wysyłki emaili
6. ✅ Ustaw odpowiednie rate limity

## Dodatkowe zasoby

- [Supabase Email Configuration](https://supabase.com/docs/guides/auth/auth-smtp)
- [SendGrid Setup Guide](https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api)
- [Mailgun SMTP Guide](https://documentation.mailgun.com/en/latest/user_manual.html#sending-via-smtp)
