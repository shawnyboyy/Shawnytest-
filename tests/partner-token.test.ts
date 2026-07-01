import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../lib/prisma";
import { InvalidPartnerError } from "../lib/game-logic/errors";
import {
  encodePartnerToken,
  generatePartnerSecret,
  verifyPartnerToken,
} from "../lib/partner-token";
import { createTestRoom } from "./helpers";

afterAll(async () => {
  await prisma.$disconnect();
});

describe("verifyPartnerToken", () => {
  it("verifies a token matching the room's stored secret", async () => {
    const secretA = generatePartnerSecret();
    const room = await prisma.room.update({
      where: { id: (await createTestRoom()).id },
      data: { partnerASecret: secretA },
    });

    const token = encodePartnerToken({ roomId: room.id, partner: "A", secret: secretA });
    const result = await verifyPartnerToken(token);
    expect(result.partner).toBe("A");
    expect(result.room.id).toBe(room.id);
  });

  it("rejects a token with the wrong secret", async () => {
    const room = await createTestRoom();
    await prisma.room.update({ where: { id: room.id }, data: { partnerASecret: "real-secret" } });

    const forged = encodePartnerToken({ roomId: room.id, partner: "A", secret: "wrong-secret" });
    await expect(verifyPartnerToken(forged)).rejects.toThrow(InvalidPartnerError);
  });

  it("rejects a token claiming to be the other partner", async () => {
    const room = await createTestRoom();
    await prisma.room.update({
      where: { id: room.id },
      data: { partnerASecret: "secret-a", partnerBSecret: "secret-b" },
    });

    // Correct secret value, but paired with the wrong partner slot.
    const token = encodePartnerToken({ roomId: room.id, partner: "B", secret: "secret-a" });
    await expect(verifyPartnerToken(token)).rejects.toThrow(InvalidPartnerError);
  });

  it("rejects a malformed token", async () => {
    await expect(verifyPartnerToken("not-a-real-token")).rejects.toThrow(InvalidPartnerError);
  });

  it("rejects a token for a room that no longer exists", async () => {
    const token = encodePartnerToken({
      roomId: "nonexistent-room-id",
      partner: "A",
      secret: "whatever",
    });
    await expect(verifyPartnerToken(token)).rejects.toThrow(InvalidPartnerError);
  });
});
