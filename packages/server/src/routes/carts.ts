import { Hono } from 'hono'
import prisma from '../lib/prisma.js'
import { validate } from '../lib/validate.js'
import { AddCartItemSchema, UpdateCartItemSchema } from 'schemas'

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
carts.post('/:id/items', validate('json', AddCartItemSchema), async (c) => {
  const { id } = c.req.param()

  const cart = await prisma.cart.findUnique({ where: { id } })
  if (!cart) return c.json({ error: 'Cart not found' }, 404)

  const body = c.req.valid('json')

  const variant = await prisma.productVariant.findUnique({ where: { id: body.variantId } })
  if (!variant) return c.json({ error: 'Variant not found' }, 404)

  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: id, variantId: body.variantId } },
  })
  const currentQty = existingItem?.quantity ?? 0
  if (currentQty + body.quantity > variant.stock) {
    return c.json({ error: 'Not enough stock', availableStock: variant.stock - currentQty }, 400)
  }

  const cartItem = await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: id, variantId: body.variantId } },
    create: { cartId: id, variantId: body.variantId, quantity: body.quantity },
    update: { quantity: { increment: body.quantity } },
    include: variantInclude,
  })

  return c.json(cartItem, 201)
})

// Update item quantity
carts.patch('/:id/items/:variantId', validate('json', UpdateCartItemSchema), async (c) => {
  const { id, variantId } = c.req.param()
  const body = c.req.valid('json')

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: id, variantId } },
  })
  if (!existing) return c.json({ error: 'Cart item not found' }, 404)

  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } })
  if (variant && body.quantity > variant.stock) {
    return c.json({ error: 'Not enough stock', availableStock: variant.stock }, 400)
  }

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
