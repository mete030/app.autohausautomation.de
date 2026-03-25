import { PrismaClient } from '@prisma/client'

declare global {
  var __wackenhutPrisma__: PrismaClient | undefined
}

export function getPrismaClient() {
  if (!globalThis.__wackenhutPrisma__) {
    globalThis.__wackenhutPrisma__ = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
  }

  return globalThis.__wackenhutPrisma__
}
