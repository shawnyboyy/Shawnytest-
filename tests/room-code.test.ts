import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../lib/prisma";
import { generateRoomCode, generateUniqueRoomCode, normalizeRoomCode } from "../lib/room-code";
import { createTestRoom } from "./helpers";

afterAll(async () => {
  await prisma.$disconnect();
});

describe("generateRoomCode", () => {
  it("produces a 6-character code using only unambiguous characters", () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]+$/);
  });
});

describe("generateUniqueRoomCode", () => {
  it("never returns a code already in use", async () => {
    const existingRoom = await createTestRoom();
    // Force a code we know collides at least once isn't practical to simulate
    // deterministically, but we can at least assert the returned code doesn't
    // match any pre-existing room code and round-trips through the DB lookup.
    const code = await generateUniqueRoomCode();
    expect(code).not.toBe(existingRoom.code);
    const room = await prisma.room.findUnique({ where: { code } });
    expect(room).toBeNull();
  });
});

describe("normalizeRoomCode", () => {
  it("trims whitespace and uppercases", () => {
    expect(normalizeRoomCode("  abc123 ")).toBe("ABC123");
  });
});
