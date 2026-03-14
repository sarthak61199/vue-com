import { z } from 'zod'

export const ValidatePromoSchema = z.object({
  code: z.string().min(1).trim(),
  cartId: z.string().min(1),
})
