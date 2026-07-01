import { getDayType, getLocalDateString, getPoolForDayType } from "./day-type.js";
import { NoPlayTodayError, PoolExhaustedError } from "./errors.js";
import * as pool from "./pool.js";
import { advanceLevelIfExhausted, checkGameComplete } from "./progression.js";
import * as repo from "./repository.js";
import type { CardLevel, DayType, Partner } from "./types.js";

export function toPlayDate(date: Date, timezone: string): Date {
  return new Date(`${getLocalDateString(date, timezone)}T00:00:00.000Z`);
}

export interface TodaysSession {
  dayType: DayType;
  pool: CardLevel | null;
  level: CardLevel;
  isComplete: boolean;
  cards: Partial<Record<Partner, Awaited<ReturnType<typeof repo.findDrawnCard>>>>;
}

/** Read-only view of today's session state; never draws a card as a side effect. */
export async function getTodaysSession(roomId: string, date: Date): Promise<TodaysSession> {
  const room = await repo.getRoomById(roomId);
  const dayType = getDayType(date, room.timezone);
  const drawPool = getPoolForDayType(dayType, room.currentLevel);
  const playDate = toPlayDate(date, room.timezone);

  const cards: TodaysSession["cards"] = {};
  if (drawPool) {
    const [a, b] = await Promise.all([
      repo.findDrawnCard(roomId, playDate, "A", drawPool),
      repo.findDrawnCard(roomId, playDate, "B", drawPool),
    ]);
    cards.A = a;
    cards.B = b;
  }

  return {
    dayType,
    pool: drawPool,
    level: room.currentLevel,
    isComplete: room.status === "COMPLETE",
    cards,
  };
}

/**
 * Draws today's card for one partner. Idempotent: replaying this for the same
 * room/partner/day returns the same card rather than drawing again.
 *
 * Handles the "pool runs out mid-session" edge case: if the second partner's
 * draw finds the current themed level pool empty, it transparently advances
 * the room to the next level and draws from there instead. For the curveball
 * pool, an empty pool triggers a lazy reshuffle of previously-used cards.
 */
export async function drawTodayCard(roomId: string, partner: Partner, date: Date) {
  const room = await repo.getRoomById(roomId);
  const dayType = getDayType(date, room.timezone);
  if (dayType === "WEEKEND") {
    throw new NoPlayTodayError();
  }

  const playDate = toPlayDate(date, room.timezone);
  const drawPool = getPoolForDayType(dayType, room.currentLevel) as CardLevel;

  const existing = await repo.findDrawnCard(roomId, playDate, partner, drawPool);
  if (existing) return existing;

  try {
    return await pool.drawFromPool(roomId, drawPool, partner, playDate);
  } catch (err) {
    if (!(err instanceof PoolExhaustedError)) throw err;

    if (drawPool === "CURVEBALL") {
      const recycled = await pool.reshuffleCurveballPool(roomId);
      if (recycled === 0) throw err;
      return pool.drawFromPool(roomId, "CURVEBALL", partner, playDate);
    }

    const advancedTo = await advanceLevelIfExhausted(roomId);
    if (!advancedTo) {
      await checkGameComplete(roomId);
      throw err;
    }

    const existingAtNewLevel = await repo.findDrawnCard(roomId, playDate, partner, advancedTo);
    if (existingAtNewLevel) return existingAtNewLevel;
    return pool.drawFromPool(roomId, advancedTo, partner, playDate);
  }
}

export async function passTodayCard(drawnCardId: string) {
  return pool.passCard(drawnCardId);
}

/**
 * Marks a drawn card answered, retires its underlying pool card (so main-deck
 * cards never repeat and curveball cards become eligible for reshuffle later),
 * and re-checks level progression / game completion.
 */
export async function answerDrawnCard(drawnCardId: string) {
  const drawnCard = await repo.getDrawnCardById(drawnCardId);
  const updated = await repo.markDrawnCardAnswered(drawnCardId);
  await repo.discardPoolCardByCardId(drawnCard.roomId, drawnCard.cardId);

  if (drawnCard.pool !== "CURVEBALL") {
    await advanceLevelIfExhausted(drawnCard.roomId);
  }
  await checkGameComplete(drawnCard.roomId);

  return updated;
}
