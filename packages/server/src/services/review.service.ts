import prisma from '../lib/prisma.js'
import { ServiceError } from '../lib/errors.js'

export async function getProductReviews(productId: string) {
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
  return { reviews: reviewList, averageRating, reviewCount }
}

export async function getReviewEligibility(userId: string, productId: string) {
  const [hasPurchased, existingReview] = await Promise.all([
    prisma.orderItem.findFirst({
      where: { variant: { productId }, order: { userId } },
    }),
    prisma.review.findUnique({
      where: { userId_productId: { userId, productId } },
      include: { user: { select: { id: true, email: true } } },
    }),
  ])
  return { canReview: !!hasPurchased, existingReview }
}

export async function upsertReview(
  userId: string,
  productId: string,
  rating: number,
  body?: string,
) {
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) throw new ServiceError(404, 'Product not found')

  const hasPurchased = await prisma.orderItem.findFirst({
    where: { variant: { productId }, order: { userId } },
  })
  if (!hasPurchased) {
    throw new ServiceError(403, 'You must purchase this product before reviewing it')
  }

  const isNew = !(await prisma.review.findUnique({
    where: { userId_productId: { userId, productId } },
  }))

  const review = await prisma.review.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId, rating, body: body ?? null },
    update: { rating, body: body ?? null },
    include: { user: { select: { id: true, email: true } } },
  })

  return { review, isNew }
}
