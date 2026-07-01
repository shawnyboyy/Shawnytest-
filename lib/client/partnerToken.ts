const STORAGE_PREFIX = "uor:room:";

export interface StoredPartnerToken {
  partner: "A" | "B";
  token: string;
}

export function saveRoomToken(roomCode: string, value: StoredPartnerToken) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_PREFIX + roomCode, JSON.stringify(value));
}

export function loadRoomToken(roomCode: string): StoredPartnerToken | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_PREFIX + roomCode);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredPartnerToken;
  } catch {
    return null;
  }
}

export function clearRoomToken(roomCode: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_PREFIX + roomCode);
}
