import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import type { AuthEnv } from '../types/auth.js'
import { validate } from '../lib/validate.js'
import { ValidatePromoSchema } from 'schemas'
import { validatePromoCode, getAutoPromos, getDisplayPromos } from '../services/promo.service.js'
import { handleServiceError } from '../lib/errors.js'
import { ServiceError } from '../lib/errors.js'
import prisma from '../lib/prisma.js'

const promos = new Hono<AuthEnv>()

const cartItemInclude = {
  variant: {
    include: {
      product: true,
    },
  },
}

promos.post('/validate', requireAuth, validate('json', ValidatePromoSchema), async (c) => {
  try {
    const { code, cartId } = c.req.valid('json')
    const userId = c.get('userId')

    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { cartItems: { include: cartItemInclude } },
    })
    if (!cart) throw new ServiceError(404, 'Cart not found')
    if (cart.cartItems.length === 0) throw new ServiceError(400, 'Cart is empty')

    const result = await validatePromoCode(code, cart.cartItems, userId)
    return c.json({ promo: result.promo, discountAmount: result.discountAmount })
  } catch (err) {
    return handleServiceError(err, c)
  }
})

promos.get('/auto', requireAuth, async (c) => {
  try {
    const cartId = c.req.query('cartId')
    if (!cartId) throw new ServiceError(400, 'cartId is required')
    const userId = c.get('userId')

    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { cartItems: { include: cartItemInclude } },
    })
    if (!cart) throw new ServiceError(404, 'Cart not found')

    const results = await getAutoPromos(cart.cartItems, userId)
    return c.json(results.map((r) => ({ promo: r.promo, discountAmount: r.discountAmount })))
  } catch (err) {
    return handleServiceError(err, c)
  }
})

promos.get('/display', async (c) => {
  const displayPromos = await getDisplayPromos()
  return c.json(displayPromos)
})

export default promos
