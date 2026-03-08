import { Hono } from 'hono'
import prisma from '../lib/prisma.js'

const carts = new Hono()

// Create a new cart
carts.post('/', async (c) => {
  const cart = await prisma.cart.create({ data: {} })
  return c.json(cart, 201)
})

// Get cart with items and product details
carts.get('/:id', async (c) => {
  const { id } = c.req.param()
  const cart = await prisma.cart.findUnique({
    where: { id },
    include: {
      cartItems: {
        include: { product: true },
      },
    },
  })
  if (!cart) return c.json({ error: 'Cart not found' }, 404)
  return c.json(cart)
})

// Add item to cart
carts.post('/:id/items', async (c) => {
  const { id } = c.req.param()

  const cart = await prisma.cart.findUnique({ where: { id } })
  if (!cart) return c.json({ error: 'Cart not found' }, 404)

  const body = await c.req.json<{ productId: string; quantity: number }>()
  if (!body.productId || !body.quantity || body.quantity < 1) {
    return c.json({ error: 'productId and quantity (>= 1) are required' }, 400)
  }

  const product = await prisma.product.findUnique({ where: { id: body.productId } })
  if (!product) return c.json({ error: 'Product not found' }, 404)

  const cartItem = await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: id, productId: body.productId } },
    create: { cartId: id, productId: body.productId, quantity: body.quantity },
    update: { quantity: { increment: body.quantity } },
    include: { product: true },
  })

  return c.json(cartItem, 201)
})

// Update item quantity
carts.patch('/:id/items/:productId', async (c) => {
  const { id, productId } = c.req.param()
  const body = await c.req.json<{ quantity: number }>()

  if (!body.quantity || body.quantity < 1) {
    return c.json({ error: 'quantity must be >= 1' }, 400)
  }

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: id, productId } },
  })
  if (!existing) return c.json({ error: 'Cart item not found' }, 404)

  const cartItem = await prisma.cartItem.update({
    where: { cartId_productId: { cartId: id, productId } },
    data: { quantity: body.quantity },
    include: { product: true },
  })

  return c.json(cartItem)
})

// Remove item from cart
carts.delete('/:id/items/:productId', async (c) => {
  const { id, productId } = c.req.param()

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: id, productId } },
  })
  if (!existing) return c.json({ error: 'Cart item not found' }, 404)

  await prisma.cartItem.delete({
    where: { cartId_productId: { cartId: id, productId } },
  })

  return c.json({ success: true })
})

export default carts
