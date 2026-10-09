"use client";

import { playSfx } from "@/lib/audio";
import { pickLine } from "@/lib/banter";
import { LIMITS } from "@/lib/presence";
import { PAYLINES, SYMBOLS, isJackpot, scoreGrid, spinReels, type SymbolId } from "@/lib/slots";
import { topicsFor } from "@/lib/story";
import { useGame } from "@/lib/store";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { HostRail, RulesButton, Tutorial, money } from "@/components/widgets";

const LOOK: Record<SymbolId, string> = {
  cherry: "bg-rose-800",
  bell: "bg-amber-500 text-amber-950",
  star: "bg-indigo-700",
  gem: "bg-teal-600",
  seven: "bg-fuchsia-800",
  wild: "bg-[#f0d7a2] text-[#3a2412]",
};

export function SlotsTable() {
  const { state, dispatch, setScreen } = useGame();
  const [practice, setPractice] = useState(false);
  const [bet, setBet] = useState<number>(10);
  const [grid, setGrid] = useState<SymbolId[][]>([
    ["cherry", "bell", "star"],
    ["gem", "seven", "cherry"],
    ["bell", "wild", "star"],
  ]);
  const [spinning, setSpinning] = useState(false);
  const [win, setWin] = useState<number | null>(null);
  const [hot, setHot] = useState<number[]>([]);
  const [line, setLine] = useState(pickLine("mika", state.time === "after" ? "practice" : "greet", 2));
  const topics = topicsFor(state, "mika", "table");
  const offDuty = state.time === "after";

  function spin() {
    if (spinning) return;
    if (!practice && state.chips < bet) return;
    const next = spinReels();
    setSpinning(true);
    setWin(null);
    setHot([]);
    playSfx("chip", state.sfx);
    window.setTimeout(() => {
      const scored = scoreGrid(next, bet);
      setGrid(next);
      setSpinning(false);
      setWin(scored.total);
      setHot(scored.lines.map((item) => item.index));
      const profit = scored.total - bet;
      if (!practice) {
        dispatch({
          type: "round",
          game: "slots",
          live: true,
          profit,
          with: offDuty ? [] : ["mika"],
          dramatic: !offDuty && isJackpot(scored.lines) ? ["mika"] : [],
        });
      }
      setLine(pickLine("mika", practice || offDuty ? "practice" : isJackpot(scored.lines) ? "jackpot" : scored.total > 0 ? "win" : "lose", scored.total + bet));
      playSfx(scored.total > bet ? "win" : "lose", state.sfx);
    }, 900);
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-4 px-3 py-4 lg:grid-cols-[240px_1fr]">
      <Tutorial
        id="slots"
        title="Slots with Mika"
        bullets={[
          "Three reels, five paylines: middle, top, bottom, and both diagonals.",
          "Three matching symbols pay. The Mirage mark is wild. Cherries are common. Sevens are loud.",
          "This cabinet is a little kinder than the ones downtown. Mika will cheer either way.",
          "After hours she has clocked out, but practice spins still work.",
        ]}
      />
      <HostRail host="mika" line={offDuty ? "Mika left the cabinet humming and a note that says: clap for the cherries anyway." : line} aside="She wants the small wins celebrated out loud." />
      <section className="rounded-[28px] border border-[#e4c27a]/40 bg-gradient-to-b from-[#3a1830] to-[#140910] p-4 text-[#f7f1e6] shadow-2xl">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-4xl">Mirage Reels</h2>
          <div className="flex gap-2">
            <RulesButton
              title="Mirage Reels"
              body={[
                "Five lines. A wild substitutes for any symbol. Three of a kind on a line pays.",
                "Cherry 5, Bell 8, Star 12, Gem 20, Seven 40, Mirage 50, divided across the stake.",
                "The return is friendly on purpose. Mika designed the cheer, not the cruelty.",
              ]}
            />
            {!offDuty && topics.slice(0, 1).map((topic) => (
              <Button key={topic.id} size="sm" variant="outline" className="bg-black/20" onClick={() => setScreen({ name: "dialogue", sceneId: topic.id, back: { name: "slots" } })}>
                Talk with Mika
              </Button>
            ))}
            <Button size="sm" variant="outline" className="bg-black/20" onClick={() => setScreen({ name: "map" })}>Leave</Button>
          </div>
        </div>
        <div className={`grid grid-cols-3 gap-3 rounded-3xl bg-black/40 p-4 ${spinning ? "reel-spin" : ""}`}>
          {grid.map((reel, reelIndex) => (
            <div key={reelIndex} className="space-y-2">
              {reel.map((symbol, row) => {
                const lit = hot.some((index) => PAYLINES[index][reelIndex] === row);
                return (
                  <div key={`${symbol}-${row}`} className={`flex h-20 items-center justify-center rounded-2xl text-lg font-semibold ${LOOK[symbol]} ${lit ? "ring-2 ring-[#f0d7a2]" : ""}`}>
                    {SYMBOLS.find((item) => item.id === symbol)?.label}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {LIMITS.slots.map((value) => (
            <Button key={value} size="sm" variant={bet === value ? "default" : "outline"} className={bet === value ? "" : "bg-black/25"} onClick={() => setBet(value)} disabled={spinning}>
              {money(value)}
            </Button>
          ))}
          <label className="flex items-center gap-2 text-sm"><Switch checked={practice} onCheckedChange={setPractice} disabled={spinning} /> Practice</label>
          <Button className="h-11" disabled={spinning || (!practice && state.chips < bet)} onClick={spin}>Spin</Button>
        </div>
        <p className="mt-3 text-sm">
          {win === null ? "Pick a stake and spin." : win > 0 ? `The reels pay ${money(win)}.` : "No line this time. Mika would tell you to spin again."}
        </p>
        <ul className="mt-3 grid grid-cols-2 gap-1 text-xs text-white/75 sm:grid-cols-3">
          {SYMBOLS.map((symbol) => (
            <li key={symbol.id}>{symbol.label} ×3 · {symbol.pay}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
