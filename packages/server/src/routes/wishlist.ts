import { Hono } from 'hono'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import type { AuthEnv } from '../types/auth.js'

const wishlist = new Hono<AuthEnv>()

// Get all wishlist items for the current user
wishlist.get('/', requireAuth, async (c) => {
  const userId = c.get('userId')
  const rawItems = await prisma.wishlistItem.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          variants: { where: { isDefault: true }, take: 1, select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  const items = rawItems.map(({ product: { variants, ...product }, ...item }) => ({
    ...item,
    product: { ...product, defaultVariantId: variants[0]?.id ?? null },
  }))
  return c.json(items)
})

// Add a product to wishlist (idempotent)
wishlist.post('/', requireAuth, async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{ productId: string }>()
  const { productId } = body

  if (!productId) return c.json({ error: 'productId is required' }, 400)

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) return c.json({ error: 'Product not found' }, 404)

  const item = await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId },
    update: {},
    include: { product: true },
  })
  return c.json(item)
})

// Remove a product from wishlist
wishlist.delete('/:productId', requireAuth, async (c) => {
  const userId = c.get('userId')
  const { productId } = c.req.param()

  const item = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
  })
  if (!item) return c.json({ error: 'Item not found' }, 404)

  await prisma.wishlistItem.delete({
    where: { userId_productId: { userId, productId } },
  })
  return c.json({ success: true })
})

export default wishlist
