# Navigation Implementation Summary

## Problem

PlanContextBar (podmenu z opcjami nawigacyjnymi) nie wyświetlało się w widokach:

- `/plans/[id]` (Dashboard)
- `/plans/[id]/goals` (Goals)
- `/plans/[id]/hierarchy` (Hierarchy)
- `/plans/[id]/week/[weekNumber]` (Week)
- `/plans/[id]/week/[weekNumber]/day/[dayNumber]` (Day)
- `/plans/[id]/review/[weekNumber]` (Weekly Review)

## Root Cause

Problem występował w `src/layouts/Layout.astro`. Layout pobierał dane planu tylko gdy użytkownik był zalogowany (`if (user)`), ale w trybie deweloperskim nie ma aktywnej sesji użytkownika. Ponieważ `plan` było `null`, `TopNavigation` nie renderował `PlanContextBar`.

## Solution

### 1. Fixed Layout.astro

Dodano fallback do `DEFAULT_USER_ID` w przypadku braku zalogowanego użytkownika:

```typescript
// Get current user (with fallback to DEFAULT_USER_ID for development)
const {
  data: { user },
} = await supabase.auth.getUser();
const userId = user?.id || DEFAULT_USER_ID;

// Extract plan ID from URL if we're in a plan context
const urlParts = Astro.url.pathname.split("/").filter(Boolean);
let plan: PlanSummary | null = null;

// Check if we're on a plan-specific page: /plans/[id]/...
if (urlParts[0] === "plans" && urlParts.length >= 2 && urlParts[1].match(/^[a-f0-9-]{36}$/i)) {
  const planId = urlParts[1];

  try {
    const planService = new PlanService(supabase);
    const fullPlan = await planService.getPlanById(planId, userId);

    if (fullPlan) {
      // Create a minimal PlanSummary for navigation
      plan = {
        id: fullPlan.id,
        name: fullPlan.name,
        start_date: fullPlan.start_date,
        status: fullPlan.status,
      };
    }
  } catch (error) {
    console.error("Failed to fetch plan for navigation:", error);
    // Continue without plan data - TopNavigation will handle null plan
  }
}

const userEmail = user?.email || "dev@example.com";
```

**Klucze zmiany:**

- Dodano import `DEFAULT_USER_ID` z `@/db/supabase.client`
- Zastąpiono `if (user)` bezwarunkowym pobieraniem planu z `userId` (user?.id || DEFAULT_USER_ID)
- Dodano fallback dla `userEmail` na potrzeby UserMenu

### 2. Improved TopNavigation.astro

Ulepszona logika sprawdzania kontekstu planu:

```typescript
const currentPath = Astro.url.pathname;
const urlParts = currentPath.split("/").filter(Boolean);
const isInPlanContext =
  urlParts[0] === "plans" &&
  urlParts.length >= 2 &&
  urlParts[1].match(/^[a-f0-9-]{36}$/i) &&
  plan !== null &&
  plan !== undefined;
```

**Klucze zmiany:**

- Użyto `split('/').filter(Boolean)` zamiast `split('/')` dla bardziej niezawodnego parsowania
- Sprawdzenie UUID za pomocą regex dla bezpieczeństwa

### 3. Enhanced PlanContextBar.astro

Poprawiona widoczność paska nawigacyjnego:

```html
<div class="flex h-12 items-center gap-1 border-b border-border bg-muted px-4 lg:px-6 overflow-x-auto">
  <nav class="flex items-center gap-1" aria-label="Plan navigation">
    {navLinks.map((link) => (
    <NavLink href="{link.href}" icon="{link.icon}" label="{link.label}" isActive="{isLinkActive(link.href)}" />
    ))}
  </nav>
</div>
```

**Klucze zmiany:**

- Zmieniono `bg-muted/50` na `bg-muted` dla lepszej widoczności
- Dodano `border-border` dla wyraźniejszego obramowania
- Dodano `overflow-x-auto` dla responsywności na małych ekranach

## Files Modified

1. `src/layouts/Layout.astro`
   - Dodano import `DEFAULT_USER_ID`
   - Dodano fallback dla userId i userEmail
   - Usunięto warunkowe `if (user)` przed pobieraniem planu

2. `src/components/navigation/TopNavigation.astro`
   - Ulepszona logika `isInPlanContext`
   - Użyto `.filter(Boolean)` dla czystszego parsowania URL

3. `src/components/navigation/PlanContextBar.astro`
   - Poprawiona widoczność CSS (`bg-muted/50` → `bg-muted`)
   - Dodano `border-border` i `overflow-x-auto`

## Verification

PlanContextBar teraz renderuje się poprawnie na wszystkich stronach planu:

- ✅ `/plans/[id]` - Dashboard
- ✅ `/plans/[id]/goals` - Goals
- ✅ `/plans/[id]/hierarchy` - Hierarchy View
- ✅ `/plans/[id]/week/[weekNumber]` - Week Planning
- ✅ `/plans/[id]/week/[weekNumber]/day/[dayNumber]` - Day Planning
- ✅ `/plans/[id]/review/[weekNumber]` - Weekly Review

## Notes

- Problem występował tylko w trybie deweloperskim bez aktywnej sesji użytkownika
- W produkcji z poprawną autentykacją problem prawdopodobnie nie występowałby
- Rozwiązanie zapewnia działanie zarówno z autentykacją jak i bez niej (dev mode)
