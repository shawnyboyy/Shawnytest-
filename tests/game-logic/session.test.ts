import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../../lib/prisma";
import { NoPlayTodayError } from "../../lib/game-logic/errors";
import {
  answerDrawnCard,
  drawTodayCard,
  getTodaysSession,
  passTodayCard,
  toPlayDate,
} from "../../lib/game-logic/session";
import { createTestRoom, seedTestCards, utcDate } from "../helpers";

// 2024-01-01 = Monday (THEMED), 2024-01-05 = Friday (CURVEBALL), 2024-01-06 = Saturday (WEEKEND)
const MONDAY = utcDate("2024-01-01");
const FRIDAY = utcDate("2024-01-05");
const SATURDAY = utcDate("2024-01-06");

afterAll(async () => {
  await prisma.$disconnect();
});

describe("getTodaysSession", () => {
  it("reports the weekend state without drawing anything", async () => {
    const room = await createTestRoom();
    await seedTestCards(room.id, { WARMUP: 3 });

    const session = await getTodaysSession(room.id, SATURDAY);
    expect(session.dayType).toBe("WEEKEND");
    expect(session.pool).toBeNull();
    expect(session.cards).toEqual({});
  });

  it("is idempotent: reading twice never draws a card as a side effect", async () => {
    const room = await createTestRoom();
    await seedTestCards(room.id, { WARMUP: 3 });

    await getTodaysSession(room.id, MONDAY);
    await getTodaysSession(room.id, MONDAY);

    const drawnCount = await prisma.drawnCard.count({ where: { roomId: room.id } });
    expect(drawnCount).toBe(0);
  });
});

describe("drawTodayCard", () => {
  it("throws NoPlayTodayError on weekends", async () => {
    const room = await createTestRoom();
    await seedTestCards(room.id, { WARMUP: 3 });

    await expect(drawTodayCard(room.id, "A", SATURDAY)).rejects.toThrow(NoPlayTodayError);
  });

  it("is idempotent per partner/day/pool: calling twice returns the same card", async () => {
    const room = await createTestRoom();
    await seedTestCards(room.id, { WARMUP: 3 });

    const first = await drawTodayCard(room.id, "A", MONDAY);
    const second = await drawTodayCard(room.id, "A", MONDAY);
    expect(second.id).toBe(first.id);

    const drawnCount = await prisma.drawnCard.count({ where: { roomId: room.id, partner: "A" } });
    expect(drawnCount).toBe(1);
  });

  it("draws from the curveball pool on Fridays regardless of current level", async () => {
    const room = await createTestRoom({ currentLevel: "REAL_TALK" });
    await seedTestCards(room.id, { REAL_TALK: 3, CURVEBALL: 3 });

    const drawn = await drawTodayCard(room.id, "A", FRIDAY);
    expect(drawn.pool).toBe("CURVEBALL");
  });

  it("mid-session level advance: partner B draws from the next level when the pool empties on partner A's draw", async () => {
    const room = await createTestRoom({ currentLevel: "WARMUP" });
    // Only one Warm-Up card, so partner A takes the last one and partner B
    // must transparently roll over into Real Talk within the same session.
    await seedTestCards(room.id, { WARMUP: 1, REAL_TALK: 2 });

    const drawnA = await drawTodayCard(room.id, "A", MONDAY);
    expect(drawnA.pool).toBe("WARMUP");

    const drawnB = await drawTodayCard(room.id, "B", MONDAY);
    expect(drawnB.pool).toBe("REAL_TALK");

    const room2 = await prisma.room.findUniqueOrThrow({ where: { id: room.id } });
    expect(room2.currentLevel).toBe("REAL_TALK");

    // Idempotency still holds per-partner after the level rolled over.
    const drawnBAgain = await drawTodayCard(room.id, "B", MONDAY);
    expect(drawnBAgain.id).toBe(drawnB.id);
  });

  it("reshuffles the curveball pool once exhausted instead of failing", async () => {
    const room = await createTestRoom();
    await seedTestCards(room.id, { CURVEBALL: 1 });

    const drawn = await drawTodayCard(room.id, "A", FRIDAY);
    await answerDrawnCard(drawn.id); // discards the only curveball card

    // Next Friday, same single card should come back around via reshuffle.
    const nextFriday = utcDate("2024-01-12");
    const drawnAgain = await drawTodayCard(room.id, "A", nextFriday);
    expect(drawnAgain.cardId).toBe(drawn.cardId);
  });
});

describe("passTodayCard", () => {
  it("gives a replacement card without affecting the other partner's draw", async () => {
    const room = await createTestRoom();
    await seedTestCards(room.id, { WARMUP: 4 });

    const drawnA = await drawTodayCard(room.id, "A", MONDAY);
    const drawnB = await drawTodayCard(room.id, "B", MONDAY);

    const replacement = await passTodayCard(drawnA.id);
    expect(replacement.id).toBe(drawnA.id);
    expect(replacement.cardId).not.toBe(drawnA.cardId);

    const stillB = await getTodaysSession(room.id, MONDAY);
    expect(stillB.cards.B?.id).toBe(drawnB.id);
  });
});

describe("toPlayDate", () => {
  it("produces a stable date-only value regardless of time of day", () => {
    const morning = new Date("2024-01-01T02:00:00.000Z");
    const night = new Date("2024-01-01T23:00:00.000Z");
    expect(toPlayDate(morning, "UTC").toISOString()).toBe(toPlayDate(night, "UTC").toISOString());
  });
});
