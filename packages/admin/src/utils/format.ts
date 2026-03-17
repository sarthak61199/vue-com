export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase()
}

export function toDatetimeLocal(isoString: string | null | undefined): string {
  if (!isoString) return ''
  const d = new Date(isoString)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatDiscountValue(
  discountType: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING',
  discountValue: number,
): string {
  if (discountType === 'PERCENTAGE') return `${discountValue}%`
  if (discountType === 'FIXED') return `$${discountValue.toFixed(2)}`
  return 'Free shipping'
}
