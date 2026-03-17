import prisma from '../lib/prisma.js'

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

// --- Reviews ---

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
