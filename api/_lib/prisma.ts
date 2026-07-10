// PrismaClient singleton for serverless. A new client per request exhausts the
// connection pool, so we cache one on globalThis across warm invocations and extend
// it with Accelerate (required for the Prisma Postgres pooled connection string).

import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const makeClient = () => new PrismaClient().$extends(withAccelerate());

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof makeClient>;
};

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
