import { prisma } from "../prisma.js";
import type { CardLevel, Partner, PoolCardStatus } from "./types.js";

export type Repo = typeof prisma;

/** Fisher-Yates shuffle, returns a new array. */
export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function getRoomById(roomId: string) {
  return prisma.room.findUniqueOrThrow({ where: { id: roomId } });
}

export async function getRoomByCode(code: string) {
  return prisma.room.findUnique({ where: { code } });
}

export async function seedPoolCardsForRoom(roomId: string, cards: { id: string; level: CardLevel }[]) {
  const byPool = new Map<CardLevel, string[]>();
  for (const card of cards) {
    const list = byPool.get(card.level) ?? [];
    list.push(card.id);
    byPool.set(card.level, list);
  }

  const rows: { roomId: string; cardId: string; pool: CardLevel; sortOrder: number }[] = [];
  for (const [pool, cardIds] of byPool) {
    const shuffled = shuffle(cardIds);
    shuffled.forEach((cardId, index) => {
      rows.push({ roomId, cardId, pool, sortOrder: index });
    });
  }

  await prisma.poolCard.createMany({ data: rows });
}

export async function countAvailableInPool(roomId: string, pool: CardLevel): Promise<number> {
  return prisma.poolCard.count({
    where: { roomId, pool, status: "AVAILABLE" },
  });
}

/** Cards still in play for a pool: either undrawn or drawn-but-not-yet-resolved. */
export async function countActiveInPool(roomId: string, pool: CardLevel): Promise<number> {
  return prisma.poolCard.count({
    where: { roomId, pool, status: { in: ["AVAILABLE", "DRAWN"] } },
  });
}

export async function discardPoolCardByCardId(roomId: string, cardId: string) {
  return prisma.poolCard.update({
    where: { roomId_cardId: { roomId, cardId } },
    data: { status: "DISCARDED" },
  });
}

export async function getNextAvailablePoolCard(roomId: string, pool: CardLevel) {
  return prisma.poolCard.findFirst({
    where: { roomId, pool, status: "AVAILABLE" },
    orderBy: { sortOrder: "asc" },
    include: { card: true },
  });
}

export async function getMaxSortOrder(roomId: string, pool: CardLevel): Promise<number> {
  const result = await prisma.poolCard.aggregate({
    where: { roomId, pool },
    _max: { sortOrder: true },
  });
  return result._max.sortOrder ?? -1;
}

export async function setPoolCardStatus(
  poolCardId: string,
  status: PoolCardStatus,
  sortOrder?: number,
) {
  return prisma.poolCard.update({
    where: { id: poolCardId },
    data: sortOrder === undefined ? { status } : { status, sortOrder },
  });
}

export async function findDrawnCard(
  roomId: string,
  playDate: Date,
  partner: Partner,
  pool: CardLevel,
) {
  return prisma.drawnCard.findUnique({
    where: {
      roomId_playDate_partner_pool: { roomId, playDate, partner, pool },
    },
    include: { card: true },
  });
}

export async function getDrawnCardById(drawnCardId: string) {
  return prisma.drawnCard.findUniqueOrThrow({
    where: { id: drawnCardId },
    include: { card: true, decisionLog: true },
  });
}

export async function markDrawnCardAnswered(drawnCardId: string) {
  return prisma.drawnCard.update({
    where: { id: drawnCardId },
    data: { answeredAt: new Date() },
  });
}

export async function getDiscardedPoolCards(roomId: string, pool: CardLevel) {
  return prisma.poolCard.findMany({ where: { roomId, pool, status: "DISCARDED" } });
}

export async function reshuffleDiscardedPoolCards(roomId: string, pool: CardLevel) {
  const discarded = await getDiscardedPoolCards(roomId, pool);
  const shuffled = shuffle(discarded.map((p) => p.id));
  await prisma.$transaction(
    shuffled.map((id, index) =>
      prisma.poolCard.update({
        where: { id },
        data: { status: "AVAILABLE", sortOrder: index },
      }),
    ),
  );
  return shuffled.length;
}

export async function updateRoomLevel(roomId: string, level: CardLevel) {
  return prisma.room.update({ where: { id: roomId }, data: { currentLevel: level } });
}

export async function markRoomComplete(roomId: string) {
  return prisma.room.update({
    where: { id: roomId },
    data: { status: "COMPLETE", completedAt: new Date() },
  });
}

export async function upsertDecisionLog(roomId: string, drawnCardId: string, note: string) {
  return prisma.decisionLog.upsert({
    where: { drawnCardId },
    update: { note },
    create: { roomId, drawnCardId, note },
  });
}

export async function listDecisionLogsForRoom(roomId: string) {
  return prisma.decisionLog.findMany({
    where: { roomId },
    orderBy: { createdAt: "desc" },
    include: { drawnCard: { include: { card: true } } },
  });
}
