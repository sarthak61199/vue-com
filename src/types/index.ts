export interface Product {
  id: number
  name: string
  price: number
  description: string
  image: string
}

export interface CartItem {
  productId: number
  quantity: number
}

export interface Order {
  id: number,
  items: OrderItem[],
  total: number,
}

export interface OrderItem {
  productId: number
  quantity: number
}