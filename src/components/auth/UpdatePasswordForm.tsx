import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabaseClient } from "@/db/supabase.client";

interface UpdatePasswordFormProps {
  isLoggedIn?: boolean;
}

/**
 * Update password form component
 * Handles password updates for both password reset flow and logged-in users
 */
export function UpdatePasswordForm({ isLoggedIn = false }: UpdatePasswordFormProps) {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasValidToken, setHasValidToken] = useState<boolean | null>(null);

  // Check for valid reset token on mount (only for password reset flow)
  useEffect(() => {
    if (!isLoggedIn) {
      checkResetToken();
    } else {
      setHasValidToken(true); // Logged-in users don't need a token
    }
  }, [isLoggedIn]);

  // Check if user has valid reset token
  const checkResetToken = async () => {
    try {
      const { data, error } = await supabaseClient.auth.getSession();

      if (error || !data.session) {
        // No valid session/token - redirect to forgot password
        toast.error("Your reset password link has expired. Please request a new one.");
        setTimeout(() => {
          window.location.href = "/forgot-password";
        }, 3000);
        setHasValidToken(false);
        return;
      }

      setHasValidToken(true);
    } catch (error) {
      console.error("Token validation error:", error);
      toast.error(`Error validating reset link: ${error instanceof Error ? error.message : "Unknown error"}`);
      setTimeout(() => {
        window.location.href = "/forgot-password";
      }, 3000);
      setHasValidToken(false);
    }
  };

  // Validate password strength
  const validatePasswordStrength = (password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  // Validate form
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      const strengthError = validatePasswordStrength(formData.password);
      if (strengthError) {
        newErrors.password = strengthError;
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle input changes
  const handleChange = useCallback(
    (field: "password" | "confirmPassword") => {
      return (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
          ...prev,
          [field]: e.target.value,
        }));
        // Clear error when user starts typing
        if (errors[field]) {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
          });
        }
      };
    },
    [errors]
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Call server-side API to update password
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      toast.success("Password updated successfully");

      // Redirect based on context
      if (isLoggedIn) {
        // For logged-in users, redirect to plans
        setTimeout(() => {
          window.location.href = "/plans";
        }, 1500);
      } else {
        // For password reset flow, redirect to login
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      }
    } catch (error) {
      console.error("Password update error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update password. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking token
  if (hasValidToken === null) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Verifying reset link...</p>
        </div>
      </Card>
    );
  }

  // Don't render form if token is invalid (redirect will happen)
  if (hasValidToken === false) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-destructive">Invalid or expired reset link. Redirecting...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {isLoggedIn ? "Change your password" : "Set new password"}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {isLoggedIn
            ? "Enter a new password for your account"
            : "Create a new password to regain access to your account"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password">
            New Password <span className="text-destructive">*</span>
          </Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={handleChange("password")}
            placeholder="Create a strong password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error password-hint" : "password-hint"}
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-destructive">
              {errors.password}
            </p>
          )}
          <p id="password-hint" className="text-xs text-muted-foreground">
            Must be at least 8 characters with uppercase, lowercase, and numbers
          </p>
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            Confirm New Password <span className="text-destructive">*</span>
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange("confirmPassword")}
            placeholder="Confirm your password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
          />
          {errors.confirmPassword && (
            <p id="confirm-password-error" className="text-sm text-destructive">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update password"}
        </Button>
      </form>

      {/* Cancel/Back Link */}
      {isLoggedIn ? (
        <div className="mt-6 text-center text-sm">
          <a href="/plans" className="text-primary hover:underline">
            Cancel
          </a>
        </div>
      ) : (
        <div className="mt-6 text-center text-sm">
          <a href="/login" className="text-primary hover:underline">
            Back to login
          </a>
        </div>
      )}
    </Card>
  );
}
