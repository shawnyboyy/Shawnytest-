import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/api/errors";
import { requirePartnerForRoom, resolveRoomByCode } from "@/lib/api/room-lookup";
import { serializeDrawnCard } from "@/lib/api/serialize";
import { InvalidPartnerError } from "@/lib/game-logic/errors";
import { getDrawnCardById } from "@/lib/game-logic/repository";
import { passTodayCard } from "@/lib/game-logic/session";

const bodySchema = z.object({
  partnerToken: z.string().min(1),
  drawnCardId: z.string().min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const room = await resolveRoomByCode(code);
    const { partnerToken, drawnCardId } = bodySchema.parse(await request.json());
    const partner = await requirePartnerForRoom(partnerToken, room.id);

    const existing = await getDrawnCardById(drawnCardId);
    if (existing.roomId !== room.id || existing.partner !== partner) {
      throw new InvalidPartnerError("You can only pass your own drawn card");
    }

    const replacement = await passTodayCard(drawnCardId);
    return NextResponse.json(serializeDrawnCard(replacement));
  } catch (err) {
    return toErrorResponse(err);
  }
}
