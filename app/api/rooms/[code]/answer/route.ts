import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/api/errors";
import { requirePartnerForRoom, resolveRoomByCode } from "@/lib/api/room-lookup";
import { serializeDrawnCard } from "@/lib/api/serialize";
import { InvalidPartnerError } from "@/lib/game-logic/errors";
import { getDrawnCardById } from "@/lib/game-logic/repository";
import { answerDrawnCard } from "@/lib/game-logic/session";

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
    // Either partner may mark a card answered — it's a shared "we discussed
    // this" action, not a personal to-do like drawing or passing is.
    await requirePartnerForRoom(partnerToken, room.id);

    const existing = await getDrawnCardById(drawnCardId);
    if (existing.roomId !== room.id) {
      throw new InvalidPartnerError("That card does not belong to this room");
    }

    await answerDrawnCard(drawnCardId);
    const updated = await getDrawnCardById(drawnCardId);
    return NextResponse.json(serializeDrawnCard(updated));
  } catch (err) {
    return toErrorResponse(err);
  }
}
