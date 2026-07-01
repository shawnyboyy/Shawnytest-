"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, createRoom } from "@/lib/client/api";
import { saveRoomToken } from "@/lib/client/partnerToken";

export default function HomePage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const { roomCode, partner, partnerToken } = await createRoom(timezone);
      saveRoomToken(roomCode, { partner, token: partnerToken });
      router.push(`/room/${roomCode}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
      setCreating(false);
    }
  }

  function handleJoinSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length === 0) return;
    router.push(`/room/${code}`);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-12">
      <div>
        <h1 className="text-3xl font-bold">Under One Roof</h1>
        <p className="mt-2 text-black/60 dark:text-white/60">
          A weekday conversation ritual for couples moving in together.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="rounded-lg bg-black px-4 py-3 text-center font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black"
        >
          {creating ? "Creating…" : "Start a new game"}
        </button>

        <div className="flex items-center gap-3 text-xs text-black/40 dark:text-white/40">
          <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
          or
          <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
        </div>

        <form onSubmit={handleJoinSubmit} className="flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter room code"
            className="min-w-0 flex-1 rounded-lg border border-black/15 bg-transparent px-3 py-3 uppercase tracking-widest outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40"
          />
          <button
            type="submit"
            className="rounded-lg border border-black/20 px-4 py-3 font-medium dark:border-white/25"
          >
            Join
          </button>
        </form>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </main>
  );
}
