import { RoomNotFoundError, InvalidPartnerError } from "../game-logic/errors";
import { normalizeRoomCode } from "../room-code";
import * as repo from "../game-logic/repository";
import { verifyPartnerToken } from "../partner-token";

export async function resolveRoomByCode(code: string) {
  const room = await repo.getRoomByCode(normalizeRoomCode(code));
  if (!room) throw new RoomNotFoundError();
  return room;
}

/** Verifies the token is valid AND scoped to this specific room (not some other room's token). */
export async function requirePartnerForRoom(token: string, roomId: string) {
  const { partner, room } = await verifyPartnerToken(token);
  if (room.id !== roomId) {
    throw new InvalidPartnerError("Token does not match this room");
  }
  return partner;
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/** Approximate "Week N" indicator based on calendar time since the room was created. */
export function getApproximateWeekNumber(createdAt: Date, now: Date): number {
  const elapsed = now.getTime() - createdAt.getTime();
  return Math.max(1, Math.floor(elapsed / MS_PER_WEEK) + 1);
}
