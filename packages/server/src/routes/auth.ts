import { Hono } from 'hono'
import { setCookie, deleteCookie, getCookie } from 'hono/cookie'
import { requireAuth } from '../middleware/auth.js'
import type { AuthEnv } from '../types/auth.js'
import { validate } from '../lib/validate.js'
import { RegisterSchema, LoginSchema, ChangePasswordSchema } from 'schemas'
import { registerUser, loginUser, logoutUser, getMe, changePassword } from '../services/auth.service.js'
import { handleServiceError } from '../lib/errors.js'

const auth = new Hono<AuthEnv>()

auth.post('/register', validate('json', RegisterSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    const user = await registerUser(body.email, body.password)
    return c.json(user, 201)
  } catch (err) {
    return handleServiceError(err, c)
  }
})

auth.post('/login', validate('json', LoginSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    const result = await loginUser(body.email, body.password)
    setCookie(c, 'session', result.token, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    return c.json({ id: result.id, email: result.email })
  } catch (err) {
    return handleServiceError(err, c)
  }
})

auth.post('/logout', async (c) => {
  await logoutUser(getCookie(c, 'session'))
  deleteCookie(c, 'session', { path: '/' })
  return c.json({ success: true })
})

auth.get('/me', requireAuth, async (c) => {
  const user = await getMe(c.get('userId'))
  return c.json(user)
})

auth.patch('/password', requireAuth, validate('json', ChangePasswordSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    await changePassword(c.get('userId'), body.currentPassword, body.newPassword)
    return c.json({ success: true })
  } catch (err) {
    return handleServiceError(err, c)
  }
})

export default auth
