import { randomBytes } from "node:crypto";
import { InvalidPartnerError } from "./game-logic/errors";
import * as repo from "./game-logic/repository";
import type { Partner } from "./game-logic/types";

interface TokenPayload {
  roomId: string;
  partner: Partner;
  secret: string;
}

export function generatePartnerSecret(): string {
  return randomBytes(24).toString("hex");
}

export function encodePartnerToken(payload: TokenPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePartnerToken(token: string): TokenPayload {
  try {
    const parsed = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    if (
      typeof parsed?.roomId !== "string" ||
      (parsed.partner !== "A" && parsed.partner !== "B") ||
      typeof parsed?.secret !== "string"
    ) {
      throw new Error("malformed payload");
    }
    return parsed as TokenPayload;
  } catch {
    throw new InvalidPartnerError("Malformed partner token");
  }
}

/**
 * Decodes and verifies a partner token against the room's stored secrets.
 * Never trust a client-supplied `partner` value directly — this is the only
 * source of truth for "which partner is making this request".
 */
export async function verifyPartnerToken(token: string) {
  const payload = decodePartnerToken(token);
  const room = await repo.getRoomById(payload.roomId).catch(() => null);
  if (!room) {
    throw new InvalidPartnerError("Room not found for this token");
  }

  const expectedSecret = payload.partner === "A" ? room.partnerASecret : room.partnerBSecret;
  if (!expectedSecret || expectedSecret !== payload.secret) {
    throw new InvalidPartnerError("Token does not match room records");
  }

  return { room, partner: payload.partner };
}
