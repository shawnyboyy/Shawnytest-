import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/api/errors";
import { seedPoolsForRoom } from "@/lib/game-logic/pool";
import { prisma } from "@/lib/prisma";
import { generatePartnerSecret, encodePartnerToken } from "@/lib/partner-token";
import { generateUniqueRoomCode } from "@/lib/room-code";

const createRoomSchema = z.object({
  timezone: z.string().min(1),
});

function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = createRoomSchema.parse(await request.json());
    if (!isValidTimezone(body.timezone)) {
      return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
    }

    const code = await generateUniqueRoomCode();
    const partnerASecret = generatePartnerSecret();

    const room = await prisma.room.create({
      data: {
        code,
        timezone: body.timezone,
        partnerASecret,
        partnerAJoinedAt: new Date(),
      },
    });

    await seedPoolsForRoom(room.id);

    const partnerToken = encodePartnerToken({ roomId: room.id, partner: "A", secret: partnerASecret });

    return NextResponse.json({ roomCode: room.code, partner: "A", partnerToken }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
