import { z } from 'zod'
export const RegisterSchema = z.object({ email: z.email("Invalid email address").nonempty("Email is required"), password: z.string().nonempty("Password is required"), confirm: z.string().nonempty("Confirm password is required") })
    .refine((data) => data.password === data.confirm, {
        message: 'Passwords do not match',
        path: ['confirm'],
    })
export const LoginSchema = z.object({ email: z.email("Invalid email address").nonempty("Email is required"), password: z.string().nonempty("Password is required") })
export const ChangePasswordSchema = z.object({ currentPassword: z.string().nonempty("Current password is required"), newPassword: z.string().nonempty("New password is required"), confirm: z.string().nonempty("Confirm new password is required") })
    .refine((data) => data.newPassword === data.confirm, {
        message: 'New passwords do not match',
        path: ['confirm'],
    })
