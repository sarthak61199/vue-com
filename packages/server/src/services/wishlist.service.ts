import prisma from '../lib/prisma.js'
import { ServiceError } from '../lib/errors.js'

export async function getWishlist(userId: string) {
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
  return rawItems.map(({ product: { variants, ...product }, ...item }) => ({
    ...item,
    product: { ...product, defaultVariantId: variants[0]?.id ?? null },
  }))
}

export async function addToWishlist(userId: string, productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) throw new ServiceError(404, 'Product not found')

  return prisma.wishlistItem.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId },
    update: {},
    include: { product: true },
  })
}

export async function removeFromWishlist(userId: string, productId: string): Promise<void> {
  const item = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
  })
  if (!item) throw new ServiceError(404, 'Item not found')

  await prisma.wishlistItem.delete({ where: { userId_productId: { userId, productId } } })
}
