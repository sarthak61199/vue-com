import prisma from '../lib/prisma.js'
import { ServiceError } from '../lib/errors.js'

const orderItemInclude = {
  variant: {
    include: {
      product: true,
      values: { include: { option: true } },
    },
  },
}

export async function createOrder(userId: string, cartId: string, addressId?: string) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { cartItems: { include: { variant: true } } },
  })
  if (!cart) throw new ServiceError(404, 'Cart not found')
  if (cart.cartItems.length === 0) throw new ServiceError(400, 'Cart is empty')

  const total = cart.cartItems.reduce((sum, item) => sum + item.variant.price * item.quantity, 0)

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

      const newOrder = await tx.order.create({
        data: {
          total,
          userId,
          addressId: addressId ?? null,
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
        },
      })

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
    },
    orderBy: { createdAt: 'desc' },
  })
}
