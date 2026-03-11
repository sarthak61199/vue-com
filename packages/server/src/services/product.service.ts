import prisma from '../lib/prisma.js'
import type { Prisma } from '../../prisma/generated/client.js'
import { ServiceError } from '../lib/errors.js'

export interface ProductFilters {
  page?: number
  search?: string
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  excludeOutOfStock?: boolean
}

export async function listProducts(filters: ProductFilters) {
  const PAGE_SIZE = 9
  const page = filters.page ?? 1
  const skip = (page - 1) * PAGE_SIZE
  const search = filters.search?.trim()

  const where: Prisma.ProductWhereInput = {}

  if (search) {
    where.OR = [{ name: { contains: search } }, { description: { contains: search } }]
  }
  if (filters.categoryId) {
    where.categoryId = filters.categoryId
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {}
    if (filters.minPrice !== undefined) where.price.gte = filters.minPrice
    if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice
  }
  if (filters.excludeOutOfStock) {
    where.variants = { some: { stock: { gt: 0 } } }
  }
  if (filters.minRating !== undefined) {
    const ratingGroups = await prisma.review.groupBy({
      by: ['productId'],
      _avg: { rating: true },
      having: { rating: { _avg: { gte: filters.minRating } } },
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

  const [ratings, variantRanges, defaultVariants, stockTotals] = await Promise.all([
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
    prisma.productVariant.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds } },
      _sum: { stock: true },
    }),
  ])

  const ratingsMap = new Map(ratings.map((r) => [r.productId, r]))
  const rangeMap = new Map(variantRanges.map((r) => [r.productId, r]))
  const defaultVariantMap = new Map(defaultVariants.map((v) => [v.productId, v.id]))
  const stockMap = new Map(stockTotals.map((s) => [s.productId, s._sum.stock ?? 0]))

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
      totalStock: stockMap.get(p.id) ?? 0,
    }
  })

  return { items: enriched, total }
}

export async function getProductById(id: string) {
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
  if (!product) throw new ServiceError(404, 'Product not found')

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
  return {
    ...product,
    averageRating: reviewCount > 0 ? agg._avg.rating : null,
    reviewCount,
    defaultVariantId: defaultVariant?.id ?? null,
  }
}
