import { z } from 'zod'
export const CreateAddressSchema = z.object({
  label: z.string(), line1: z.string().min(1), line2: z.string(),
  city: z.string().min(1), state: z.string().min(1), zip: z.string().min(1), country: z.string(),
})
