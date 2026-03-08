import { Hono } from 'hono'
import { setCookie, deleteCookie, getCookie } from 'hono/cookie'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import type { AuthEnv } from '../types/auth.js'

const auth = new Hono<AuthEnv>()

auth.post('/register', async (c) => {
  const body = await c.req.json<{ email?: string; password?: string }>()
  if (!body.email || !body.password) {
    return c.json({ error: 'email and password are required' }, 400)
  }

  const existing = await prisma.user.findUnique({ where: { email: body.email } })
  if (existing) return c.json({ error: 'Email already registered' }, 409)

  const passwordHash = await bcrypt.hash(body.password, 12)
  const user = await prisma.user.create({
    data: { email: body.email, passwordHash },
  })

  return c.json({ id: user.id, email: user.email }, 201)
})

auth.post('/login', async (c) => {
  const body = await c.req.json<{ email?: string; password?: string }>()
  if (!body.email || !body.password) {
    return c.json({ error: 'email and password are required' }, 400)
  }

  const user = await prisma.user.findUnique({ where: { email: body.email } })
  if (!user) return c.json({ error: 'Invalid credentials' }, 401)

  const valid = await bcrypt.compare(body.password, user.passwordHash)
  if (!valid) return c.json({ error: 'Invalid credentials' }, 401)

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await prisma.session.create({ data: { id: token, userId: user.id, expiresAt } })

  setCookie(c, 'session', token, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: false,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return c.json({ id: user.id, email: user.email })
})

auth.post('/logout', async (c) => {
  const token = getCookie(c, 'session')
  if (token) {
    await prisma.session.deleteMany({ where: { id: token } })
  }
  deleteCookie(c, 'session', { path: '/' })
  return c.json({ success: true })
})

auth.get('/me', requireAuth, async (c) => {
  const user = await prisma.user.findUnique({
    where: { id: c.get('userId') },
    select: { id: true, email: true, createdAt: true },
  })
  return c.json(user)
})

export default auth
