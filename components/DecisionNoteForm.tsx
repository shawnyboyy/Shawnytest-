"use client";

import { useState } from "react";

interface DecisionNoteFormProps {
  initialNote: string | null;
  onSave: (note: string) => Promise<void>;
}

export function DecisionNoteForm({ initialNote, onSave }: DecisionNoteFormProps) {
  const [open, setOpen] = useState(Boolean(initialNote));
  const [note, setNote] = useState(initialNote ?? "");
  const [saving, setSaving] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-black/60 underline underline-offset-2 hover:text-black dark:text-white/60 dark:hover:text-white"
      >
        + Log a decision
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="What did you two decide?"
        rows={2}
        className="w-full rounded-md border border-black/15 bg-transparent p-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40"
      />
      <button
        type="button"
        disabled={saving || note.trim().length === 0}
        onClick={async () => {
          setSaving(true);
          try {
            await onSave(note.trim());
          } finally {
            setSaving(false);
          }
        }}
        className="self-start rounded-md bg-black px-3 py-1 text-sm font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black"
      >
        {saving ? "Saving…" : "Save decision"}
      </button>
    </div>
  );
}
