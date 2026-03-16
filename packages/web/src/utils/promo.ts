import type { ApiDisplayPromo, ApiProduct } from 'api'

export function getDiscountedPrice(price: number, promo: ApiDisplayPromo): number {
  if (promo.discountType === 'PERCENTAGE') return price * (1 - promo.discountValue / 100)
  if (promo.discountType === 'FIXED') return Math.max(0, price - promo.discountValue)
  return price
}

export function getPromoForProduct(
  displayPromos: ApiDisplayPromo[],
  product: ApiProduct,
): ApiDisplayPromo | null {
  return (
    displayPromos.find(
      (p) =>
        (p.scope === 'PRODUCT' && p.productId === product.id) ||
        (p.scope === 'CATEGORY' && p.categoryId === product.categoryId),
    ) ?? null
  )
}
