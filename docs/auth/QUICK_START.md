# Login Flow - Quick Start Guide

## 🚀 Szybki Start (5 minut)

### 1. Skonfiguruj zmienne środowiskowe

```bash
# Skopiuj przykładowy plik
cp .env.example .env
```

Wypełnij wartości w `.env` (z Supabase Dashboard > Settings > API):

```env
# Server-side (private)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...  # service_role key

# Client-side (public)
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...  # anon key
```

### 2. Utwórz użytkownika testowego w Supabase

**Opcja A: Przez Dashboard**
1. Otwórz Supabase Dashboard
2. Idź do Authentication > Users
3. Kliknij "Add user"
4. Email: `test@example.com`
5. Password: `test1234`
6. ✅ Disable email confirmation (dla testów)

**Opcja B: Przez SQL**
```sql
-- W Supabase SQL Editor
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('test1234', gen_salt('bf')),
  now(),
  now(),
  now()
);
```

### 3. Uruchom aplikację

```bash
npm run dev
```

### 4. Przetestuj logowanie

1. Otwórz http://localhost:3000/login
2. Email: `test@example.com`
3. Password: `test1234`
4. Kliknij "Sign in"
5. ✅ Powinno przekierować do `/plans` lub `/plans/{id}`

---

## 🎯 Szybkie Testy

### Test 1: Poprawne logowanie
```
URL: http://localhost:3000/login
Email: test@example.com
Password: test1234
Expected: Redirect to /plans or /plans/{id}
```

### Test 2: Błędne hasło
```
URL: http://localhost:3000/login
Email: test@example.com
Password: wrongpassword
Expected: Toast "Invalid email or password"
```

### Test 3: Ochrona tras
```
URL: http://localhost:3000/plans (bez logowania)
Expected: Redirect to /login
```

---

## 🐛 Troubleshooting

### Problem: "Cannot connect to Supabase"
**Rozwiązanie:** Sprawdź czy zmienne w `.env` są poprawne

### Problem: "Invalid email or password" mimo poprawnych danych
**Rozwiązanie:** 
1. Sprawdź czy użytkownik istnieje w Supabase
2. Sprawdź czy email jest potwierdzony
3. Sprawdź czy używasz `PUBLIC_SUPABASE_ANON_KEY` (nie service_role)

### Problem: Redirect loop
**Rozwiązanie:** Sprawdź czy middleware PUBLIC_PATHS zawiera `/login`

---

## 📚 Więcej Informacji

- **Pełna dokumentacja:** `docs/auth/login-integration-complete.md`
- **Checklist testów:** `docs/auth/MANUAL_TEST_CHECKLIST.md`
- **Podsumowanie:** `docs/auth/INTEGRATION_SUMMARY.md`

---

## ✅ Checklist

- [ ] Zmienne środowiskowe ustawione
- [ ] Użytkownik testowy utworzony
- [ ] Dev server uruchomiony
- [ ] Test logowania przeszedł pomyślnie

**Gotowe!** 🎉
