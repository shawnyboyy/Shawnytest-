import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../../lib/prisma";
import * as pool from "../../lib/game-logic/pool";
import { PoolExhaustedError } from "../../lib/game-logic/errors";
import { createTestRoom, seedTestCards, utcDate } from "../helpers";

const DAY = utcDate("2024-01-01");

afterAll(async () => {
  await prisma.$disconnect();
});

describe("drawFromPool", () => {
  it("draws the next available card and removes it from the pool", async () => {
    const room = await createTestRoom();
    await seedTestCards(room.id, { WARMUP: 3 });

    expect(await pool.isPoolExhausted(room.id, "WARMUP")).toBe(false);
    const drawn = await pool.drawFromPool(room.id, "WARMUP", "A", DAY);
    expect(drawn.partner).toBe("A");
    expect(drawn.pool).toBe("WARMUP");

    const remaining = await prisma.poolCard.count({
      where: { roomId: room.id, pool: "WARMUP", status: "AVAILABLE" },
    });
    expect(remaining).toBe(2);
  });

  it("throws PoolExhaustedError when nothing is left", async () => {
    const room = await createTestRoom();
    await seedTestCards(room.id, { WARMUP: 1 });

    await pool.drawFromPool(room.id, "WARMUP", "A", DAY);
    await expect(pool.drawFromPool(room.id, "WARMUP", "B", DAY)).rejects.toThrow(
      PoolExhaustedError,
    );
  });

  it("returns the same row instead of double-drawing under a simulated race", async () => {
    const room = await createTestRoom();
    await seedTestCards(room.id, { WARMUP: 5 });

    const [a, b] = await Promise.all([
      pool.drawFromPool(room.id, "WARMUP", "A", DAY),
      pool.drawFromPool(room.id, "WARMUP", "A", DAY),
    ]);
    // One of the two concurrent calls wins the DB unique constraint; the loser
    // (going through drawFromPool's own retry) must resolve to the same row,
    // never throw, and never consume two cards for the same partner/day/pool.
    expect(a.id).toBe(b.id);

    const drawnCount = await prisma.drawnCard.count({
      where: { roomId: room.id, partner: "A", pool: "WARMUP" },
    });
    expect(drawnCount).toBe(1);
  });
});

describe("passCard", () => {
  it("sends the passed card to the bottom of the pool and draws a replacement", async () => {
    const room = await createTestRoom();
    await seedTestCards(room.id, { WARMUP: 3 });

    const first = await pool.drawFromPool(room.id, "WARMUP", "A", DAY);
    const originalCardId = first.cardId;
    const replacement = await pool.passCard(first.id);

    // Same DrawnCard row, updated in place, now pointing at a different card.
    expect(replacement.id).toBe(first.id);
    expect(replacement.cardId).not.toBe(originalCardId);
    expect(replacement.timesPassed).toBe(1);

    const passedPoolCard = await prisma.poolCard.findUniqueOrThrow({
      where: { roomId_cardId: { roomId: room.id, cardId: originalCardId } },
    });
    expect(passedPoolCard.status).toBe("AVAILABLE");
  });

  it("passing the only card in a pool hands the same card straight back without throwing", async () => {
    const room = await createTestRoom();
    await seedTestCards(room.id, { WARMUP: 1 });

    const first = await pool.drawFromPool(room.id, "WARMUP", "A", DAY);
    // Only card in the pool; the bottom-of-pool requeue + immediate redraw
    // must resolve to the same card without a false PoolExhaustedError.
    const replacement = await pool.passCard(first.id);
    expect(replacement.cardId).toBe(first.cardId);
    expect(replacement.timesPassed).toBe(1);
    // Nothing left to hand to anyone else now — correctly exhausted.
    expect(await pool.isPoolExhausted(room.id, "WARMUP")).toBe(true);
  });
});

describe("reshuffleCurveballPool", () => {
  it("recycles discarded curveball cards back to available", async () => {
    const room = await createTestRoom();
    await seedTestCards(room.id, { CURVEBALL: 2 });

    const drawn = await pool.drawFromPool(room.id, "CURVEBALL", "A", DAY);
    await prisma.poolCard.update({
      where: { roomId_cardId: { roomId: room.id, cardId: drawn.cardId } },
      data: { status: "DISCARDED" },
    });

    const recycledCount = await pool.reshuffleCurveballPool(room.id);
    expect(recycledCount).toBe(1);

    const availableAfter = await prisma.poolCard.count({
      where: { roomId: room.id, pool: "CURVEBALL", status: "AVAILABLE" },
    });
    // 1 never-drawn card + 1 recycled = 2
    expect(availableAfter).toBe(2);
  });
});
