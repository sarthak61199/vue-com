import { zValidator } from '@hono/zod-validator'
import type { ZodType } from 'zod'

type Target = Parameters<typeof zValidator>[0]

export function validate<T extends ZodType>(target: Target, schema: T) {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? 'Invalid input'
      return c.json({ error: message }, 400)
    }
  })
}
