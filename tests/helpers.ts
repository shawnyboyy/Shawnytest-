import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import * as repo from "../lib/game-logic/repository";
import type { CardLevel } from "../lib/game-logic/types";

export async function createTestRoom(overrides: { timezone?: string; currentLevel?: CardLevel } = {}) {
  return prisma.room.create({
    data: {
      code: randomUUID().slice(0, 8),
      timezone: overrides.timezone ?? "UTC",
      currentLevel: overrides.currentLevel ?? "WARMUP",
    },
  });
}

/** Creates `counts[level]` fresh Card rows per level and pools them into the room. */
export async function seedTestCards(roomId: string, counts: Partial<Record<CardLevel, number>>) {
  const prefix = randomUUID();
  const cards: { id: string; level: CardLevel }[] = [];

  for (const [level, count] of Object.entries(counts) as [CardLevel, number][]) {
    for (let i = 0; i < count; i++) {
      const card = await prisma.card.create({
        data: {
          slug: `${prefix}-${level}-${i}`,
          theme: level === "CURVEBALL" ? null : "Test Theme",
          level,
          pack: level === "CURVEBALL" ? "CURVEBALL" : "MAIN",
          text: `Test card ${level} #${i}`,
          curveballNo: level === "CURVEBALL" ? i + 1 : null,
        },
      });
      cards.push({ id: card.id, level });
    }
  }

  await repo.seedPoolCardsForRoom(roomId, cards);
  return cards;
}

export function utcDate(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00.000Z`);
}
