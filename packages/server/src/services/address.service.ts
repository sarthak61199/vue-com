import prisma from '../lib/prisma.js'
import { ServiceError } from '../lib/errors.js'

export async function getUserAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createAddress(
  userId: string,
  data: {
    label?: string
    line1: string
    line2?: string
    city: string
    state: string
    zip: string
    country?: string
  },
) {
  return prisma.address.create({
    data: {
      userId,
      label: data.label ?? null,
      line1: data.line1,
      line2: data.line2 ?? null,
      city: data.city,
      state: data.state,
      zip: data.zip,
      country: data.country ?? 'US',
    },
  })
}

export async function deleteAddress(userId: string, addressId: string): Promise<void> {
  const address = await prisma.address.findUnique({ where: { id: addressId } })
  if (!address) throw new ServiceError(404, 'Address not found')
  if (address.userId !== userId) throw new ServiceError(403, 'Forbidden')
  await prisma.address.delete({ where: { id: addressId } })
}
