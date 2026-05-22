// lib/schemas/auth.ts
// Zod v3 validation schemas for all auth forms.
// Password policy enforced here (client feedback) AND in Supabase Auth dashboard (server enforcement) — defense-in-depth.
import { z } from 'zod'

// Password policy: 12+ chars, 1 uppercase, 1 number, 1 symbol
// All policy failures produce ONE consolidated user-facing message (per UI-SPEC copywriting contract)
const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 12 characters and include an uppercase letter, number, and symbol.'

const passwordSchema = z
  .string()
  .min(12, PASSWORD_POLICY_MESSAGE)
  .regex(/[A-Z]/, PASSWORD_POLICY_MESSAGE)
  .regex(/[0-9]/, PASSWORD_POLICY_MESSAGE)
  .regex(/[^A-Za-z0-9]/, PASSWORD_POLICY_MESSAGE)

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

export const registerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required.'),
    lastName: z.string().min(1, 'Last name is required.'),
    email: z.string().email('Please enter a valid email address.'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match. Please re-enter your password.',
    path: ['confirmPassword'],
  })

export const mfaCodeSchema = z.object({
  code: z
    .string()
    .length(6, 'Verification code must be 6 digits.')
    .regex(/^\d+$/, 'Verification code must be 6 digits.'),
})

export const backupCodeSchema = z.object({
  code: z.string().min(8, 'Please enter a valid backup recovery code.'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type MfaCodeInput = z.infer<typeof mfaCodeSchema>
export type BackupCodeInput = z.infer<typeof backupCodeSchema>
