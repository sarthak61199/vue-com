import { z } from 'zod'

export const CreateOrderSchema = z.object({
  cartId: z.string().min(1),
  addressId: z.string().optional(),
  promoCode: z.string().optional(),
  shippingCost: z.number().min(0).optional(),
})
