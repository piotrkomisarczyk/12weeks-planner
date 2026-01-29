# Authentication Components

This directory contains all authentication-related React components for the 12 Weeks Planner application.

## Components

### LoginForm

User login form with email and password fields.

**Features:**

- Email and password validation
- "Forgot password?" link
- "Sign up" link for new users
- Loading states
- Error handling

**Usage:**

```tsx
import { LoginForm } from "@/components/auth";

<LoginForm client:load />;
```

---

### RegisterForm

User registration form with email, password, and password confirmation.

**Features:**

- Strong password validation (8+ chars, uppercase, lowercase, numbers)
- Password confirmation matching
- Success screen with email verification instructions
- Link to login page
- Loading states
- Error handling

**Usage:**

```tsx
import { RegisterForm } from "@/components/auth";

<RegisterForm client:load />;
```

---

### ForgotPasswordForm

Password reset request form with email field.

**Features:**

- Email validation
- Success screen with instructions
- Option to resend email
- Link back to login
- Loading states
- Error handling

**Usage:**

```tsx
import { ForgotPasswordForm } from "@/components/auth";

<ForgotPasswordForm client:load />;
```

---

### UpdatePasswordForm

Password update form for both password reset flow and logged-in users.

**Props:**

- `isLoggedIn` (boolean, default: false): Determines UI text and redirect behavior

**Features:**

- Strong password validation
- Password confirmation matching
- Dual mode (reset vs. change)
- Context-aware redirects
- Loading states
- Error handling

**Usage:**

```tsx
import { UpdatePasswordForm } from '@/components/auth';

// Password reset flow
<UpdatePasswordForm client:load isLoggedIn={false} />

// Logged-in user flow
<UpdatePasswordForm client:load isLoggedIn={true} />
```

---

## Validation Rules

### Email

- Required field
- Must match email format: `[text]@[domain].[tld]`

### Password (Registration & Update)

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

### Password Confirmation

- Must exactly match the password field

---

## State Management

All components use local state with `useState`:

```typescript
const [formData, setFormData] = useState({...});
const [errors, setErrors] = useState<Record<string, string>>({});
const [isSubmitting, setIsSubmitting] = useState(false);
```

---

## Error Handling

Errors are stored in a state object and displayed inline:

```typescript
{errors.email && (
  <p className="text-sm text-destructive">
    {errors.email}
  </p>
)}
```

Errors are cleared when the user starts typing:

```typescript
if (errors[field]) {
  setErrors((prev) => {
    const newErrors = { ...prev };
    delete newErrors[field];
    return newErrors;
  });
}
```

---

## User Feedback

All components use toast notifications for success/error messages:

```typescript
import { toast } from "sonner";

toast.success("Login successful");
toast.error("Invalid email or password");
```

---

## Accessibility

All forms include:

- Proper label associations (`htmlFor` + `id`)
- ARIA attributes (`aria-invalid`, `aria-describedby`)
- Required field indicators (\*)
- Keyboard navigation support
- Focus management

Example:

```tsx
<Label htmlFor="email">
  Email <span className="text-destructive">*</span>
</Label>
<Input
  id="email"
  type="email"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
/>
{errors.email && (
  <p id="email-error" className="text-sm text-destructive">
    {errors.email}
  </p>
)}
```

---

## Styling

All components use:

- Shadcn UI components (Card, Input, Label, Button, Alert)
- Tailwind CSS for styling
- Consistent spacing and layout
- Theme-aware colors

---

## Backend Integration

All components have placeholder logic marked with TODO comments:

```typescript
// TODO: Implement actual login logic with Supabase
// const { error } = await supabase.auth.signInWithPassword({
//   email: formData.email,
//   password: formData.password,
// });
```

To integrate with Supabase:

1. Import the browser client: `import { createClient } from '@/lib/supabase/client';`
2. Replace the placeholder logic with actual Supabase calls
3. Handle success and error cases
4. Update redirects as needed

See `docs/auth-backend-integration-guide.md` for detailed instructions.

---

## Testing

To test the components:

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Navigate to the auth pages:
   - http://localhost:4321/login
   - http://localhost:4321/register
   - http://localhost:4321/forgot-password
   - http://localhost:4321/update-password

3. Test form validation:
   - Submit empty forms
   - Enter invalid emails
   - Use weak passwords
   - Mismatch password confirmations

4. Check responsive design:
   - Resize browser window
   - Test on mobile devices

5. Test accessibility:
   - Navigate with keyboard (Tab, Enter)
   - Use screen reader
   - Check focus indicators

---

## File Structure

```
src/components/auth/
├── README.md                 # This file
├── index.ts                  # Barrel export
├── LoginForm.tsx             # Login form component
├── RegisterForm.tsx          # Registration form component
├── ForgotPasswordForm.tsx    # Password reset request form
└── UpdatePasswordForm.tsx    # Password update form
```

---

## Related Files

### Pages

- `src/pages/login.astro` - Login page
- `src/pages/register.astro` - Registration page
- `src/pages/forgot-password.astro` - Forgot password page
- `src/pages/update-password.astro` - Update password page

### Layout

- `src/layouts/AuthLayout.astro` - Minimal layout for auth pages

### Documentation

- `docs/auth-ui-implementation.md` - Detailed implementation docs
- `docs/auth-ui-preview.md` - Visual preview of pages
- `docs/auth-backend-integration-guide.md` - Backend integration guide
- `docs/auth-implementation-summary.md` - Summary of implementation
- `docs/auth-integration-checklist.md` - Integration checklist
- `docs/diagrams/auth-flow.md` - Authentication flow diagrams

---

## Contributing

When adding new auth components:

1. Follow the existing patterns (state management, validation, error handling)
2. Use Shadcn UI components for consistency
3. Include proper accessibility attributes
4. Add TypeScript types
5. Include TODO comments for backend integration
6. Update this README
7. Add documentation in `docs/`

---

## Support

For questions or issues:

1. Check the documentation in `docs/`
2. Review the integration guide
3. Check the flow diagrams
4. Review existing components for patterns
