import type { Context } from 'hono'

export class ServiceError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly extra?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}

export function handleServiceError(err: unknown, c: Context): Response {
  if (err instanceof ServiceError) {
    return c.json({ error: err.message, ...err.extra }, err.status as any)
  }
  throw err
}
