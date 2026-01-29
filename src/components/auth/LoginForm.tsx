import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Login form component
 * Handles user authentication with email and password
 */
export function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for URL parameters (verification status, errors)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verified = params.get("verified");
    const error = params.get("error");

    if (verified === "true") {
      toast.success("Email verified successfully! You can now log in.");
      // Clean URL
      window.history.replaceState({}, "", "/login");
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        invalid_callback: "Invalid verification link. Please try again.",
        link_expired: "Verification link has expired. Please request a new one.",
        verification_failed: "Email verification failed. Please try again.",
        unexpected: "An unexpected error occurred. Please try again.",
      };
      toast.error(errorMessages[error] || "An error occurred.");
      // Clean URL
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  // Validate form
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle input changes
  const handleChange = useCallback(
    (field: "email" | "password") => {
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

    const isValid = validate();

    if (!isValid) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Call login API endpoint
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors (400)
        if (response.status === 400 && data.details) {
          const newErrors: Record<string, string> = {};
          data.details.forEach((detail: { path: string[]; message: string }) => {
            const field = detail.path[0];
            newErrors[field] = detail.message;
          });
          setErrors(newErrors);
          return;
        }

        // Handle email not verified (403)
        if (response.status === 403 && data.code === "EMAIL_NOT_VERIFIED") {
          toast.error(data.error, {
            duration: 6000,
          });
          return;
        }

        // Handle authentication errors (401) and other errors
        toast.error(data.error || "An error occurred. Please try again.");
        return;
      }

      // Success - redirect to home page
      // toast.success('Login successful');
      window.location.href = "/";
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Welcome</h1>
        <p className="text-muted-foreground mt-2 text-sm">Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" data-test-id="login-form" noValidate>
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={handleChange("email")}
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            data-test-id="login-email-input"
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password">
            Password <span className="text-destructive">*</span>
          </Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={handleChange("password")}
            placeholder="Enter your password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            data-test-id="login-password-input"
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-destructive">
              {errors.password}
            </p>
          )}
        </div>

        {/* Forgot Password Link */}
        <div className="flex justify-start">
          <a href="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot password?
          </a>
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isSubmitting} data-test-id="login-submit-button">
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      {/* Register Link */}
      <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">Don&apos;t have an account? </span>
        <a href="/register" className="text-primary hover:underline">
          Sign up
        </a>
      </div>
    </Card>
  );
}
