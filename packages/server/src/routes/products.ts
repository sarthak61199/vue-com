import { Hono } from 'hono'
import prisma from '../lib/prisma.js'
import type { Prisma } from '../../prisma/generated/client.js'
import { validate } from '../lib/validate.js'
import { ProductQuerySchema } from 'schemas'

const products = new Hono()

products.get('/', validate('query', ProductQuerySchema), async (c) => {
  const PAGE_SIZE = 9
  const q = c.req.valid('query')
  const page = q.page ?? 1
  const skip = (page - 1) * PAGE_SIZE
  const search = q.search?.trim()
  const categoryId = q.categoryId
  const minPrice = q.minPrice
  const maxPrice = q.maxPrice
  const minRating = q.minRating

  const where: Prisma.ProductWhereInput = {}

  if (search) {
    where.OR = [{ name: { contains: search } }, { description: { contains: search } }]
  }
  if (categoryId) {
    where.categoryId = categoryId
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {}
    if (minPrice !== undefined) where.price.gte = minPrice
    if (maxPrice !== undefined) where.price.lte = maxPrice
  }
  if (minRating !== undefined) {
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

  const productIds = items.map((p) => p.id)

  const [ratings, variantRanges, defaultVariants] = await Promise.all([
    prisma.review.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds } },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    prisma.productVariant.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds } },
      _min: { price: true },
      _max: { price: true },
    }),
    prisma.productVariant.findMany({
      where: { productId: { in: productIds }, isDefault: true },
      select: { id: true, productId: true },
    }),
  ])

  const ratingsMap = new Map(ratings.map((r) => [r.productId, r]))
  const rangeMap = new Map(variantRanges.map((r) => [r.productId, r]))
  const defaultVariantMap = new Map(defaultVariants.map((v) => [v.productId, v.id]))

  const enriched = items.map((p) => {
    const r = ratingsMap.get(p.id)
    const range = rangeMap.get(p.id)
    return {
      ...p,
      averageRating: r?._avg.rating ?? null,
      reviewCount: r?._count.rating ?? 0,
      priceRange: range
        ? { min: range._min.price ?? p.price, max: range._max.price ?? p.price }
        : { min: p.price, max: p.price },
      defaultVariantId: defaultVariantMap.get(p.id) ?? null,
    }
  })

  return c.json({ items: enriched, total })
})

products.get('/:id', async (c) => {
  const { id } = c.req.param()
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      variantTypes: {
        orderBy: { position: 'asc' },
        include: {
          options: { orderBy: { position: 'asc' } },
        },
      },
      variants: {
        include: {
          values: {
            include: { option: true },
          },
        },
      },
    },
  })
  if (!product) return c.json({ error: 'Product not found' }, 404)

  const [agg, defaultVariant] = await Promise.all([
    prisma.review.aggregate({
      where: { productId: id },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    prisma.productVariant.findFirst({
      where: { productId: id, isDefault: true },
      select: { id: true },
    }),
  ])
  const reviewCount = agg._count.rating
  return c.json({
    ...product,
    averageRating: reviewCount > 0 ? agg._avg.rating : null,
    reviewCount,
    defaultVariantId: defaultVariant?.id ?? null,
  })
})

export default products
