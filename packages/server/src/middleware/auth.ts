import { createMiddleware } from 'hono/factory'
import { getCookie, deleteCookie } from 'hono/cookie'
import prisma from '../lib/prisma.js'
import type { AuthEnv } from '../types/auth.js'

export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const token = getCookie(c, 'session')
  if (!token) return c.json({ error: 'Unauthenticated' }, 401)

  const session = await prisma.session.findUnique({ where: { id: token } })
  if (!session || session.expiresAt < new Date()) {
    deleteCookie(c, 'session', { path: '/' })
    return c.json({ error: 'Session expired' }, 401)
  }

  c.set('userId', session.userId)
  await next()
})
