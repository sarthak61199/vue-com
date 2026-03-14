import { z } from 'zod'

export const CreateOrderSchema = z.object({
  cartId: z.string().min(1),
  addressId: z.string().optional(),
  promoCode: z.string().optional(),
})
