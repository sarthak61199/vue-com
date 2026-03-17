import { z } from 'zod'

export const ValidatePromoSchema = z.object({
  code: z.string().min(1).trim(),
  cartId: z.string().min(1),
})

export const CreatePromoSchema = z.object({
  code: z.string().trim().min(1).nullable().optional(),
  description: z.string().trim().min(1, 'Description is required'),
  discountType: z.enum(['PERCENTAGE', 'FIXED', 'FREE_SHIPPING']),
  discountValue: z.number().min(0),
  scope: z.enum(['ORDER', 'PRODUCT', 'CATEGORY']),
  productId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  minOrderAmount: z.number().min(0).nullable().optional(),
  maxUses: z.number().int().min(1).nullable().optional(),
  maxUsesPerUser: z.number().int().min(1).nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  isActive: z.boolean(),
  isAutomatic: z.boolean(),
})

export const UpdatePromoSchema = CreatePromoSchema.partial()

export type CreatePromoInput = z.infer<typeof CreatePromoSchema>
export type UpdatePromoInput = z.infer<typeof UpdatePromoSchema>