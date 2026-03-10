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
}

export interface ProductFilters {
  page?: number
  search?: string
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
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
  productId: string
  quantity: number
  product: ApiProduct
}

export interface ApiCart {
  id: string
  createdAt: string
  updatedAt: string
  cartItems: ApiCartItem[]
}

export interface ApiOrderItem {
  orderId: string
  productId: string
  quantity: number
  product: ApiProduct
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

export interface ApiOrder {
  id: string
  total: number
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
    request<ApiUser>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
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
    const { page = 1, search, categoryId, minPrice, maxPrice, minRating } = filters
    const params = new URLSearchParams({ page: String(page) })
    if (search) params.set('search', search)
    if (categoryId) params.set('categoryId', categoryId)
    if (minPrice != null && !isNaN(minPrice)) params.set('minPrice', String(minPrice))
    if (maxPrice != null && !isNaN(maxPrice)) params.set('maxPrice', String(maxPrice))
    if (minRating != null && !isNaN(minRating)) params.set('minRating', String(minRating))
    return request<ApiProductPage>(`/products?${params}`)
  },
  getProductById: (id: string) => request<ApiProduct>(`/products/${id}`),
  getCategories: () => request<ApiCategory[]>('/categories'),

  // Carts
  createCart: () => request<ApiCart>('/carts', { method: 'POST' }),
  getCart: (cartId: string) => request<ApiCart>(`/carts/${cartId}`),
  addCartItem: (cartId: string, productId: string, quantity: number) =>
    request<ApiCartItem>(`/carts/${cartId}/items`, {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    }),
  updateCartItem: (cartId: string, productId: string, quantity: number) =>
    request<ApiCartItem>(`/carts/${cartId}/items/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),
  removeCartItem: (cartId: string, productId: string) =>
    request<{ success: boolean }>(`/carts/${cartId}/items/${productId}`, { method: 'DELETE' }),

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
  createOrder: (cartId: string, addressId?: string) =>
    request<ApiOrder>('/orders', {
      method: 'POST',
      body: JSON.stringify({ cartId, addressId }),
    }),
  getOrderById: (orderId: string) => request<ApiOrder>(`/orders/${orderId}`),
  getOrders: () => request<ApiOrder[]>('/orders'),

  // Addresses
  getAddresses: () => request<ApiAddress[]>('/addresses'),
  createAddress: (data: Omit<ApiAddress, 'id' | 'userId' | 'createdAt'>) =>
    request<ApiAddress>('/addresses', { method: 'POST', body: JSON.stringify(data) }),
  deleteAddress: (id: string) =>
    request<{ success: boolean }>(`/addresses/${id}`, { method: 'DELETE' }),
}
