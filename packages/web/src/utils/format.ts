import type { ApiProductVariant } from 'api'

export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`
}

export function getVariantLabel(variant: Pick<ApiProductVariant, 'values'>): string {
  return variant.values.map((v) => v.option.value).join(' / ')
}
