import { prisma } from "../prisma";
import { PoolExhaustedError } from "./errors";
import * as repo from "./repository";
import type { CardLevel, Partner } from "./types";

/** Seeds a brand-new room's pools from the full card catalog. Call once at room creation. */
export async function seedPoolsForRoom(roomId: string) {
  const cards = await prisma.card.findMany({ select: { id: true, level: true } });
  await repo.seedPoolCardsForRoom(roomId, cards);
}

export async function isPoolExhausted(roomId: string, pool: CardLevel): Promise<boolean> {
  const count = await repo.countAvailableInPool(roomId, pool);
  return count === 0;
}

/**
 * Draws the next available card from `pool` for `partner` on `playDate`.
 * Throws PoolExhaustedError if nothing is available (callers decide whether to
 * advance the level or reshuffle curveball before retrying).
 */
export async function drawFromPool(
  roomId: string,
  pool: CardLevel,
  partner: Partner,
  playDate: Date,
) {
  const nextPoolCard = await repo.getNextAvailablePoolCard(roomId, pool);
  if (!nextPoolCard) {
    throw new PoolExhaustedError(pool);
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const updated = await tx.poolCard.updateMany({
        where: { id: nextPoolCard.id, status: "AVAILABLE" },
        data: { status: "DRAWN" },
      });
      if (updated.count === 0) {
        // Lost a race to another concurrent draw; caller may retry.
        throw new PoolExhaustedError(pool);
      }
      return tx.drawnCard.create({
        data: {
          roomId,
          cardId: nextPoolCard.cardId,
          playDate,
          partner,
          pool,
        },
        include: { card: true },
      });
    });
  } catch (err) {
    // Concurrent request (e.g. both devices polling) already created today's
    // draw for this partner/pool — return the existing row instead of erroring.
    if (isUniqueConstraintError(err)) {
      const existing = await repo.findDrawnCard(roomId, playDate, partner, pool);
      if (existing) return existing;
    }
    throw err;
  }
}

function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}

/**
 * Passes a drawn card: sends its current card to the bottom of the pool (available
 * again) and immediately swaps in a replacement, updating the same DrawnCard row in
 * place (rather than inserting a new one, which would collide with the
 * one-active-card-per-partner/day/pool unique constraint). Net-neutral on pool size,
 * so this can never trigger pool exhaustion by itself.
 */
export async function passCard(drawnCardId: string) {
  const drawnCard = await repo.getDrawnCardById(drawnCardId);
  const poolCard = await prisma.poolCard.findUniqueOrThrow({
    where: { roomId_cardId: { roomId: drawnCard.roomId, cardId: drawnCard.cardId } },
  });

  const maxSortOrder = await repo.getMaxSortOrder(drawnCard.roomId, drawnCard.pool);
  await repo.setPoolCardStatus(poolCard.id, "AVAILABLE", maxSortOrder + 1);

  const nextPoolCard = await repo.getNextAvailablePoolCard(drawnCard.roomId, drawnCard.pool);
  if (!nextPoolCard) {
    // Unreachable in practice: the pass above just made a card available again.
    throw new PoolExhaustedError(drawnCard.pool);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.poolCard.updateMany({
      where: { id: nextPoolCard.id, status: "AVAILABLE" },
      data: { status: "DRAWN" },
    });
    if (updated.count === 0) {
      throw new PoolExhaustedError(drawnCard.pool);
    }
    return tx.drawnCard.update({
      where: { id: drawnCardId },
      data: { cardId: nextPoolCard.cardId, answeredAt: null, timesPassed: { increment: 1 } },
      include: { card: true },
    });
  });
}

/**
 * Recycles previously-discarded curveball cards back into the available pool.
 * Only ever called for the CURVEBALL pool, since main-deck pools should never repeat.
 */
export async function reshuffleCurveballPool(roomId: string): Promise<number> {
  return repo.reshuffleDiscardedPoolCards(roomId, "CURVEBALL");
}
