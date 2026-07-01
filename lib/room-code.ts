import { randomInt } from "node:crypto";
import * as repo from "./game-logic/repository";

// Excludes visually ambiguous characters (0/O, 1/I/L).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const MAX_ATTEMPTS = 10;

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

/** Generates a room code guaranteed not to collide with an existing room. */
export async function generateUniqueRoomCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = generateRoomCode();
    const existing = await repo.getRoomByCode(code);
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique room code after multiple attempts");
}

export function normalizeRoomCode(input: string): string {
  return input.trim().toUpperCase();
}
