import prisma from '../lib/prisma.js'
import { ServiceError } from '../lib/errors.js'
import { validatePromoCode, getAutoPromos, validatePromoInTransaction } from './promo.service.js'

const orderItemInclude = {
  variant: {
    include: {
      product: true,
      values: { include: { option: true } },
    },
  },
}

export async function createOrder(
  userId: string,
  cartId: string,
  addressId?: string,
  promoCode?: string,
  shippingCost = 0,
) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      cartItems: {
        include: { variant: { include: { product: true } } },
      },
    },
  })
  if (!cart) throw new ServiceError(404, 'Cart not found')
  if (cart.cartItems.length === 0) throw new ServiceError(400, 'Cart is empty')

  const subtotal = cart.cartItems.reduce((sum, item) => sum + item.variant.price * item.quantity, 0)

  // Resolve promo before entering the transaction (for early user-facing validation errors)
  let resolvedPromoId: string | null = null

  if (promoCode) {
    const result = await validatePromoCode(promoCode, cart.cartItems, userId)
    resolvedPromoId = result.promo.id
  } else {
    const autoPromos = await getAutoPromos(cart.cartItems, userId)
    if (autoPromos.length > 0) {
      resolvedPromoId = autoPromos[0].promo.id
    }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      for (const item of cart.cartItems) {
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } })
        if (!variant || variant.stock < item.quantity) {
          throw new Error(`Insufficient stock for variant ${item.variantId}`)
        }
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        })
      }

      // Re-validate promo inside transaction (race condition safety)
      let discountAmount = 0
      if (resolvedPromoId) {
        const validated = await validatePromoInTransaction(resolvedPromoId, userId, cart.cartItems, tx)
        discountAmount = validated.discountAmount
      }

      const total = Math.max(0, subtotal - discountAmount) + shippingCost

      const newOrder = await tx.order.create({
        data: {
          total,
          discountAmount,
          shippingCost,
          userId,
          addressId: addressId ?? null,
          promoId: resolvedPromoId,
          orderItems: {
            create: cart.cartItems.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.variant.price,
            })),
          },
        },
        include: {
          orderItems: { include: orderItemInclude },
          address: true,
          promo: true,
        },
      })

      // Record promo usage now that we have the order id
      if (resolvedPromoId) {
        await tx.promoUsage.create({
          data: { promoId: resolvedPromoId, userId, orderId: newOrder.id },
        })
      }

      await tx.cartItem.deleteMany({ where: { cartId } })
      return newOrder
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message.startsWith('Insufficient stock')) {
      throw new ServiceError(400, 'One or more items in your cart are out of stock')
    }
    throw err
  }
}

export async function getOrderById(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: { include: orderItemInclude },
      address: true,
      promo: true,
    },
  })
  if (!order) throw new ServiceError(404, 'Order not found')
  if (order.userId !== userId) throw new ServiceError(403, 'Forbidden')
  return order
}

export async function getUserOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: {
      orderItems: { include: orderItemInclude },
      address: true,
      promo: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}
