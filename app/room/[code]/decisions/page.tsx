"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { levelLabel, partnerLabel } from "@/lib/client/format";
import { ApiError, getDecisions, type DecisionDTO } from "@/lib/client/api";
import { loadRoomToken } from "@/lib/client/partnerToken";

export default function DecisionsPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const roomCode = params.code.toUpperCase();

  const [decisions, setDecisions] = useState<DecisionDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadRoomToken(roomCode);
    if (!stored) {
      router.replace(`/room/${roomCode}`);
      return;
    }

    getDecisions(roomCode, stored.token)
      .then((res) => setDecisions(res.decisions))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Could not load decisions."),
      );
  }, [roomCode, router]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Decisions log</h1>
        <Link
          href={`/room/${roomCode}/game`}
          className="text-sm font-medium text-black/60 underline underline-offset-2 dark:text-white/60"
        >
          Back to game
        </Link>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {decisions && decisions.length === 0 && (
        <p className="text-black/50 dark:text-white/50">
          Nothing logged yet. Decisions you save from a card will show up here.
        </p>
      )}

      {decisions && decisions.length > 0 && (
        <ul className="flex flex-col gap-4">
          {decisions.map((d) => (
            <li
              key={d.id}
              className="rounded-lg border border-black/10 p-4 dark:border-white/15"
            >
              <div className="mb-1 flex flex-wrap gap-2 text-xs uppercase tracking-wide text-black/40 dark:text-white/40">
                <span>{levelLabel(d.level)}</span>
                {d.theme && <span>· {d.theme}</span>}
                <span>· {partnerLabel(d.partner)}</span>
              </div>
              <p className="mb-2 text-sm italic text-black/60 dark:text-white/60">
                &ldquo;{d.cardText}&rdquo;
              </p>
              <p>{d.note}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
