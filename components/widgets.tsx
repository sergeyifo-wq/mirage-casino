"use client";

import { CHARACTERS, portraitSrc, stageName } from "@/lib/characters";
import { isRedSuit, rankLabel, suitSymbol, type Card } from "@/lib/cards";
import { TIME_META } from "@/lib/presence";
import { useGame } from "@/lib/store";
import type { CharacterId, OutfitId, Tone } from "@/lib/types";
import { TONE_LABEL, toneReply } from "@/lib/banter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { BookOpen, Coins, Moon, Music, Spade, Users, VolumeX } from "lucide-react";

export function money(value: number): string {
  return value.toLocaleString("en-US");
}

export function Portrait({
  id,
  outfit = "uniform",
  className = "",
  ring = true,
}: {
  id: CharacterId;
  outfit?: OutfitId;
  className?: string;
  ring?: boolean;
}) {
  const character = CHARACTERS[id];
  return (
    <img
      src={portraitSrc(id, outfit)}
      alt={`${character.name}, age ${character.age}`}
      className={`${ring ? "portrait-frame" : ""} object-cover ${className}`}
    />
  );
}

export function PlayingCard({ card, hidden = false, delay = 0 }: { card?: Card; hidden?: boolean; delay?: number }) {
  if (hidden || !card) {
    return <div className="card-back h-24 w-[4.2rem] rounded-lg border border-(--rim)/50 shadow-lg sm:h-28 sm:w-20" aria-label="Face-down card" />;
  }
  const red = isRedSuit(card.suit);
  const color = red ? "text-rose-700" : "text-slate-900";
  return (
    <div
      className={`deal-in flex h-24 w-[4.2rem] flex-col justify-between rounded-lg border border-black/10 bg-[#f6f0e4] p-1.5 shadow-lg sm:h-28 sm:w-20 ${color}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="text-xs font-semibold sm:text-sm">
        {rankLabel(card.rank)}
        {suitSymbol(card.suit)}
      </span>
      <span className="self-center text-2xl leading-none">{suitSymbol(card.suit)}</span>
      <span className="rotate-180 self-end text-xs font-semibold sm:text-sm">
        {rankLabel(card.rank)}
        {suitSymbol(card.suit)}
      </span>
    </div>
  );
}

export function TopBar() {
  const { state, setScreen, dispatch } = useGame();
  const time = TIME_META[state.time];
  return (
    <header className="sticky top-0 z-30 border-b border-(--rim)/30 bg-[#120812]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-3 py-2 sm:px-4">
        <button className="font-display text-xl text-[#f0d7a2] sm:text-2xl" onClick={() => setScreen({ name: "map" })}>
          Midnight Mirage
        </button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="h-7 border-[#e4c27a]/40 bg-black/30 text-[#f6efe4]">
            <Moon className="size-3.5" /> Night {state.evening} · {time.clock}
          </Badge>
          <Badge className="h-7 bg-[#e4c27a] text-[#2a1608]">
            <Coins className="size-3.5" /> {money(state.chips)}
          </Badge>
          <Button variant="outline" size="sm" className="h-8 bg-black/20" onClick={() => setScreen({ name: "journal" })}>
            <BookOpen /> Journal
          </Button>
          <Button variant="outline" size="sm" className="h-8 bg-black/20" onClick={() => setScreen({ name: "profiles" })}>
            <Users /> People
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={state.music ? "Mute jazz" : "Play jazz"}
            onClick={() => dispatch({ type: "toggle-music" })}
          >
            {state.music ? <Music /> : <VolumeX />}
          </Button>
          <Button variant="outline" size="sm" className="h-8 bg-black/20" onClick={() => setScreen({ name: "map" })}>
            <Spade /> Floor
          </Button>
        </div>
      </div>
    </header>
  );
}

export function Tutorial({ id, title, bullets }: { id: string; title: string; bullets: string[] }) {
  const { state, dispatch } = useGame();
  return (
    <Dialog open={!state.tutorialsSeen[id]} onOpenChange={(open) => { if (!open) dispatch({ type: "tutorial", id }); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
          <DialogDescription>A quick briefing. The rules stay available from the table.</DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm leading-6">
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
        <Button onClick={() => dispatch({ type: "tutorial", id })}>Deal me in</Button>
      </DialogContent>
    </Dialog>
  );
}

export function RulesButton({ title, body }: { title: string; body: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" className="bg-black/25" onClick={() => setOpen(true)}>
        Rules
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
            <DialogDescription>House rules for this table.</DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm leading-6">
            {body.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Stepper({
  value,
  min,
  max,
  step,
  onChange,
  disabled,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" className="bg-black/25" disabled={disabled || value <= min} onClick={() => onChange(Math.max(min, value - step))}>
        −
      </Button>
      <span className="min-w-16 text-center font-display text-3xl text-white">{money(value)}</span>
      <Button variant="outline" className="bg-black/25" disabled={disabled || value >= max} onClick={() => onChange(Math.min(max, value + step))}>
        +
      </Button>
    </div>
  );
}

export function StageBadge({ id }: { id: CharacterId }) {
  const rel = useGame().state.relationships[id];
  return <Badge variant="secondary">{stageName(rel.affinity, rel.romance)}</Badge>;
}

export function HostRail({ host, line, aside }: { host: CharacterId; line: string; aside?: string }) {
  return <HostRailBody key={line} host={host} line={line} aside={aside} />;
}

function HostRailBody({ host, line, aside }: { host: CharacterId; line: string; aside?: string }) {
  const { state, dispatch } = useGame();
  const [answered, setAnswered] = useState<string | null>(null);
  const outfit = state.outfits[host] ?? "uniform";
  const tones: Exclude<Tone, "leave">[] = ["friendly", "humorous", "curious", "flirtatious"];
  return (
    <aside className="rounded-3xl border border-white/10 bg-black/50 p-3">
      <Portrait id={host} outfit={outfit} className="aspect-[3/4] w-full rounded-2xl" />
      <div className="mt-2 font-display text-2xl">{CHARACTERS[host].name}</div>
      <p className="text-xs text-[#e4c27a]">{CHARACTERS[host].role} · {CHARACTERS[host].age}</p>
      {aside && <p className="mt-1 text-xs leading-5 text-[#f6efe4]/70">{aside}</p>}
      <p className="mt-3 text-sm leading-6">{answered ?? line}</p>
      {!answered && (
        <div className="mt-3 flex flex-wrap gap-1">
          {tones.map((tone) => (
            <Button
              key={tone}
              size="sm"
              variant="outline"
              className="bg-black/30"
              onClick={() => {
                dispatch({ type: "reply", id: host, tone });
                setAnswered(toneReply(host, tone));
              }}
            >
              {TONE_LABEL[tone]}
            </Button>
          ))}
        </div>
      )}
    </aside>
  );
}

export function NoticeToast() {
  const { notice } = useGame();
  if (!notice) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-50 max-w-sm -translate-x-1/2 rounded-full border border-[#e4c27a]/40 bg-[#1a1020]/95 px-4 py-2 text-center text-sm text-[#f6efe4] shadow-xl">
      {notice}
    </div>
  );
}
