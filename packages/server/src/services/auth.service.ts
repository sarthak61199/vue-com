import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma.js'
import { ServiceError } from '../lib/errors.js'

export async function registerUser(email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new ServiceError(409, 'Email already registered')

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({ data: { email, passwordHash } })
  return { id: user.id, email: user.email }
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new ServiceError(401, 'Invalid credentials')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new ServiceError(401, 'Invalid credentials')

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await prisma.session.create({ data: { id: token, userId: user.id, expiresAt } })
  return { id: user.id, email: user.email, token, expiresAt }
}

export async function logoutUser(token: string | undefined): Promise<void> {
  if (token) {
    await prisma.session.deleteMany({ where: { id: token } })
  }
}

export async function getMe(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, createdAt: true },
  })
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new ServiceError(404, 'User not found')

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) throw new ServiceError(401, 'Current password is incorrect')

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
}
