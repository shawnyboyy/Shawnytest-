import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/api/errors";
import { requirePartnerForRoom, resolveRoomByCode } from "@/lib/api/room-lookup";
import { InvalidPartnerError } from "@/lib/game-logic/errors";
import { getDrawnCardById, upsertDecisionLog } from "@/lib/game-logic/repository";

const bodySchema = z.object({
  partnerToken: z.string().min(1),
  drawnCardId: z.string().min(1),
  note: z.string().min(1).max(2000),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const room = await resolveRoomByCode(code);
    const { partnerToken, drawnCardId, note } = bodySchema.parse(await request.json());
    await requirePartnerForRoom(partnerToken, room.id);

    const existing = await getDrawnCardById(drawnCardId);
    if (existing.roomId !== room.id) {
      throw new InvalidPartnerError("That card does not belong to this room");
    }

    const decisionLog = await upsertDecisionLog(room.id, drawnCardId, note);
    return NextResponse.json({ note: decisionLog.note, updatedAt: decisionLog.updatedAt });
  } catch (err) {
    return toErrorResponse(err);
  }
}
