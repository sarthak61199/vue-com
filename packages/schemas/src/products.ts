import { z } from 'zod'
export const ProductQuerySchema = z.object({
  page:       z.coerce.number().int().positive().optional(),
  search:     z.string().optional(),
  categoryId: z.string().optional(),
  minPrice:   z.coerce.number().nonnegative().optional(),
  maxPrice:   z.coerce.number().nonnegative().optional(),
  minRating:         z.coerce.number().min(1).max(5).optional(),
  excludeOutOfStock: z.string().transform(v => v === 'true').optional(),
})
