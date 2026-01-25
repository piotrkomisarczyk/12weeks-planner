/**
 * Validation schemas for Authentication-related API endpoints
 * Uses Zod for runtime type validation and type inference
 * Shared between frontend (React forms) and backend (API endpoints)
 */

import { z } from "zod";

/**
 * Password validation schema
 *
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export const PasswordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long" })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least one number" });

/**
 * Email validation schema
 * Validates email format
 */
export const EmailSchema = z
  .string()
  .trim()
  .min(1, { message: "Email is required" })
  .email({ message: "Please enter a valid email address" });

/**
 * Request body schema for POST /api/auth/register
 * Validates user registration data
 *
 * Validates:
 * - email: required, valid email format
 * - password: required, meets password requirements
 * - confirmPassword: required, must match password
 */
export const RegisterBodySchema = z
  .object({
    email: EmailSchema,
    password: PasswordSchema,
    confirmPassword: z.string().min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Inferred TypeScript type from RegisterBodySchema
 */
export type RegisterBody = z.infer<typeof RegisterBodySchema>;

/**
 * Request body schema for POST /api/auth/login
 * Validates user login data
 *
 * Validates:
 * - email: required, valid email format
 * - password: required string (no strength validation for login)
 */
export const LoginBodySchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, { message: "Password is required" }),
});

/**
 * Inferred TypeScript type from LoginBodySchema
 */
export type LoginBody = z.infer<typeof LoginBodySchema>;

/**
 * Request body schema for POST /api/auth/reset-password
 * Validates password reset request
 *
 * Validates:
 * - email: required, valid email format
 */
export const ResetPasswordBodySchema = z.object({
  email: EmailSchema,
});

/**
 * Inferred TypeScript type from ResetPasswordBodySchema
 */
export type ResetPasswordBody = z.infer<typeof ResetPasswordBodySchema>;

/**
 * Request body schema for POST /api/auth/update-password
 * Validates password update data
 *
 * Validates:
 * - password: required, meets password requirements
 * - confirmPassword: required, must match password
 */
export const UpdatePasswordBodySchema = z
  .object({
    password: PasswordSchema,
    confirmPassword: z.string().min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Inferred TypeScript type from UpdatePasswordBodySchema
 */
export type UpdatePasswordBody = z.infer<typeof UpdatePasswordBodySchema>;
