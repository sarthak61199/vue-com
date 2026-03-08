import { Hono } from 'hono'
import prisma from '../lib/prisma.js'

const orders = new Hono()

// Place an order from a cart
orders.post('/', async (c) => {
  const body = await c.req.json<{ cartId: string }>()
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
        orderItems: {
          create: cart.cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        orderItems: { include: { product: true } },
      },
    })

    await tx.cartItem.deleteMany({ where: { cartId: body.cartId } })

    return newOrder
  })

  return c.json(order, 201)
})

// Get order by ID
orders.get('/:id', async (c) => {
  const { id } = c.req.param()
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      orderItems: { include: { product: true } },
    },
  })
  if (!order) return c.json({ error: 'Order not found' }, 404)
  return c.json(order)
})

// Get all orders
orders.get('/', async (c) => {
  const orders = await prisma.order.findMany({
    include: {
      orderItems: { include: { product: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return c.json(orders)
})

export default orders
