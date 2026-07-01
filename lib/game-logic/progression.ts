import * as repo from "./repository.js";
import type { CardLevel } from "./types.js";

const LEVEL_ORDER: CardLevel[] = ["WARMUP", "REAL_TALK", "GO_DEEP"];

export function nextLevel(current: CardLevel): CardLevel | null {
  const index = LEVEL_ORDER.indexOf(current);
  if (index === -1 || index === LEVEL_ORDER.length - 1) return null;
  return LEVEL_ORDER[index + 1];
}

/**
 * If the room's current themed level pool is fully resolved (no cards left to draw
 * or currently out for answering), advances the room to the next level.
 * Returns the new level if it advanced, or null if nothing changed (pool still has
 * cards, or already at the last level).
 */
export async function advanceLevelIfExhausted(roomId: string): Promise<CardLevel | null> {
  const room = await repo.getRoomById(roomId);
  const currentLevel = room.currentLevel;

  // Gate on "nothing left to draw", not on whether already-drawn cards have been
  // answered yet — this lets the second partner draw from the next level the
  // moment the pool runs dry mid-session (see progression edge cases).
  const availableCount = await repo.countAvailableInPool(roomId, currentLevel);
  if (availableCount > 0) return null;

  const next = nextLevel(currentLevel);
  if (!next) return null;

  await repo.updateRoomLevel(roomId, next);
  return next;
}

/**
 * Game is complete once the Go Deep pool is fully resolved (drawn & answered).
 * Curveball cycling never gates completion.
 */
export async function checkGameComplete(roomId: string): Promise<boolean> {
  const room = await repo.getRoomById(roomId);
  if (room.status === "COMPLETE") return true;
  if (room.currentLevel !== "GO_DEEP") return false;

  const activeCount = await repo.countActiveInPool(roomId, "GO_DEEP");
  if (activeCount > 0) return false;

  await repo.markRoomComplete(roomId);
  return true;
}
