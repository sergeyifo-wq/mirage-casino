"use client";

import { themeBlurb } from "@/lib/progress";
import { assetPath } from "@/lib/assets";
import { NIGHTLY_ALLOWANCE } from "@/lib/presence";
import { createSave, useGame, writeSave } from "@/lib/store";
import type { ThemeId } from "@/lib/types";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { money } from "@/components/widgets";

const THEMES: ThemeId[] = ["velvet", "neon", "gilded", "moonlit"];

export function SuiteScreen() {
  const { state, dispatch, setScreen, toast } = useGame();
  const [name, setName] = useState(state.playerName);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  function exportSave() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "midnight-mirage-save.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="scene-scrim min-h-[calc(100vh-64px)]" style={{ ["--scene" as string]: `url("${assetPath("/art/bg-suite.jpg")}")` }}>
      <div className="mx-auto grid max-w-5xl gap-4 px-4 py-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-white/10 bg-black/55 p-5">
          <p className="text-xs tracking-[0.28em] text-[#e4c27a] uppercase">Your suite</p>
          <h2 className="font-display text-5xl">The city, without the felt</h2>
          <p className="mt-2 max-w-xl text-sm leading-6">
            Rest to close the night. Aoi leaves {money(NIGHTLY_ALLOWANCE)} chips for the next evening. Relationships stay. Unanswered invitations do not turn sour — they simply expire.
          </p>
          <Button className="mt-4 h-11" onClick={() => { dispatch({ type: "rest" }); toast("The allowance is on the dresser. A new evening is waiting downstairs."); }}>
            Rest until tomorrow evening
          </Button>
          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <Stat label="Evenings" value={String(state.evening)} />
            <Stat label="Rounds" value={String(state.stats.rounds)} />
            <Stat label="Biggest win" value={money(state.stats.biggestWin)} />
            <Stat label="Drinks" value={String(state.drinks)} />
            <Stat label="High rack" value={money(state.highWater)} />
            <Stat label="Journal" value={String(state.journal.length)} />
          </dl>
        </section>
        <section className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-black/55 p-4">
            <h3 className="font-display text-2xl">Table themes</h3>
            <div className="mt-3 space-y-2">
              {THEMES.map((theme) => {
                const unlocked = state.unlockedThemes.includes(theme);
                return (
                  <button
                    key={theme}
                    disabled={!unlocked}
                    onClick={() => dispatch({ type: "theme", theme })}
                    className={`block w-full rounded-2xl border px-3 py-2 text-left disabled:opacity-45 ${state.theme === theme ? "border-[#e4c27a] bg-[#e4c27a]/10" : "border-white/10"}`}
                  >
                    <span className="capitalize">{theme}</span>
                    <span className="mt-1 block text-xs leading-5 text-[#f6efe4]/75">{unlocked ? themeBlurb(theme) : themeBlurb(theme)}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/55 p-4">
            <h3 className="font-display text-2xl">House preferences</h3>
            <label className="mt-3 flex items-center justify-between gap-3 text-sm">
              Jazz in the rafters
              <Switch checked={state.music} onCheckedChange={() => dispatch({ type: "toggle-music" })} />
            </label>
            <label className="mt-3 flex items-center justify-between gap-3 text-sm">
              Table sounds
              <Switch checked={state.sfx} onCheckedChange={() => dispatch({ type: "toggle-sfx" })} />
            </label>
            <div className="mt-4 flex gap-2">
              <Input value={name} maxLength={18} onChange={(event) => setName(event.target.value)} aria-label="Your name" />
              <Button variant="outline" onClick={() => dispatch({ type: "rename", name })}>Rename</Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" onClick={exportSave}>Export save</Button>
              <Button variant="outline" onClick={() => fileRef.current?.click()}>Import save</Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    const parsed = JSON.parse(await file.text());
                    if (parsed?.version !== 1) throw new Error("bad");
                    dispatch({ type: "hydrate", state: parsed });
                    toast("Save restored.");
                  } catch {
                    toast("That file isn't a Midnight Mirage save.");
                  }
                }}
              />
              {!confirmReset ? (
                <Button variant="ghost" onClick={() => setConfirmReset(true)}>Reset the night</Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={() => {
                    const fresh = createSave(state.playerName);
                    writeSave(fresh);
                    dispatch({ type: "new-game", name: state.playerName });
                    setScreen({ name: "title" });
                  }}
                >
                  Confirm reset
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/30 p-3">
      <dt className="text-xs tracking-wide text-[#e4c27a] uppercase">{label}</dt>
      <dd className="font-display text-2xl">{value}</dd>
    </div>
  );
}
