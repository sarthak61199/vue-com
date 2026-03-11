import prisma from '../lib/prisma.js'
import { ServiceError } from '../lib/errors.js'

const variantInclude = {
  variant: {
    include: {
      product: true,
      values: { include: { option: true } },
    },
  },
}

export async function createCart() {
  return prisma.cart.create({ data: {} })
}

export async function getCart(cartId: string) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { cartItems: { include: variantInclude } },
  })
  if (!cart) throw new ServiceError(404, 'Cart not found')
  return cart
}

export async function addCartItem(cartId: string, variantId: string, quantity: number) {
  const cart = await prisma.cart.findUnique({ where: { id: cartId } })
  if (!cart) throw new ServiceError(404, 'Cart not found')

  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } })
  if (!variant) throw new ServiceError(404, 'Variant not found')

  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId, variantId } },
  })
  const currentQty = existingItem?.quantity ?? 0
  if (currentQty + quantity > variant.stock) {
    throw new ServiceError(400, 'Not enough stock', { availableStock: variant.stock - currentQty })
  }

  return prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId, variantId } },
    create: { cartId, variantId, quantity },
    update: { quantity: { increment: quantity } },
    include: variantInclude,
  })
}

export async function updateCartItem(cartId: string, variantId: string, quantity: number) {
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId, variantId } },
  })
  if (!existing) throw new ServiceError(404, 'Cart item not found')

  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } })
  if (variant && quantity > variant.stock) {
    throw new ServiceError(400, 'Not enough stock', { availableStock: variant.stock })
  }

  return prisma.cartItem.update({
    where: { cartId_variantId: { cartId, variantId } },
    data: { quantity },
    include: variantInclude,
  })
}

export async function removeCartItem(cartId: string, variantId: string): Promise<void> {
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId, variantId } },
  })
  if (!existing) throw new ServiceError(404, 'Cart item not found')

  await prisma.cartItem.delete({ where: { cartId_variantId: { cartId, variantId } } })
}
