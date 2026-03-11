import { z } from 'zod'
export const CreateReviewSchema = z.object({ productId: z.string().min(1), rating: z.number().int().min(1).max(5), body: z.string().optional() })
