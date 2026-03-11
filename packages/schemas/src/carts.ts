import { z } from 'zod'
export const AddCartItemSchema = z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1) })
export const UpdateCartItemSchema = z.object({ quantity: z.number().int().min(1) })
