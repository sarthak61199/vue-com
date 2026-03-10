import { Hono } from 'hono'
import prisma from '../lib/prisma.js'

const carts = new Hono()

const variantInclude = {
  variant: {
    include: {
      product: true,
      values: { include: { option: true } },
    },
  },
}

// Create a new cart
carts.post('/', async (c) => {
  const cart = await prisma.cart.create({ data: {} })
  return c.json(cart, 201)
})

// Get cart with items and variant/product details
carts.get('/:id', async (c) => {
  const { id } = c.req.param()
  const cart = await prisma.cart.findUnique({
    where: { id },
    include: {
      cartItems: { include: variantInclude },
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

  const body = await c.req.json<{ variantId: string; quantity: number }>()
  if (!body.variantId || !body.quantity || body.quantity < 1) {
    return c.json({ error: 'variantId and quantity (>= 1) are required' }, 400)
  }

  const variant = await prisma.productVariant.findUnique({ where: { id: body.variantId } })
  if (!variant) return c.json({ error: 'Variant not found' }, 404)

  const cartItem = await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: id, variantId: body.variantId } },
    create: { cartId: id, variantId: body.variantId, quantity: body.quantity },
    update: { quantity: { increment: body.quantity } },
    include: variantInclude,
  })

  return c.json(cartItem, 201)
})

// Update item quantity
carts.patch('/:id/items/:variantId', async (c) => {
  const { id, variantId } = c.req.param()
  const body = await c.req.json<{ quantity: number }>()

  if (!body.quantity || body.quantity < 1) {
    return c.json({ error: 'quantity must be >= 1' }, 400)
  }

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: id, variantId } },
  })
  if (!existing) return c.json({ error: 'Cart item not found' }, 404)

  const cartItem = await prisma.cartItem.update({
    where: { cartId_variantId: { cartId: id, variantId } },
    data: { quantity: body.quantity },
    include: variantInclude,
  })

  return c.json(cartItem)
})

// Remove item from cart
carts.delete('/:id/items/:variantId', async (c) => {
  const { id, variantId } = c.req.param()

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: id, variantId } },
  })
  if (!existing) return c.json({ error: 'Cart item not found' }, 404)

  await prisma.cartItem.delete({
    where: { cartId_variantId: { cartId: id, variantId } },
  })

  return c.json({ success: true })
})

export default carts
