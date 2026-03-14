import prisma from '../lib/prisma.js'
import { ServiceError } from '../lib/errors.js'
import { PromoScope, DiscountType } from '../../prisma/generated/client.js'
import type { Promo, Prisma } from '../../prisma/generated/client.js'

type CartItemWithVariantProduct = {
  variantId: string
  quantity: number
  variant: {
    price: number
    productId: string
    product: {
      categoryId: string | null
    }
  }
}

export type PromoValidationResult = {
  promo: Promo
  discountAmount: number
}

function calculateDiscount(promo: Promo, cartItems: CartItemWithVariantProduct[]): number {
  if (promo.discountType === DiscountType.FREE_SHIPPING) return 0

  let applicableTotal: number

  if (promo.scope === PromoScope.PRODUCT && promo.productId) {
    const matching = cartItems.filter((i) => i.variant.productId === promo.productId)
    if (matching.length === 0) return 0
    applicableTotal = matching.reduce((s, i) => s + i.variant.price * i.quantity, 0)
  } else if (promo.scope === PromoScope.CATEGORY && promo.categoryId) {
    const matching = cartItems.filter((i) => i.variant.product.categoryId === promo.categoryId)
    if (matching.length === 0) return 0
    applicableTotal = matching.reduce((s, i) => s + i.variant.price * i.quantity, 0)
  } else {
    applicableTotal = cartItems.reduce((s, i) => s + i.variant.price * i.quantity, 0)
  }

  if (promo.discountType === DiscountType.PERCENTAGE) {
    return Math.min(applicableTotal, applicableTotal * (promo.discountValue / 100))
  }
  // FIXED
  return Math.min(promo.discountValue, applicableTotal)
}

async function checkUsageLimits(promoId: string, userId: string): Promise<void> {
  const promo = await prisma.promo.findUnique({
    where: { id: promoId },
    include: { _count: { select: { usages: true } } },
  })
  if (!promo) throw new ServiceError(404, 'Promo not found')

  if (promo.maxUses !== null && promo._count.usages >= promo.maxUses) {
    throw new ServiceError(400, 'This promo has reached its usage limit')
  }

  if (promo.maxUsesPerUser !== null) {
    const userUsageCount = await prisma.promoUsage.count({
      where: { promoId, userId },
    })
    if (userUsageCount >= promo.maxUsesPerUser) {
      throw new ServiceError(400, 'You have already used this promo the maximum number of times')
    }
  }
}

export async function validatePromoCode(
  code: string,
  cartItems: CartItemWithVariantProduct[],
  userId: string,
): Promise<PromoValidationResult> {
  const promo = await prisma.promo.findUnique({ where: { code } })

  if (!promo || !promo.isActive || promo.isAutomatic) {
    throw new ServiceError(400, 'Invalid or expired promo code')
  }

  if (promo.expiresAt && promo.expiresAt < new Date()) {
    throw new ServiceError(400, 'This promo code has expired')
  }

  const subtotal = cartItems.reduce((s, i) => s + i.variant.price * i.quantity, 0)

  if (promo.minOrderAmount !== null && subtotal < promo.minOrderAmount) {
    throw new ServiceError(
      400,
      `This promo requires a minimum order of $${promo.minOrderAmount.toFixed(2)}`,
      { minOrderAmount: promo.minOrderAmount },
    )
  }

  // Check scope eligibility
  if (promo.scope === PromoScope.PRODUCT && promo.productId) {
    const hasMatch = cartItems.some((i) => i.variant.productId === promo.productId)
    if (!hasMatch) throw new ServiceError(400, 'No eligible items in cart for this promo')
  } else if (promo.scope === PromoScope.CATEGORY && promo.categoryId) {
    const hasMatch = cartItems.some((i) => i.variant.product.categoryId === promo.categoryId)
    if (!hasMatch) throw new ServiceError(400, 'No eligible items in cart for this promo')
  }

  await checkUsageLimits(promo.id, userId)

  const discountAmount = calculateDiscount(promo, cartItems)
  return { promo, discountAmount }
}

export async function getAutoPromos(
  cartItems: CartItemWithVariantProduct[],
  userId: string,
): Promise<PromoValidationResult[]> {
  const now = new Date()
  const subtotal = cartItems.reduce((s, i) => s + i.variant.price * i.quantity, 0)

  const candidates = await prisma.promo.findMany({
    where: {
      isActive: true,
      isAutomatic: true,
      AND: [
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        { OR: [{ minOrderAmount: null }, { minOrderAmount: { lte: subtotal } }] },
      ],
    },
  })

  const results: PromoValidationResult[] = []

  for (const promo of candidates) {
    // Check scope eligibility
    if (promo.scope === PromoScope.PRODUCT && promo.productId) {
      const hasMatch = cartItems.some((i) => i.variant.productId === promo.productId)
      if (!hasMatch) continue
    } else if (promo.scope === PromoScope.CATEGORY && promo.categoryId) {
      const hasMatch = cartItems.some((i) => i.variant.product.categoryId === promo.categoryId)
      if (!hasMatch) continue
    }

    // Check usage limits (skip if over limit)
    try {
      await checkUsageLimits(promo.id, userId)
    } catch {
      continue
    }

    const discountAmount = calculateDiscount(promo, cartItems)
    results.push({ promo, discountAmount })
  }

  // Sort by discount descending (best deal first)
  return results.sort((a, b) => b.discountAmount - a.discountAmount)
}

// Validates and calculates discount inside a transaction (for race condition safety).
// Does NOT create the PromoUsage record — caller must do that after order creation.
export async function validatePromoInTransaction(
  promoId: string,
  userId: string,
  cartItems: CartItemWithVariantProduct[],
  tx: Prisma.TransactionClient,
): Promise<{ discountAmount: number }> {
  const promo = await tx.promo.findUnique({
    where: { id: promoId },
    include: { _count: { select: { usages: true } } },
  })

  if (!promo || !promo.isActive) {
    throw new ServiceError(400, 'Promo is no longer valid')
  }

  if (promo.expiresAt && promo.expiresAt < new Date()) {
    throw new ServiceError(400, 'This promo code has expired')
  }

  if (promo.maxUses !== null && promo._count.usages >= promo.maxUses) {
    throw new ServiceError(400, 'This promo has reached its usage limit')
  }

  if (promo.maxUsesPerUser !== null) {
    const userUsageCount = await tx.promoUsage.count({ where: { promoId, userId } })
    if (userUsageCount >= promo.maxUsesPerUser) {
      throw new ServiceError(400, 'You have already used this promo the maximum number of times')
    }
  }

  return { discountAmount: calculateDiscount(promo, cartItems) }
}
