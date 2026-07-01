import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/api/errors";
import { requirePartnerForRoom, resolveRoomByCode } from "@/lib/api/room-lookup";
import { serializeDrawnCard } from "@/lib/api/serialize";
import { drawTodayCard } from "@/lib/game-logic/session";

const bodySchema = z.object({ partnerToken: z.string().min(1) });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const room = await resolveRoomByCode(code);
    const { partnerToken } = bodySchema.parse(await request.json());
    const partner = await requirePartnerForRoom(partnerToken, room.id);

    const drawnCard = await drawTodayCard(room.id, partner, new Date());
    return NextResponse.json(serializeDrawnCard(drawnCard));
  } catch (err) {
    return toErrorResponse(err);
  }
}
