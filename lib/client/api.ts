export interface DrawnCardDTO {
  drawnCardId: string;
  partner: "A" | "B";
  timesPassed: number;
  answeredAt: string | null;
  answered: boolean;
  card: {
    id: string;
    theme: string | null;
    level: "WARMUP" | "REAL_TALK" | "GO_DEEP" | "CURVEBALL";
    text: string;
    curveballNo: number | null;
  };
  decisionNote: string | null;
}

export interface RoomStateDTO {
  roomCode: string;
  status: "WAITING_FOR_PARTNER" | "ACTIVE" | "COMPLETE";
  currentLevel: "WARMUP" | "REAL_TALK" | "GO_DEEP";
  dayType: "THEMED" | "CURVEBALL" | "WEEKEND";
  pool: "WARMUP" | "REAL_TALK" | "GO_DEEP" | "CURVEBALL" | null;
  isComplete: boolean;
  weekNumber: number;
  poolCounts: { warmup: number; realTalk: number; goDeep: number; curveball: number };
  todaysCards: { A: DrawnCardDTO | null; B: DrawnCardDTO | null };
}

export interface DecisionDTO {
  id: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  theme: string | null;
  level: string;
  cardText: string;
  playDate: string;
  partner: "A" | "B";
}

class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(body?.error ?? "Request failed", response.status);
  }
  return body as T;
}

export function createRoom(timezone: string) {
  return request<{ roomCode: string; partner: "A"; partnerToken: string }>("/api/rooms", {
    method: "POST",
    body: JSON.stringify({ timezone }),
  });
}

export function joinRoom(roomCode: string) {
  return request<{ roomCode: string; partner: "B"; partnerToken: string }>(
    `/api/rooms/${roomCode}/join`,
    { method: "POST" },
  );
}

export function getRoomState(roomCode: string, token: string) {
  return request<RoomStateDTO>(
    `/api/rooms/${roomCode}/state?token=${encodeURIComponent(token)}`,
  );
}

export function drawCard(roomCode: string, partnerToken: string) {
  return request<DrawnCardDTO>(`/api/rooms/${roomCode}/draw`, {
    method: "POST",
    body: JSON.stringify({ partnerToken }),
  });
}

export function passCard(roomCode: string, partnerToken: string, drawnCardId: string) {
  return request<DrawnCardDTO>(`/api/rooms/${roomCode}/pass`, {
    method: "POST",
    body: JSON.stringify({ partnerToken, drawnCardId }),
  });
}

export function answerCard(roomCode: string, partnerToken: string, drawnCardId: string) {
  return request<DrawnCardDTO>(`/api/rooms/${roomCode}/answer`, {
    method: "POST",
    body: JSON.stringify({ partnerToken, drawnCardId }),
  });
}

export function saveDecision(
  roomCode: string,
  partnerToken: string,
  drawnCardId: string,
  note: string,
) {
  return request<{ note: string; updatedAt: string }>(`/api/rooms/${roomCode}/decision`, {
    method: "POST",
    body: JSON.stringify({ partnerToken, drawnCardId, note }),
  });
}

export function getDecisions(roomCode: string, token: string) {
  return request<{ decisions: DecisionDTO[] }>(
    `/api/rooms/${roomCode}/decisions?token=${encodeURIComponent(token)}`,
  );
}

export { ApiError };
