import { Hono } from 'hono'
import prisma from '../lib/prisma.js'

const products = new Hono()

products.get('/', async (c) => {
  const PAGE_SIZE = 9
  const raw = c.req.query('page')
  const page = Math.max(1, parseInt(raw ?? '1', 10) || 1)
  const skip = (page - 1) * PAGE_SIZE
  const search = c.req.query('search')?.trim()

  const where = search
    ? { OR: [{ name: { contains: search } }, { description: { contains: search } }] }
    : {}

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({ where, skip, take: PAGE_SIZE, orderBy: { createdAt: 'asc' } }),
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
  const product = await prisma.product.findUnique({ where: { id } })
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
