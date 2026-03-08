const BASE = 'http://localhost:3000/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
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

export interface ApiProduct {
  id: string
  name: string
  price: number
  description: string
  image: string | null
  createdAt: string
  updatedAt: string
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

export interface ApiOrder {
  id: string
  total: number
  createdAt: string
  updatedAt: string
  orderItems: ApiOrderItem[]
}

// --- API ---

export const api = {
  // Products
  getProducts: () => request<ApiProduct[]>('/products'),
  getProductById: (id: string) => request<ApiProduct>(`/products/${id}`),

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

  // Orders
  createOrder: (cartId: string) =>
    request<ApiOrder>('/orders', {
      method: 'POST',
      body: JSON.stringify({ cartId }),
    }),
  getOrderById: (orderId: string) => request<ApiOrder>(`/orders/${orderId}`),
  getOrders: () => request<ApiOrder[]>('/orders'),
}
