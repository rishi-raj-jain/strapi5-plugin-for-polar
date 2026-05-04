export type PolarPrice = {
  id: string
  amount_type: string
  price_currency?: string
  price_amount?: number
  is_archived?: boolean
}

export type PolarProduct = {
  id: string
  name: string
  description?: string | null
  is_recurring: boolean
  recurring_interval?: string | null
  recurring_interval_count?: number | null
  trial_interval?: string | null
  trial_interval_count?: number | null
  prices: PolarPrice[]
  benefits?: { id: string; type: string }[]
}

export function intervalToSelect(p: Pick<PolarProduct, 'is_recurring' | 'recurring_interval' | 'recurring_interval_count'>): string {
  if (!p.is_recurring) return 'oneTime'
  const i = p.recurring_interval
  const c = p.recurring_interval_count ?? 1
  if (i === 'week' && c === 2) return '2weeks'
  if (i === 'month' && c === 6) return '6months'
  if (i === 'day' || i === 'week' || i === 'month' || i === 'year') return i
  return 'month'
}

export function subscriptionFrequencyLabel(p: Pick<PolarProduct, 'recurring_interval' | 'recurring_interval_count'>): string | null {
  const interval = p.recurring_interval
  const count = p.recurring_interval_count ?? 1
  if (!interval) return null
  const unit = count === 1 ? interval : `${interval}s`
  return `${count} ${unit}`
}

export function formatPrice(price: PolarPrice | undefined): string {
  if (!price || price.amount_type !== 'fixed') return '—'
  const major = (price.price_amount ?? 0) / 100
  const cur = (price.price_currency ?? '').toUpperCase()
  return `${major} ${cur}`
}

export function firstCatalogPrice(p: Pick<PolarProduct, 'prices'>): PolarPrice | undefined {
  return p.prices?.find((x) => x.amount_type === 'fixed' && !x.is_archived) || p.prices?.[0]
}
