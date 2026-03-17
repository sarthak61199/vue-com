import prisma from '../lib/prisma.js'
import { ServiceError } from '../lib/errors.js'
import { DiscountType, PromoScope } from '../../prisma/generated/client.js'
import type { CreatePromoInput, UpdatePromoInput } from 'schemas'

// --- Dashboard ---

export async function getDashboardStats() {
  const [totalProducts, totalOrders, totalUsers, revenueResult, recentOrders, lowStockVariants] =
    await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.aggregate({ _sum: { total: true } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          total: true,
          createdAt: true,
          user: { select: { email: true } },
          _count: { select: { orderItems: true } },
        },
      }),
      prisma.productVariant.findMany({
        where: { stock: { lte: 5 } },
        orderBy: { stock: 'asc' },
        select: {
          id: true,
          stock: true,
          price: true,
          isDefault: true,
          values: {
            select: { option: { select: { value: true } } },
          },
          product: { select: { id: true, name: true } },
        },
      }),
    ])

  return {
    totalProducts,
    totalOrders,
    totalUsers,
    totalRevenue: revenueResult._sum.total ?? 0,
    recentOrders,
    lowStockVariants,
  }
}

// --- Orders ---

export async function adminListOrders(page: number, search?: string) {
  const PAGE_SIZE = 20
  const skip = (page - 1) * PAGE_SIZE

  const where = search
    ? { user: { email: { contains: search } } }
    : {}

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        total: true,
        discountAmount: true,
        shippingCost: true,
        createdAt: true,
        user: { select: { id: true, email: true } },
        _count: { select: { orderItems: true } },
      },
    }),
    prisma.order.count({ where }),
  ])

  return { orders, total }
}

export async function adminGetOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true } },
      address: true,
      promo: true,
      orderItems: {
        include: {
          variant: {
            include: {
              values: { include: { option: true } },
              product: { select: { id: true, name: true, image: true } },
            },
          },
        },
      },
    },
  })
}

// --- Users ---

export async function adminListUsers(page: number, search?: string) {
  const PAGE_SIZE = 20
  const skip = (page - 1) * PAGE_SIZE

  const where = search ? { email: { contains: search } } : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { orders: true, reviews: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  return { users, total }
}

export async function adminGetUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      orders: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          total: true,
          createdAt: true,
          _count: { select: { orderItems: true } },
        },
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { id: true, name: true } } },
      },
      addresses: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

// --- Promos ---

export async function adminListPromos() {
  return prisma.promo.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { usages: true } },
      product: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  })
}

export async function adminGetPromo(id: string) {
  return prisma.promo.findUnique({
    where: { id },
    include: {
      _count: { select: { usages: true } },
      product: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      usages: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          user: { select: { id: true, email: true } },
          order: { select: { id: true, total: true, createdAt: true } },
        },
      },
    },
  })
}

export async function adminGetProductOptions() {
  return prisma.product.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
}

export async function adminCreatePromo(data: CreatePromoInput) {
  return prisma.promo.create({
    data: {
      code: data.code || null,
      description: data.description,
      discountType: data.discountType as DiscountType,
      discountValue: data.discountValue,
      scope: data.scope as PromoScope,
      productId: data.productId || null,
      categoryId: data.categoryId || null,
      minOrderAmount: data.minOrderAmount ?? null,
      maxUses: data.maxUses ?? null,
      maxUsesPerUser: data.maxUsesPerUser ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isActive: data.isActive,
      isAutomatic: data.isAutomatic,
    },
  })
}

export async function adminUpdatePromo(id: string, data: UpdatePromoInput) {
  const update: Record<string, unknown> = {}
  if (data.code !== undefined) update['code'] = data.code || null
  if (data.description !== undefined) update['description'] = data.description
  if (data.discountType !== undefined) update['discountType'] = data.discountType as DiscountType
  if (data.discountValue !== undefined) update['discountValue'] = data.discountValue
  if (data.scope !== undefined) update['scope'] = data.scope as PromoScope
  if (data.productId !== undefined) update['productId'] = data.productId || null
  if (data.categoryId !== undefined) update['categoryId'] = data.categoryId || null
  if (data.minOrderAmount !== undefined) update['minOrderAmount'] = data.minOrderAmount ?? null
  if (data.maxUses !== undefined) update['maxUses'] = data.maxUses ?? null
  if (data.maxUsesPerUser !== undefined) update['maxUsesPerUser'] = data.maxUsesPerUser ?? null
  if (data.expiresAt !== undefined) update['expiresAt'] = data.expiresAt ? new Date(data.expiresAt) : null
  if (data.isActive !== undefined) update['isActive'] = data.isActive
  if (data.isAutomatic !== undefined) update['isAutomatic'] = data.isAutomatic

  return prisma.promo.update({ where: { id }, data: update })
}

export async function adminDeletePromo(id: string) {
  const usageCount = await prisma.promoUsage.count({ where: { promoId: id } })
  if (usageCount > 0) {
    throw new ServiceError(400, 'Cannot delete a promo with existing usages. Deactivate it instead.')
  }
  await prisma.promo.delete({ where: { id } })
}

// --- Reviews ---

export async function adminDeleteReview(id: string) {
  const review = await prisma.review.findUnique({ where: { id }, select: { id: true } })
  if (!review) throw new ServiceError(404, 'Review not found')
  await prisma.review.delete({ where: { id } })
}

export async function adminListReviews(page: number, minRating?: number, maxRating?: number) {
  const PAGE_SIZE = 20
  const skip = (page - 1) * PAGE_SIZE

  const ratingFilter: { gte?: number; lte?: number } = {}
  if (minRating != null) ratingFilter.gte = minRating
  if (maxRating != null) ratingFilter.lte = maxRating

  const where = Object.keys(ratingFilter).length > 0 ? { rating: ratingFilter } : {}

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true } },
        product: { select: { id: true, name: true } },
      },
    }),
    prisma.review.count({ where }),
  ])

  return { reviews, total }
}
