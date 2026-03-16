import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export class ServiceError extends Error {
  constructor(
    public readonly status: ContentfulStatusCode,
    message: string,
    public readonly extra?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}

export function handleServiceError(err: unknown, c: Context): Response {
  if (err instanceof ServiceError) {
    return c.json({ error: err.message, ...err.extra }, err.status)
  }
  throw err
}
