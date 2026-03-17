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
