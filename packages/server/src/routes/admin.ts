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
} from '../services/admin.service.js'

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

export default admin
