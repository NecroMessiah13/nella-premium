import { PrismaClient } from '@prisma/client';

const globalWithPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalWithPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalWithPrisma.prisma = prisma;
}
