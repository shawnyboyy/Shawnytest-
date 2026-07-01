import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

declare global {
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  // Cap the underlying pg.Pool size: each serverless function instance gets
  // its own pool, and Vercel can run many instances concurrently, so a large
  // per-instance pool (pg's default max is 10) can exhaust a connection
  // pooler's session limit fast. This app never needs more than a couple of
  // connections open at once per instance.
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 3 });
  return new PrismaClient({ adapter });
}

export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
