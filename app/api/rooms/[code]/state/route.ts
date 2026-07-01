import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import { getApproximateWeekNumber, requirePartnerForRoom, resolveRoomByCode } from "@/lib/api/room-lookup";
import { serializeDrawnCard } from "@/lib/api/serialize";
import * as repo from "@/lib/game-logic/repository";
import { getTodaysSession } from "@/lib/game-logic/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const room = await resolveRoomByCode(code);

    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }
    await requirePartnerForRoom(token, room.id);

    const now = new Date();
    const session = await getTodaysSession(room.id, now);
    const poolCounts = await repo.getPoolCounts(room.id);

    return NextResponse.json({
      roomCode: room.code,
      status: room.status,
      currentLevel: room.currentLevel,
      dayType: session.dayType,
      pool: session.pool,
      isComplete: session.isComplete,
      weekNumber: getApproximateWeekNumber(room.createdAt, now),
      poolCounts: {
        warmup: poolCounts.WARMUP,
        realTalk: poolCounts.REAL_TALK,
        goDeep: poolCounts.GO_DEEP,
        curveball: poolCounts.CURVEBALL,
      },
      todaysCards: {
        A: session.cards.A ? serializeDrawnCard(session.cards.A) : null,
        B: session.cards.B ? serializeDrawnCard(session.cards.B) : null,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
