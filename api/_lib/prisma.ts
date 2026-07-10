// PrismaClient singleton for serverless. A new client per request exhausts the
// connection pool, so we cache one on globalThis across warm invocations and extend
// it with Accelerate (required for the Prisma Postgres pooled connection string).

import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// This app connects over Prisma Accelerate (HTTPS), which requires the
// `prisma+postgres://…?api_key=…` connection string. A direct `postgres://` URL will
// fail at query time — warn early with a clear pointer.
const dbUrl = process.env.DATABASE_URL ?? '';
if (dbUrl && !/^prisma(\+postgres)?:\/\//.test(dbUrl)) {
  console.warn(
    '[prisma] DATABASE_URL is not an Accelerate URL. Use the "prisma+postgres://…?api_key=…" ' +
      'connection string from the Prisma console (not the direct postgres:// one).',
  );
}

const makeClient = () => new PrismaClient().$extends(withAccelerate());

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof makeClient>;
};

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
