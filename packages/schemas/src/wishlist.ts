import { z } from 'zod'
export const AddWishlistItemSchema = z.object({ productId: z.string().min(1) })
