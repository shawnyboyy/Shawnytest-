import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import { resolveRoomByCode } from "@/lib/api/room-lookup";
import { encodePartnerToken, generatePartnerSecret } from "@/lib/partner-token";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const room = await resolveRoomByCode(code);

    if (room.partnerBSecret) {
      return NextResponse.json(
        { error: "This room already has two partners" },
        { status: 409 },
      );
    }

    const partnerBSecret = generatePartnerSecret();
    await prisma.room.update({
      where: { id: room.id },
      data: {
        partnerBSecret,
        partnerBJoinedAt: new Date(),
        status: "ACTIVE",
      },
    });

    const partnerToken = encodePartnerToken({ roomId: room.id, partner: "B", secret: partnerBSecret });
    return NextResponse.json({ roomCode: room.code, partnerToken });
  } catch (err) {
    return toErrorResponse(err);
  }
}
