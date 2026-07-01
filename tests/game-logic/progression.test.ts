import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../../lib/prisma.js";
import * as pool from "../../lib/game-logic/pool.js";
import { advanceLevelIfExhausted, checkGameComplete } from "../../lib/game-logic/progression.js";
import { answerDrawnCard } from "../../lib/game-logic/session.js";
import { createTestRoom, seedTestCards, utcDate } from "../helpers.js";

const DAY = utcDate("2024-01-01");

afterAll(async () => {
  await prisma.$disconnect();
});

describe("advanceLevelIfExhausted", () => {
  it("does nothing while the current level pool still has cards", async () => {
    const room = await createTestRoom({ currentLevel: "WARMUP" });
    await seedTestCards(room.id, { WARMUP: 2, REAL_TALK: 2 });

    await pool.drawFromPool(room.id, "WARMUP", "A", DAY);
    const result = await advanceLevelIfExhausted(room.id);
    expect(result).toBeNull();

    const room2 = await prisma.room.findUniqueOrThrow({ where: { id: room.id } });
    expect(room2.currentLevel).toBe("WARMUP");
  });

  it("advances WARMUP -> REAL_TALK once the pool is drawn dry, even before answers come in", async () => {
    const room = await createTestRoom({ currentLevel: "WARMUP" });
    await seedTestCards(room.id, { WARMUP: 1, REAL_TALK: 2 });

    await pool.drawFromPool(room.id, "WARMUP", "A", DAY);
    const result = await advanceLevelIfExhausted(room.id);
    expect(result).toBe("REAL_TALK");

    const room2 = await prisma.room.findUniqueOrThrow({ where: { id: room.id } });
    expect(room2.currentLevel).toBe("REAL_TALK");
  });

  it("never advances past GO_DEEP", async () => {
    const room = await createTestRoom({ currentLevel: "GO_DEEP" });
    await seedTestCards(room.id, { GO_DEEP: 1 });

    await pool.drawFromPool(room.id, "GO_DEEP", "A", DAY);
    const result = await advanceLevelIfExhausted(room.id);
    expect(result).toBeNull();

    const room2 = await prisma.room.findUniqueOrThrow({ where: { id: room.id } });
    expect(room2.currentLevel).toBe("GO_DEEP");
  });

  it("never touches the curveball pool", async () => {
    const room = await createTestRoom({ currentLevel: "WARMUP" });
    await seedTestCards(room.id, { WARMUP: 5, CURVEBALL: 1 });

    await pool.drawFromPool(room.id, "CURVEBALL", "A", DAY);
    const result = await advanceLevelIfExhausted(room.id);
    expect(result).toBeNull();
  });
});

describe("checkGameComplete", () => {
  it("is not complete while GO_DEEP still has undrawn or unanswered cards", async () => {
    const room = await createTestRoom({ currentLevel: "GO_DEEP" });
    await seedTestCards(room.id, { GO_DEEP: 2 });

    await pool.drawFromPool(room.id, "GO_DEEP", "A", DAY);
    expect(await checkGameComplete(room.id)).toBe(false);
  });

  it("completes once every GO_DEEP card has been drawn and answered", async () => {
    const room = await createTestRoom({ currentLevel: "GO_DEEP" });
    await seedTestCards(room.id, { GO_DEEP: 1 });

    const drawn = await pool.drawFromPool(room.id, "GO_DEEP", "A", DAY);
    expect(await checkGameComplete(room.id)).toBe(false);

    await answerDrawnCard(drawn.id);

    const room2 = await prisma.room.findUniqueOrThrow({ where: { id: room.id } });
    expect(room2.status).toBe("COMPLETE");
    expect(room2.completedAt).not.toBeNull();
  });

  it("does not gate completion on the curveball pool", async () => {
    const room = await createTestRoom({ currentLevel: "GO_DEEP" });
    await seedTestCards(room.id, { GO_DEEP: 1, CURVEBALL: 3 });

    const goDeepDrawn = await pool.drawFromPool(room.id, "GO_DEEP", "A", DAY);
    await pool.drawFromPool(room.id, "CURVEBALL", "A", DAY); // leave curveball pool non-empty
    await answerDrawnCard(goDeepDrawn.id);

    const room2 = await prisma.room.findUniqueOrThrow({ where: { id: room.id } });
    expect(room2.status).toBe("COMPLETE");
  });
});
