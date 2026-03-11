import { Hono } from 'hono'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import type { AuthEnv } from '../types/auth.js'
import { validate } from '../lib/validate.js'
import { CreateOrderSchema } from 'schemas'

const orders = new Hono<AuthEnv>()

const orderItemInclude = {
  variant: {
    include: {
      product: true,
      values: { include: { option: true } },
    },
  },
}

// Place an order from a cart
orders.post('/', requireAuth, validate('json', CreateOrderSchema), async (c) => {
  const userId = c.get('userId')
  const body = c.req.valid('json')

  const cart = await prisma.cart.findUnique({
    where: { id: body.cartId },
    include: {
      cartItems: {
        include: {
          variant: true,
        },
      },
    },
  })

  if (!cart) return c.json({ error: 'Cart not found' }, 404)
  if (cart.cartItems.length === 0) return c.json({ error: 'Cart is empty' }, 400)

  const total = cart.cartItems.reduce(
    (sum, item) => sum + item.variant.price * item.quantity,
    0,
  )

  let order
  try {
    order = await prisma.$transaction(async (tx) => {
      for (const item of cart.cartItems) {
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } })
        if (!variant || variant.stock < item.quantity) {
          throw new Error(`Insufficient stock for variant ${item.variantId}`)
        }
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        })
      }

      const newOrder = await tx.order.create({
        data: {
          total,
          userId,
          addressId: body.addressId ?? null,
          orderItems: {
            create: cart.cartItems.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.variant.price,
            })),
          },
        },
        include: {
          orderItems: { include: orderItemInclude },
          address: true,
        },
      })

      await tx.cartItem.deleteMany({ where: { cartId: body.cartId } })

      return newOrder
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message.startsWith('Insufficient stock')) {
      return c.json({ error: 'One or more items in your cart are out of stock' }, 400)
    }
    throw err
  }

  return c.json(order, 201)
})

// Get order by ID
orders.get('/:id', requireAuth, async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.param()
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      orderItems: { include: orderItemInclude },
      address: true,
    },
  })
  if (!order) return c.json({ error: 'Order not found' }, 404)
  if (order.userId !== userId) return c.json({ error: 'Forbidden' }, 403)
  return c.json(order)
})

// Get all orders for the current user
orders.get('/', requireAuth, async (c) => {
  const userId = c.get('userId')
  const userOrders = await prisma.order.findMany({
    where: { userId },
    include: {
      orderItems: { include: orderItemInclude },
      address: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return c.json(userOrders)
})

export default orders
