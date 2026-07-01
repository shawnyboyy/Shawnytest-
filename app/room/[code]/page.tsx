"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, getRoomState, joinRoom } from "@/lib/client/api";
import { loadRoomToken, saveRoomToken } from "@/lib/client/partnerToken";

export default function RoomEntryPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const roomCode = params.code.toUpperCase();

  const [phase, setPhase] = useState<"loading" | "join" | "waiting" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function check() {
      const stored = loadRoomToken(roomCode);
      if (!stored) {
        if (!cancelled) setPhase("join");
        return;
      }

      try {
        const state = await getRoomState(roomCode, stored.token);
        if (cancelled) return;
        if (state.status === "WAITING_FOR_PARTNER") {
          setPhase("waiting");
          intervalId = setInterval(check, 4000);
        } else {
          router.replace(`/room/${roomCode}/game`);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Could not load this room.");
          setPhase("error");
        }
      }
    }

    void check();
    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [roomCode, router]);

  async function handleJoin() {
    setJoining(true);
    setError(null);
    try {
      const { partner, partnerToken } = await joinRoom(roomCode);
      saveRoomToken(roomCode, { partner, token: partnerToken });
      router.replace(`/room/${roomCode}/game`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not join this room.");
      setJoining(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      {phase === "loading" && <p className="text-black/60 dark:text-white/60">Loading…</p>}

      {phase === "waiting" && (
        <>
          <h1 className="text-2xl font-bold">Waiting for your partner</h1>
          <p className="text-black/60 dark:text-white/60">
            Share this code with them so they can join:
          </p>
          <p className="text-4xl font-bold tracking-widest">{roomCode}</p>
          <p className="text-sm text-black/40 dark:text-white/40">
            This page will move on automatically once they join.
          </p>
        </>
      )}

      {phase === "join" && (
        <>
          <h1 className="text-2xl font-bold">Join room {roomCode}?</h1>
          <p className="text-black/60 dark:text-white/60">
            You&apos;ve been invited to play Under One Roof.
          </p>
          <button
            type="button"
            onClick={handleJoin}
            disabled={joining}
            className="rounded-lg bg-black px-6 py-3 font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black"
          >
            {joining ? "Joining…" : "Join game"}
          </button>
        </>
      )}

      {phase === "error" && (
        <>
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-black/60 dark:text-white/60">{error}</p>
        </>
      )}
    </main>
  );
}
