import { PrismaClient } from '../generated/prisma'

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Force new instance if in development to pick up schema changes
const prisma = 
  process.env.NODE_ENV === 'production'
    ? new PrismaClient()
    : global.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  // Clear global cache to force regeneration
  if (!global.prisma) {
    global.prisma = prisma
  }
}

export default prisma