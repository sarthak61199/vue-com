import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/admin.js'
import type { AuthEnv } from '../types/auth.js'
import { handleServiceError } from '../lib/errors.js'
import { ServiceError } from '../lib/errors.js'
import {
  getDashboardStats,
  adminListOrders,
  adminGetOrder,
  adminListUsers,
  adminGetUser,
  adminListReviews,
  adminDeleteReview,
  adminListPromos,
  adminGetPromo,
  adminGetProductOptions,
  adminCreatePromo,
  adminUpdatePromo,
  adminDeletePromo,
} from '../services/admin.service.js'
import { validate } from '../lib/validate.js'
import { CreatePromoSchema, UpdatePromoSchema } from 'schemas'

const admin = new Hono<AuthEnv>()

admin.use(requireAuth, requireAdmin)

// Dashboard
admin.get('/stats', async (c) => {
  try {
    const stats = await getDashboardStats()
    return c.json(stats)
  } catch (err) {
    return handleServiceError(err, c)
  }
})

// Orders
admin.get('/orders', async (c) => {
  try {
    const page = Math.max(1, Number(c.req.query('page') ?? 1))
    const search = c.req.query('search') || undefined
    const result = await adminListOrders(page, search)
    return c.json(result)
  } catch (err) {
    return handleServiceError(err, c)
  }
})

admin.get('/orders/:id', async (c) => {
  try {
    const order = await adminGetOrder(c.req.param('id'))
    if (!order) throw new ServiceError(404, 'Order not found')
    return c.json(order)
  } catch (err) {
    return handleServiceError(err, c)
  }
})

// Users
admin.get('/users', async (c) => {
  try {
    const page = Math.max(1, Number(c.req.query('page') ?? 1))
    const search = c.req.query('search') || undefined
    const result = await adminListUsers(page, search)
    return c.json(result)
  } catch (err) {
    return handleServiceError(err, c)
  }
})

admin.get('/users/:id', async (c) => {
  try {
    const user = await adminGetUser(c.req.param('id'))
    if (!user) throw new ServiceError(404, 'User not found')
    return c.json(user)
  } catch (err) {
    return handleServiceError(err, c)
  }
})

// Reviews
admin.get('/reviews', async (c) => {
  try {
    const page = Math.max(1, Number(c.req.query('page') ?? 1))
    const minRating = c.req.query('minRating') ? Number(c.req.query('minRating')) : undefined
    const maxRating = c.req.query('maxRating') ? Number(c.req.query('maxRating')) : undefined
    const result = await adminListReviews(page, minRating, maxRating)
    return c.json(result)
  } catch (err) {
    return handleServiceError(err, c)
  }
})

admin.delete('/reviews/:id', async (c) => {
  try {
    await adminDeleteReview(c.req.param('id'))
    return c.json({ success: true })
  } catch (err) {
    return handleServiceError(err, c)
  }
})

// Promos
admin.get('/product-options', async (c) => {
  try {
    const products = await adminGetProductOptions()
    return c.json(products)
  } catch (err) {
    return handleServiceError(err, c)
  }
})

admin.get('/promos', async (c) => {
  try {
    const promos = await adminListPromos()
    return c.json(promos)
  } catch (err) {
    return handleServiceError(err, c)
  }
})

admin.get('/promos/:id', async (c) => {
  try {
    const promo = await adminGetPromo(c.req.param('id'))
    if (!promo) throw new ServiceError(404, 'Promo not found')
    return c.json(promo)
  } catch (err) {
    return handleServiceError(err, c)
  }
})

admin.post('/promos', validate('json', CreatePromoSchema), async (c) => {
  try {
    const data = c.req.valid('json')
    const promo = await adminCreatePromo(data)
    return c.json(promo, 201)
  } catch (err) {
    return handleServiceError(err, c)
  }
})

admin.patch('/promos/:id', validate('json', UpdatePromoSchema), async (c) => {
  try {
    const data = c.req.valid('json')
    const promo = await adminUpdatePromo(c.req.param('id'), data)
    return c.json(promo)
  } catch (err) {
    return handleServiceError(err, c)
  }
})

admin.delete('/promos/:id', async (c) => {
  try {
    await adminDeletePromo(c.req.param('id'))
    return c.json({ success: true })
  } catch (err) {
    return handleServiceError(err, c)
  }
})

export default admin
