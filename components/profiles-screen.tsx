"use client";

import { CHARACTERS, CHARACTER_IDS, EVENING_LOOKS, stageName } from "@/lib/characters";
import { romanceBlockedReason } from "@/lib/progress";
import { useGame } from "@/lib/store";
import type { CharacterId } from "@/lib/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Portrait } from "@/components/widgets";

export function ProfilesScreen() {
  const { state, dispatch } = useGame();
  const [focus, setFocus] = useState<CharacterId>("reina");
  const character = CHARACTERS[focus];
  const rel = state.relationships[focus];
  const outfit = state.outfits[focus] ?? "uniform";
  const reason = romanceBlockedReason(state, focus);
  const knownTastes = rel.conversations >= 2;

  return (
    <main className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:grid-cols-[280px_1fr]">
      <aside className="grid grid-cols-2 gap-2 lg:grid-cols-1">
        {CHARACTER_IDS.map((id) => (
          <button key={id} className={`flex items-center gap-2 rounded-2xl border p-2 text-left ${id === focus ? "border-[#e4c27a]/60 bg-black/40" : "border-white/10"}`} onClick={() => setFocus(id)}>
            <Portrait id={id} outfit={state.outfits[id] ?? "uniform"} className="h-14 w-12 rounded-lg" />
            <span>
              <span className="block text-sm">{CHARACTERS[id].name}</span>
              <span className="text-xs text-[#e4c27a]">{stageName(state.relationships[id].affinity, state.relationships[id].romance)}</span>
            </span>
          </button>
        ))}
      </aside>
      <section className="rounded-3xl border border-white/10 bg-black/35 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
          <Portrait id={focus} outfit={outfit} className="aspect-[3/4] w-full rounded-2xl" />
          <div>
            <p className="text-xs tracking-[0.22em] text-[#e4c27a] uppercase">{character.role} · age {character.age}</p>
            <h2 className="font-display text-5xl">{character.name}</h2>
            <p className="mt-2 text-sm leading-6">{character.about}</p>
            <p className="mt-2 text-sm text-[#f0d7a2]">Wants: {character.wish}</p>
            <p className="mt-1 text-sm text-[#f6efe4]/75">Voice: {character.voice}</p>
            <p className="mt-1 text-sm">Look: {character.look}</p>
            {knownTastes && (
              <p className="mt-3 text-sm text-[#ffd0e0]">
                She warms to {character.likes.join(" and ")} conversation
                {character.dislikesEarly.length ? `, and early ${character.dislikesEarly.join(" or ")} attention cools the room` : ""}.
              </p>
            )}
            {reason && focus !== "aoi" && rel.romance !== "close" && <p className="mt-3 text-sm leading-6 text-[#f6efe4]/80">{reason}</p>}
            {EVENING_LOOKS.includes(focus) && state.unlockedOutfits.includes(focus) && (
              <div className="mt-4 flex gap-2">
                <Button variant={outfit === "uniform" ? "default" : "outline"} onClick={() => dispatch({ type: "outfit", id: focus, outfit: "uniform" })}>
                  On duty
                </Button>
                <Button variant={outfit === "evening" ? "default" : "outline"} onClick={() => dispatch({ type: "outfit", id: focus, outfit: "evening" })}>
                  Off duty
                </Button>
              </div>
            )}
            {EVENING_LOOKS.includes(focus) && !state.unlockedOutfits.includes(focus) && (
              <p className="mt-3 text-xs text-[#f0d7a2]/70">An off-duty look appears when the two of you have actually spent time, not when the rack is heavy.</p>
            )}
          </div>
        </div>
        <h3 className="mt-6 font-display text-2xl">Memories</h3>
        {rel.memories.length === 0 ? (
          <p className="mt-2 text-sm text-[#f6efe4]/70">Nothing filed yet. Sit down, play a round, or ask a real question.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {rel.memories.map((memory) => (
              <li key={memory.id} className="rounded-2xl bg-black/30 px-3 py-2 text-sm leading-6">
                Night {memory.evening}: {memory.text}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
