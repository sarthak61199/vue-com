import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import type { AuthEnv } from '../types/auth.js'
import { validate } from '../lib/validate.js'
import { CreateOrderSchema } from 'schemas'
import { createOrder, getOrderById, getUserOrders } from '../services/order.service.js'
import { handleServiceError } from '../lib/errors.js'

const orders = new Hono<AuthEnv>()

orders.post('/', requireAuth, validate('json', CreateOrderSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    const order = await createOrder(c.get('userId'), body.cartId, body.addressId, body.promoCode)
    return c.json(order, 201)
  } catch (err) {
    return handleServiceError(err, c)
  }
})

orders.get('/:id', requireAuth, async (c) => {
  try {
    const order = await getOrderById(c.req.param('id'), c.get('userId'))
    return c.json(order)
  } catch (err) {
    return handleServiceError(err, c)
  }
})

orders.get('/', requireAuth, async (c) => {
  const userOrders = await getUserOrders(c.get('userId'))
  return c.json(userOrders)
})

export default orders
