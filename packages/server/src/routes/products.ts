import { Hono } from 'hono'
import prisma from '../lib/prisma.js'
import type { Prisma } from '../../prisma/generated/client.js'

const products = new Hono()

products.get('/', async (c) => {
  const PAGE_SIZE = 9
  const raw = c.req.query('page')
  const page = Math.max(1, parseInt(raw ?? '1', 10) || 1)
  const skip = (page - 1) * PAGE_SIZE
  const search = c.req.query('search')?.trim()
  const categoryId = c.req.query('categoryId')?.trim() || undefined
  const minPrice = parseFloat(c.req.query('minPrice') ?? '')
  const maxPrice = parseFloat(c.req.query('maxPrice') ?? '')
  const minRating = parseFloat(c.req.query('minRating') ?? '')

  const where: Prisma.ProductWhereInput = {}

  if (search) {
    where.OR = [{ name: { contains: search } }, { description: { contains: search } }]
  }
  if (categoryId) {
    where.categoryId = categoryId
  }
  if (!isNaN(minPrice) || !isNaN(maxPrice)) {
    where.price = {}
    if (!isNaN(minPrice)) where.price.gte = minPrice
    if (!isNaN(maxPrice)) where.price.lte = maxPrice
  }
  if (!isNaN(minRating) && minRating > 0) {
    const ratingGroups = await prisma.review.groupBy({
      by: ['productId'],
      _avg: { rating: true },
      having: { rating: { _avg: { gte: minRating } } },
    })
    where.id = { in: ratingGroups.map((r) => r.productId) }
  }

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: 'asc' },
      include: { category: true },
    }),
    prisma.product.count({ where }),
  ])

  const ratings = await prisma.review.groupBy({
    by: ['productId'],
    where: { productId: { in: items.map((p) => p.id) } },
    _avg: { rating: true },
    _count: { rating: true },
  })
  const ratingsMap = new Map(ratings.map((r) => [r.productId, r]))
  const enriched = items.map((p) => {
    const r = ratingsMap.get(p.id)
    return { ...p, averageRating: r?._avg.rating ?? null, reviewCount: r?._count.rating ?? 0 }
  })

  return c.json({ items: enriched, total })
})

products.get('/:id', async (c) => {
  const { id } = c.req.param()
  const product = await prisma.product.findUnique({ where: { id }, include: { category: true } })
  if (!product) return c.json({ error: 'Product not found' }, 404)

  const agg = await prisma.review.aggregate({
    where: { productId: id },
    _avg: { rating: true },
    _count: { rating: true },
  })
  const reviewCount = agg._count.rating
  return c.json({ ...product, averageRating: reviewCount > 0 ? agg._avg.rating : null, reviewCount })
})

export default products
