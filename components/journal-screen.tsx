"use client";

import { CHARACTERS } from "@/lib/characters";
import { useGame } from "@/lib/store";
import { Portrait } from "@/components/widgets";

export function JournalScreen() {
  const { state } = useGame();
  const entries = [...state.journal].reverse();
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <p className="text-xs tracking-[0.28em] text-[#e4c27a] uppercase">Relationship journal</p>
      <h2 className="font-display text-5xl">What the night kept</h2>
      <p className="mt-2 text-sm leading-6 text-[#f6efe4]/80">
        Wins are not the plot. These are the conversations, invitations, and small mercies worth rereading.
      </p>
      <div className="mt-6 space-y-3">
        {entries.map((entry) => (
          <article key={entry.id} className="rounded-3xl border border-white/10 bg-black/35 p-4">
            <div className="flex gap-3">
              {entry.characterId && <Portrait id={entry.characterId} className="h-16 w-14 rounded-xl" />}
              <div>
                <div className="text-xs tracking-wide text-[#e4c27a] uppercase">
                  Night {entry.evening}
                  {entry.characterId ? ` · ${CHARACTERS[entry.characterId].name}` : ""}
                </div>
                <h3 className="font-display text-2xl">{entry.title}</h3>
                <p className="mt-1 text-sm leading-6">{entry.body}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
