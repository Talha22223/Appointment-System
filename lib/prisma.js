import { PrismaClient } from '@prisma/client'

declare global {
  // allow global `prisma` to be reused in dev
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const prisma =
  process.env.NODE_ENV === 'production'
    ? new PrismaClient()
    : global.prisma ?? (global.prisma = new PrismaClient())

export default prisma
