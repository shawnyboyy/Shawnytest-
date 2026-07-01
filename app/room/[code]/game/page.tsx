"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PartnerCardSlot } from "@/components/PartnerCardSlot";
import { ProgressBar } from "@/components/ProgressBar";
import { answerCard, ApiError, drawCard, passCard, saveDecision } from "@/lib/client/api";
import { loadRoomToken } from "@/lib/client/partnerToken";
import { useRoomState } from "@/lib/client/useRoomState";

export default function GamePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const roomCode = params.code.toUpperCase();

  const [storedToken] = useState(() => loadRoomToken(roomCode));
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const token = storedToken?.token ?? null;
  const partner = storedToken?.partner ?? null;

  useEffect(() => {
    if (!storedToken) {
      router.replace(`/room/${roomCode}`);
    }
  }, [storedToken, roomCode, router]);

  const { state, error, loading, refresh } = useRoomState(roomCode, token);

  async function runAction(fn: () => Promise<unknown>) {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
      await refresh();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (!token || !partner || loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-black/60 dark:text-white/60">Loading…</p>
      </main>
    );
  }

  if (error && !state) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-bold">Couldn&apos;t load this game</h1>
        <p className="text-black/60 dark:text-white/60">{error}</p>
      </main>
    );
  }

  if (!state) return null;

  const myCard = state.todaysCards[partner];
  const otherPartner = partner === "A" ? "B" : "A";
  const theirCard = state.todaysCards[otherPartner];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Under One Roof</h1>
          <Link
            href={`/room/${roomCode}/decisions`}
            className="text-sm font-medium text-black/60 underline underline-offset-2 dark:text-white/60"
          >
            Decisions log
          </Link>
        </div>
        <ProgressBar
          currentLevel={state.currentLevel}
          poolCounts={state.poolCounts}
          weekNumber={state.weekNumber}
        />
      </header>

      {state.isComplete && (
        <div className="rounded-xl border border-black/10 bg-black/5 p-6 text-center dark:border-white/15 dark:bg-white/10">
          <h2 className="text-lg font-bold">You&apos;ve completed Under One Roof! 🎉</h2>
          <p className="mt-1 text-black/60 dark:text-white/60">
            Take a look back at everything you decided along the way.
          </p>
          <Link
            href={`/room/${roomCode}/decisions`}
            className="mt-4 inline-block rounded-md bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            View your decisions
          </Link>
        </div>
      )}

      {!state.isComplete && state.dayType === "WEEKEND" && (
        <div className="rounded-xl border border-dashed border-black/15 p-8 text-center dark:border-white/20">
          <p className="text-lg font-medium">No cards today — enjoy your weekend!</p>
          <p className="mt-1 text-black/50 dark:text-white/50">See you Monday.</p>
        </div>
      )}

      {!state.isComplete && state.dayType !== "WEEKEND" && (
        <div className="grid gap-6 sm:grid-cols-2">
          <PartnerCardSlot
            label="You"
            card={myCard}
            isMine
            busy={busy}
            onDraw={() => runAction(() => drawCard(roomCode, token))}
            onPass={() =>
              myCard && runAction(() => passCard(roomCode, token, myCard.drawnCardId))
            }
            onAnswer={() =>
              myCard && runAction(() => answerCard(roomCode, token, myCard.drawnCardId))
            }
            onSaveDecision={(note) =>
              runAction(() => {
                if (!myCard) return Promise.resolve();
                return saveDecision(roomCode, token, myCard.drawnCardId, note);
              })
            }
          />
          <PartnerCardSlot
            label="Your partner"
            card={theirCard}
            isMine={false}
            busy={busy}
            onDraw={() => {}}
            onPass={() => {}}
            onAnswer={() =>
              theirCard && runAction(() => answerCard(roomCode, token, theirCard.drawnCardId))
            }
            onSaveDecision={(note) =>
              runAction(() => {
                if (!theirCard) return Promise.resolve();
                return saveDecision(roomCode, token, theirCard.drawnCardId, note);
              })
            }
          />
        </div>
      )}

      {actionError && <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>}
    </main>
  );
}
