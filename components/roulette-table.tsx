"use client";

import { playSfx } from "@/lib/audio";
import { pickLine } from "@/lib/banter";
import { LIMITS } from "@/lib/presence";
import {
  WHEEL,
  betLabel,
  isRed,
  settleRoulette,
  spinWheel,
  type RouletteBet,
} from "@/lib/roulette";
import { topicsFor } from "@/lib/story";
import { useGame } from "@/lib/store";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { HostRail, RulesButton, Tutorial, money } from "@/components/widgets";

export function RouletteTable() {
  const { state, dispatch, setScreen, toast } = useGame();
  const [practice, setPractice] = useState(false);
  const [chip, setChip] = useState(10);
  const [bets, setBets] = useState<RouletteBet[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [line, setLine] = useState(pickLine("celeste", "greet", 1));
  const total = bets.reduce((sum, bet) => sum + bet.amount, 0);
  const topics = topicsFor(state, "celeste", "table");

  function add(partial: Omit<RouletteBet, "id" | "amount">) {
    if (spinning) return;
    if (total + chip > LIMITS.roulette.maxTotal) {
      toast("That layout is full for one spin.");
      return;
    }
    if (!practice && total + chip > state.chips) {
      toast("Your rack can't cover that.");
      return;
    }
    setBets((current) => {
      const existing = current.find((bet) => bet.kind === partial.kind && bet.n === partial.n);
      if (existing) {
        if (existing.amount + chip > LIMITS.roulette.maxSpot && partial.kind === "straight") return current;
        return current.map((bet) => (bet === existing ? { ...bet, amount: bet.amount + chip } : bet));
      }
      return [...current, { ...partial, id: `${partial.kind}-${partial.n ?? "x"}-${current.length}`, amount: chip }];
    });
    playSfx("chip", state.sfx);
  }

  function spin() {
    if (!bets.length || spinning) return;
    if (!practice && total > state.chips) {
      toast("Pull a chip back. The stake is larger than your rack.");
      return;
    }
    const landed = spinWheel();
    setSpinning(true);
    setResult(null);
    const index = WHEEL.indexOf(landed as (typeof WHEEL)[number]);
    const center = (index + 0.5) * (360 / WHEEL.length);
    setRotation((current) => (Math.floor(current / 360) + 6) * 360 - center);
    window.setTimeout(() => {
      const settled = settleRoulette(bets, landed);
      const profit = settled.returned - total;
      if (!practice) {
        dispatch({
          type: "round",
          game: "roulette",
          live: true,
          profit,
          with: ["celeste"],
          dramatic: bets.some((bet) => bet.kind === "straight" && bet.n === landed) ? ["celeste"] : [],
        });
      }
      setResult(landed);
      setSpinning(false);
      setBets([]);
      const key = landed === 0 ? "zero" : bets.some((bet) => bet.kind === "straight" && bet.n === landed) ? "straight" : profit > 0 ? "win" : "lose";
      setLine(pickLine("celeste", practice ? "practice" : key, landed + 1));
      playSfx(profit > 0 ? "win" : "lose", state.sfx);
    }, 4600);
  }

  const wheel = useMemo(() => WHEEL.map((number, index) => ({ number, index })), []);

  return (
    <main className="mx-auto grid max-w-6xl gap-4 px-3 py-4 lg:grid-cols-[240px_1fr]">
      <Tutorial
        id="roulette"
        title="Roulette with Celeste"
        bullets={[
          "European wheel, one zero. A straight number pays 35 to 1. Even chances pay 1 to 1. Dozens and columns pay 2 to 1.",
          "Zero loses every outside bet. Celeste will make a moment of it anyway.",
          "Stack chips on the layout, then spin. Practice spends nothing.",
        ]}
      />
      <HostRail host="celeste" line={line} aside="Every spin is a small play. She knows the ending is physics." />
      <section className="felt rounded-[28px] p-4 text-[#f7f1e6]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-4xl">Roulette</h2>
          <div className="flex gap-2">
            <RulesButton
              title="European roulette"
              body={[
                "Single zero. Straight pays 35 to 1. Red, black, odd, even, low, and high pay 1 to 1.",
                "Dozens and columns pay 2 to 1. Zero loses all of those.",
                "The ball lands where the wheel stops. Celeste does not nudge it.",
              ]}
            />
            {topics.slice(0, 1).map((topic) => (
              <Button key={topic.id} size="sm" variant="outline" className="bg-black/20" onClick={() => setScreen({ name: "dialogue", sceneId: topic.id, back: { name: "roulette" } })}>
                Talk with Celeste
              </Button>
            ))}
            <Button size="sm" variant="outline" className="bg-black/20" onClick={() => setScreen({ name: "map" })}>Leave</Button>
          </div>
        </div>
        <div className="grid items-center gap-4 lg:grid-cols-[220px_1fr]">
          <div className="relative mx-auto h-52 w-52">
            <div className="absolute top-0 left-1/2 z-10 h-0 w-0 -translate-x-1/2 border-x-8 border-t-[12px] border-x-transparent border-t-[#e4c27a]" />
            <div className="h-full w-full rounded-full shadow-2xl transition-transform duration-[4600ms] ease-[cubic-bezier(.15,.75,.1,1)]" style={{ transform: `rotate(${rotation}deg)` }}>
              <svg viewBox="0 0 100 100" className="h-full w-full">
                {wheel.map((pocket) => {
                  const slice = (Math.PI * 2) / WHEEL.length;
                  const a0 = pocket.index * slice - Math.PI / 2;
                  const a1 = a0 + slice;
                  const r = 48;
                  const path = `M 50 50 L ${50 + r * Math.cos(a0)} ${50 + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${50 + r * Math.cos(a1)} ${50 + r * Math.sin(a1)} Z`;
                  const fill = pocket.number === 0 ? "#0e6b45" : isRed(pocket.number) ? "#9b2438" : "#1b1b1f";
                  return <path key={pocket.number} d={path} fill={fill} stroke="#e4c27a55" />;
                })}
                <circle cx="50" cy="50" r="16" fill="#140c12" stroke="#e4c27a" />
              </svg>
            </div>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-2xl">{result === null ? "" : result}</div>
          </div>
          <div>
            <div className="flex gap-1">
              <button className="w-12 rounded-md bg-emerald-800 text-sm" onClick={() => add({ kind: "straight", n: 0 })}>0{stakeOn(bets, "straight", 0)}</button>
              <div className="grid flex-1 grid-cols-3 gap-1">
                {Array.from({ length: 36 }, (_, index) => index + 1).map((number) => (
                  <button key={number} className={`rounded-md py-1.5 text-sm ${isRed(number) ? "bg-rose-800" : "bg-zinc-900"}`} onClick={() => add({ kind: "straight", n: number })}>
                    {number}
                    {stakeOn(bets, "straight", number)}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1 text-sm">
              {[1, 2, 3].map((dozen) => (
                <button key={dozen} className="rounded-md bg-black/30 py-2" onClick={() => add({ kind: "dozen", n: dozen })}>
                  {dozen === 1 ? "1–12" : dozen === 2 ? "13–24" : "25–36"}
                  {stakeOn(bets, "dozen", dozen)}
                </button>
              ))}
              {(["red", "black", "odd", "even", "low", "high"] as const).map((kind) => (
                <button key={kind} className="rounded-md bg-black/30 py-2 capitalize" onClick={() => add({ kind })}>
                  {kind === "low" ? "1–18" : kind === "high" ? "19–36" : kind}
                  {stakeOn(bets, kind)}
                </button>
              ))}
              {[1, 2, 3].map((column) => (
                <button key={column} className="rounded-md bg-black/30 py-2" onClick={() => add({ kind: "column", n: column })}>
                  Column {column}
                  {stakeOn(bets, "column", column)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {LIMITS.slots.map((value) => (
            <Button key={value} size="sm" variant={chip === value ? "default" : "outline"} className={chip === value ? "" : "bg-black/25"} onClick={() => setChip(value)}>
              {value}
            </Button>
          ))}
          <label className="flex items-center gap-2 text-sm"><Switch checked={practice} onCheckedChange={setPractice} disabled={spinning} /> Practice</label>
          <Button className="h-11" disabled={spinning || bets.length === 0} onClick={spin}>Spin</Button>
          <Button variant="ghost" disabled={spinning} onClick={() => setBets([])}>Clear</Button>
          <span className="text-sm">On layout: {money(total)}</span>
        </div>
        {result !== null && <p className="mt-3 text-sm">The ball rests on {result}. {bets.length === 0 ? "The layout is clear." : ""}</p>}
        {bets.length > 0 && <p className="mt-1 text-xs text-white/70">{bets.map((bet) => `${betLabel(bet)} ${bet.amount}`).join(" · ")}</p>}
      </section>
    </main>
  );
}

function stakeOn(bets: RouletteBet[], kind: RouletteBet["kind"], n?: number) {
  const amount = bets.filter((bet) => bet.kind === kind && bet.n === n).reduce((sum, bet) => sum + bet.amount, 0);
  return amount ? <span className="mt-0.5 block text-[10px] text-[#f0d7a2]">{amount}</span> : null;
}
