import { createMiddleware } from 'hono/factory'
import prisma from '../lib/prisma.js'
import type { AuthEnv } from '../types/auth.js'

export const requireAdmin = createMiddleware<AuthEnv>(async (c, next) => {
  const userId = c.get('userId')
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (!user || user.role !== 'ADMIN') return c.json({ error: 'Forbidden' }, 403)
  await next()
})
