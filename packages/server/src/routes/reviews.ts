import { Hono } from 'hono'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import type { AuthEnv } from '../types/auth.js'

const reviews = new Hono<AuthEnv>()

// Get all reviews for a product (public)
reviews.get('/product/:productId', async (c) => {
  const { productId } = c.req.param()

  const [reviewList, agg] = await Promise.all([
    prisma.review.findMany({
      where: { productId },
      include: { user: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ])

  const reviewCount = agg._count.rating
  const averageRating = reviewCount > 0 ? agg._avg.rating : null

  return c.json({ reviews: reviewList, averageRating, reviewCount })
})

// Check if current user can review a product (auth required)
reviews.get('/eligibility/:productId', requireAuth, async (c) => {
  const userId = c.get('userId')
  const { productId } = c.req.param()

  const [hasPurchased, existingReview] = await Promise.all([
    prisma.orderItem.findFirst({
      where: { productId, order: { userId } },
    }),
    prisma.review.findUnique({
      where: { userId_productId: { userId, productId } },
      include: { user: { select: { id: true, email: true } } },
    }),
  ])

  return c.json({ canReview: !!hasPurchased, existingReview })
})

// Create or update a review (auth required)
reviews.post('/', requireAuth, async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{ productId: string; rating: number; body?: string }>()
  const { productId, rating, body: reviewBody } = body

  if (!productId) return c.json({ error: 'productId is required' }, 400)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return c.json({ error: 'rating must be an integer between 1 and 5' }, 400)
  }

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) return c.json({ error: 'Product not found' }, 404)

  const hasPurchased = await prisma.orderItem.findFirst({
    where: { productId, order: { userId } },
  })
  if (!hasPurchased) {
    return c.json({ error: 'You must purchase this product before reviewing it' }, 403)
  }

  const isNew = !(await prisma.review.findUnique({
    where: { userId_productId: { userId, productId } },
  }))

  const review = await prisma.review.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId, rating, body: reviewBody ?? null },
    update: { rating, body: reviewBody ?? null },
    include: { user: { select: { id: true, email: true } } },
  })

  return c.json(review, isNew ? 201 : 200)
})

export default reviews
