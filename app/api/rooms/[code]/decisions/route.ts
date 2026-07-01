import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import { requirePartnerForRoom, resolveRoomByCode } from "@/lib/api/room-lookup";
import { listDecisionLogsForRoom } from "@/lib/game-logic/repository";

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

    const logs = await listDecisionLogsForRoom(room.id);
    return NextResponse.json({
      decisions: logs.map((log) => ({
        id: log.id,
        note: log.note,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
        theme: log.drawnCard.card.theme,
        level: log.drawnCard.card.level,
        cardText: log.drawnCard.card.text,
        playDate: log.drawnCard.playDate,
        partner: log.drawnCard.partner,
      })),
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
