import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  InvalidPartnerError,
  NoPlayTodayError,
  PoolExhaustedError,
  RoomNotFoundError,
} from "../game-logic/errors";

export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid request", details: err.issues },
      { status: 400 },
    );
  }
  if (err instanceof InvalidPartnerError) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
  if (err instanceof RoomNotFoundError) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
  if (err instanceof NoPlayTodayError) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }
  if (err instanceof PoolExhaustedError) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }
  console.error(err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
