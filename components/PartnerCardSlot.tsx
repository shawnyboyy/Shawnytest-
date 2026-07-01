"use client";

import { CardFace } from "./CardFace";
import { DecisionNoteForm } from "./DecisionNoteForm";
import type { DrawnCardDTO } from "@/lib/client/api";

interface PartnerCardSlotProps {
  label: string;
  card: DrawnCardDTO | null;
  isMine: boolean;
  busy: boolean;
  onDraw: () => void;
  onPass: () => void;
  onAnswer: () => void;
  onSaveDecision: (note: string) => Promise<void>;
}

export function PartnerCardSlot({
  label,
  card,
  isMine,
  busy,
  onDraw,
  onPass,
  onAnswer,
  onSaveDecision,
}: PartnerCardSlotProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-black/70 dark:text-white/70">{label}</h3>

      {!card && isMine && (
        <button
          type="button"
          onClick={onDraw}
          disabled={busy}
          className="rounded-xl border-2 border-dashed border-black/20 p-8 text-center font-medium text-black/60 transition hover:border-black/40 hover:text-black disabled:opacity-40 dark:border-white/20 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white"
        >
          Draw your card
        </button>
      )}

      {!card && !isMine && (
        <div className="rounded-xl border border-dashed border-black/10 p-8 text-center text-black/40 dark:border-white/10 dark:text-white/40">
          Waiting to draw…
        </div>
      )}

      {card && (
        <div className="flex flex-col gap-3">
          <CardFace
            theme={card.card.theme}
            level={card.card.level}
            text={card.card.text}
            curveballNo={card.card.curveballNo}
          />

          <div className="flex flex-wrap items-center gap-3">
            {isMine && (
              <button
                type="button"
                onClick={onPass}
                disabled={busy}
                className="text-sm font-medium text-black/60 underline underline-offset-2 hover:text-black disabled:opacity-40 dark:text-white/60 dark:hover:text-white"
              >
                Pass
              </button>
            )}
            {!card.answered && (
              <button
                type="button"
                onClick={onAnswer}
                disabled={busy}
                className="rounded-md bg-black px-3 py-1 text-sm font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black"
              >
                Mark answered
              </button>
            )}
            {card.answered && (
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                Answered ✓
              </span>
            )}
            {card.timesPassed > 0 && (
              <span className="text-xs text-black/40 dark:text-white/40">
                Passed {card.timesPassed}×
              </span>
            )}
          </div>

          <DecisionNoteForm initialNote={card.decisionNote} onSave={onSaveDecision} />
        </div>
      )}
    </div>
  );
}
