import { z } from 'zod'
export const RegisterSchema = z.object({ email: z.email(), password: z.string().min(1) })
export const LoginSchema = z.object({ email: z.email(), password: z.string().min(1) })
export const ChangePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(1) })
