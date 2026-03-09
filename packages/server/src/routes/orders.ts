import { Hono } from 'hono'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import type { AuthEnv } from '../types/auth.js'

const orders = new Hono<AuthEnv>()

// Place an order from a cart
orders.post('/', requireAuth, async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{ cartId: string; addressId?: string }>()
  if (!body.cartId) return c.json({ error: 'cartId is required' }, 400)

  const cart = await prisma.cart.findUnique({
    where: { id: body.cartId },
    include: { cartItems: { include: { product: true } } },
  })

  if (!cart) return c.json({ error: 'Cart not found' }, 404)
  if (cart.cartItems.length === 0) return c.json({ error: 'Cart is empty' }, 400)

  const total = cart.cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  )

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        total,
        userId,
        addressId: body.addressId ?? null,
        orderItems: {
          create: cart.cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        orderItems: { include: { product: true } },
        address: true,
      },
    })

    await tx.cartItem.deleteMany({ where: { cartId: body.cartId } })

    return newOrder
  })

  return c.json(order, 201)
})

// Get order by ID
orders.get('/:id', requireAuth, async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.param()
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      orderItems: { include: { product: true } },
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
      orderItems: { include: { product: true } },
      address: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return c.json(userOrders)
})

export default orders
