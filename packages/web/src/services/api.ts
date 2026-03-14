const BASE = 'http://localhost:3000/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`)
  }
  return res.json()
}

// --- Response types (matches server schema) ---

export interface ApiUser {
  id: string
  email: string
  createdAt: string
}

export interface ApiCategory {
  id: string
  name: string
}

export interface ApiVariantOption {
  id: string
  value: string
  position: number
  variantTypeId: string
}

export interface ApiVariantType {
  id: string
  name: string
  position: number
  options: ApiVariantOption[]
}

export interface ApiProductVariantValue {
  optionId: string
  option: ApiVariantOption
}

export interface ApiProductVariant {
  id: string
  productId: string
  price: number
  stock: number
  image: string | null
  isDefault: boolean
  values: ApiProductVariantValue[]
}

export interface ApiProduct {
  id: string
  name: string
  price: number
  description: string
  image: string | null
  categoryId: string | null
  category?: ApiCategory | null
  createdAt: string
  updatedAt: string
  averageRating?: number | null
  reviewCount?: number
  variantTypes?: ApiVariantType[]
  variants?: ApiProductVariant[]
  priceRange?: { min: number; max: number }
  defaultVariantId?: string | null
  totalStock?: number
}

export interface ProductFilters {
  page?: number
  search?: string
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  excludeOutOfStock?: boolean
}

export interface ApiReview {
  id: string
  userId: string
  productId: string
  rating: number
  body: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; email: string }
}

export interface ApiReviewsResponse {
  reviews: ApiReview[]
  averageRating: number | null
  reviewCount: number
}

export interface ApiEligibilityResponse {
  canReview: boolean
  existingReview: ApiReview | null
}

export interface ApiProductPage {
  items: ApiProduct[]
  total: number
}

export interface ApiCartItem {
  cartId: string
  variantId: string
  quantity: number
  variant: ApiProductVariant & { product: ApiProduct }
}

export interface ApiCart {
  id: string
  createdAt: string
  updatedAt: string
  cartItems: ApiCartItem[]
}

export interface ApiOrderItem {
  orderId: string
  variantId: string
  quantity: number
  price: number
  variant: ApiProductVariant & { product: ApiProduct }
}

export interface ApiWishlistItem {
  userId: string
  productId: string
  createdAt: string
  product: ApiProduct
}

export interface ApiAddress {
  id: string
  userId: string
  label: string | null
  line1: string
  line2: string | null
  city: string
  state: string
  zip: string
  country: string
  createdAt: string
}

// Lightweight promo used for displaying sale prices on product listings/pages (no auth needed)
export interface ApiDisplayPromo {
  id: string
  description: string
  discountType: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING'
  discountValue: number
  scope: 'PRODUCT' | 'CATEGORY'
  productId: string | null
  categoryId: string | null
}

export interface ApiPromo {
  id: string
  code: string | null
  description: string
  discountType: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING'
  discountValue: number
  scope: 'ORDER' | 'PRODUCT' | 'CATEGORY'
}

export interface ApiPromoValidation {
  promo: ApiPromo
  discountAmount: number
}

export interface ApiOrder {
  id: string
  total: number
  discountAmount: number
  shippingCost: number
  promoId: string | null
  promo?: ApiPromo | null
  userId: string
  addressId: string | null
  address?: ApiAddress | null
  createdAt: string
  updatedAt: string
  orderItems: ApiOrderItem[]
}

// --- API ---

export const api = {
  // Auth
  register: (email: string, password: string) =>
    request<ApiUser>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<ApiUser>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),
  getMe: () => request<ApiUser>('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean }>('/auth/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // Products
  getProducts: (filters: ProductFilters = {}) => {
    const { page = 1, search, categoryId, minPrice, maxPrice, minRating, excludeOutOfStock } = filters
    const params = new URLSearchParams({ page: String(page) })
    if (search) params.set('search', search)
    if (categoryId) params.set('categoryId', categoryId)
    if (minPrice != null && !isNaN(minPrice)) params.set('minPrice', String(minPrice))
    if (maxPrice != null && !isNaN(maxPrice)) params.set('maxPrice', String(maxPrice))
    if (minRating != null && !isNaN(minRating)) params.set('minRating', String(minRating))
    if (excludeOutOfStock) params.set('excludeOutOfStock', 'true')
    return request<ApiProductPage>(`/products?${params}`)
  },
  getProductById: (id: string) => request<ApiProduct>(`/products/${id}`),
  getRecommendations: (productId: string, limit = 5) =>
    request<ApiProduct[]>(`/products/${productId}/recommendations?limit=${limit}`),
  getCategories: () => request<ApiCategory[]>('/categories'),

  // Carts
  createCart: () => request<ApiCart>('/carts', { method: 'POST' }),
  getCart: (cartId: string) => request<ApiCart>(`/carts/${cartId}`),
  addCartItem: (cartId: string, variantId: string, quantity: number) =>
    request<ApiCartItem>(`/carts/${cartId}/items`, {
      method: 'POST',
      body: JSON.stringify({ variantId, quantity }),
    }),
  updateCartItem: (cartId: string, variantId: string, quantity: number) =>
    request<ApiCartItem>(`/carts/${cartId}/items/${variantId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),
  removeCartItem: (cartId: string, variantId: string) =>
    request<{ success: boolean }>(`/carts/${cartId}/items/${variantId}`, { method: 'DELETE' }),

  // Reviews
  getProductReviews: (productId: string) =>
    request<ApiReviewsResponse>(`/reviews/product/${productId}`),
  getReviewEligibility: (productId: string) =>
    request<ApiEligibilityResponse>(`/reviews/eligibility/${productId}`),
  submitReview: (productId: string, rating: number, body?: string) =>
    request<ApiReview>('/reviews', {
      method: 'POST',
      body: JSON.stringify({ productId, rating, body }),
    }),

  // Wishlist
  getWishlist: () => request<ApiWishlistItem[]>('/wishlist'),
  addToWishlist: (productId: string) =>
    request<ApiWishlistItem>('/wishlist', { method: 'POST', body: JSON.stringify({ productId }) }),
  removeFromWishlist: (productId: string) =>
    request<{ success: boolean }>(`/wishlist/${productId}`, { method: 'DELETE' }),

  // Orders
  createOrder: (cartId: string, addressId?: string, promoCode?: string, shippingCost?: number) =>
    request<ApiOrder>('/orders', {
      method: 'POST',
      body: JSON.stringify({ cartId, addressId, promoCode, shippingCost }),
    }),
  getOrderById: (orderId: string) => request<ApiOrder>(`/orders/${orderId}`),
  getOrders: () => request<ApiOrder[]>('/orders'),

  // Promos
  validatePromo: (code: string, cartId: string) =>
    request<ApiPromoValidation>('/promos/validate', {
      method: 'POST',
      body: JSON.stringify({ code, cartId }),
    }),
  getAutoPromos: (cartId: string) =>
    request<ApiPromoValidation[]>(`/promos/auto?cartId=${cartId}`),
  getDisplayPromos: () => request<ApiDisplayPromo[]>('/promos/display'),

  // Addresses
  getAddresses: () => request<ApiAddress[]>('/addresses'),
  createAddress: (data: Omit<ApiAddress, 'id' | 'userId' | 'createdAt'>) =>
    request<ApiAddress>('/addresses', { method: 'POST', body: JSON.stringify(data) }),
  deleteAddress: (id: string) =>
    request<{ success: boolean }>(`/addresses/${id}`, { method: 'DELETE' }),
}
