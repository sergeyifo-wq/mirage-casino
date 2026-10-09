"use client";

import { CHARACTERS } from "@/lib/characters";
import { TIME_META, advanceTime, aoiLine, barPatrons, blackjackOpponents, pokerOpponents, roomLine } from "@/lib/presence";
import { inviteHint } from "@/lib/progress";
import { useGame } from "@/lib/store";
import type { CharacterId, GameId } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Portrait } from "@/components/widgets";

const ROOMS: { id: GameId; title: string; host: CharacterId; screen: "blackjack" | "poker" | "roulette" | "slots" | "baccarat" }[] = [
  { id: "blackjack", title: "Blackjack", host: "reina", screen: "blackjack" },
  { id: "poker", title: "Poker", host: "akari", screen: "poker" },
  { id: "roulette", title: "Roulette", host: "celeste", screen: "roulette" },
  { id: "slots", title: "Slots", host: "mika", screen: "slots" },
  { id: "baccarat", title: "Baccarat", host: "shiori", screen: "baccarat" },
];

export function MapScreen() {
  const { state, dispatch, setScreen } = useGame();
  const time = TIME_META[state.time];
  const next = advanceTime(state.time);
  const present = (game: GameId): CharacterId[] => {
    if (game === "blackjack") return ["reina", ...blackjackOpponents(state.time)];
    if (game === "poker") return ["akari", ...pokerOpponents(state.time)];
    if (game === "roulette") return ["celeste"];
    if (game === "slots") return state.time === "after" ? [] : ["mika"];
    return ["shiori"];
  };

  return (
    <main className="relative min-h-[calc(100vh-64px)] bg-cover bg-center" style={{ backgroundImage: "url(/art/bg-floor.jpg)" }}>
      <div className="absolute inset-0 bg-[#120812]/72" />
      <div className="relative mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.28em] text-[#e4c27a] uppercase">{time.label}</p>
            <h2 className="font-display text-4xl text-[#f7f1e6] sm:text-5xl">The floor</h2>
            <p className="max-w-xl text-sm leading-6 text-[#f3e6c8]/90">{time.blurb}</p>
          </div>
          <Button
            variant="outline"
            className="bg-black/30"
            disabled={!next}
            onClick={() => dispatch({ type: "advance-time" })}
          >
            {next ? `Let the night move toward ${TIME_META[next].label.toLowerCase()}` : "The night is as late as it gets"}
          </Button>
        </div>

        <section className="mb-4 rounded-3xl border border-[#e4c27a]/30 bg-black/50 p-4 sm:flex sm:gap-4">
          <Portrait id="aoi" className="mb-3 h-28 w-24 rounded-2xl sm:mb-0" />
          <div>
            <div className="font-display text-2xl">Aoi · Concierge · 27</div>
            <p className="mt-1 text-sm leading-6 text-[#f6efe4]">{aoiLine(state)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="bg-black/30" onClick={() => setScreen({ name: "dialogue", sceneId: "lobby-aoi", back: { name: "map" } })}>
                Speak with Aoi
              </Button>
              <Button size="sm" onClick={() => setScreen({ name: "suite" })}>Your suite</Button>
              {state.chips < 10 && state.courtesyEvening !== state.evening && (
                <Button size="sm" variant="secondary" onClick={() => dispatch({ type: "courtesy" })}>
                  Accept 200 courtesy chips
                </Button>
              )}
            </div>
          </div>
        </section>

        {state.pendingInvites.length > 0 && (
          <section className="mb-4 rounded-3xl border border-[#ff8fb7]/40 bg-[#2a1022]/80 p-4">
            <h3 className="font-display text-2xl text-[#ffd0e0]">Notes at the desk</h3>
            <div className="mt-3 flex flex-col gap-2">
              {state.pendingInvites.map((id) => (
                <div key={id} className="flex flex-wrap items-center gap-3">
                  <Portrait id={id} className="h-14 w-12 rounded-lg" />
                  <p className="text-sm">{CHARACTERS[id].name} left an invitation. Chips will not open this door. The conversation might.</p>
                  <Button size="sm" onClick={() => setScreen({ name: "dialogue", sceneId: `invite-${id}`, back: { name: "map" } })}>
                    Read it
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {state.openDoors.length > 0 && (
          <section className="mb-4 rounded-3xl border border-[#e4c27a]/30 bg-black/50 p-4">
            <h3 className="font-display text-2xl">Doors open tonight</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {state.openDoors.map((id) => (
                <Button
                  key={id}
                  variant="outline"
                  className="bg-black/30"
                  onClick={() =>
                    setScreen({
                      name: "hotel",
                      characterId: id,
                      sceneId: state.relationships[id].visitedEvening > 0 ? `encore-${id}` : `hotel-${id}`,
                    })
                  }
                >
                  Visit {CHARACTERS[id].name}
                </Button>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ROOMS.map((room) => {
            const faces = present(room.id);
            const hint = inviteHint(state, room.host);
            return (
              <button
                key={room.id}
                className="rounded-3xl border border-white/10 bg-black/55 p-4 text-left transition hover:border-[#e4c27a]/60"
                onClick={() => setScreen({ name: room.screen })}
              >
                <div className="text-xs tracking-[0.22em] text-[#e4c27a] uppercase">{room.title}</div>
                <div className="font-display text-3xl">{CHARACTERS[room.host].name}</div>
                <p className="mt-1 min-h-12 text-sm leading-6 text-[#f6efe4]/90">{roomLine(room.id, state.time)}</p>
                <div className="mt-3 flex -space-x-2">
                  {faces.map((id) => (
                    <Portrait key={id} id={id} className="h-12 w-10 rounded-lg ring-2 ring-[#120812]" />
                  ))}
                  {faces.length === 0 && <span className="text-sm text-[#f0d7a2]/70">The cabinet is still lit.</span>}
                </div>
                {hint && <p className="mt-3 text-xs leading-5 text-[#ffd0e0]">{hint}</p>}
              </button>
            );
          })}
          <button className="rounded-3xl border border-white/10 bg-black/55 p-4 text-left transition hover:border-[#e4c27a]/60" onClick={() => setScreen({ name: "bar" })}>
            <div className="text-xs tracking-[0.22em] text-[#e4c27a] uppercase">The bar</div>
            <div className="font-display text-3xl">Iris</div>
            <p className="mt-1 text-sm leading-6">Sit beside someone, order a drink, or walk into a conversation already underway.</p>
            <div className="mt-3 flex -space-x-2">
              {barPatrons(state.time).map((id) => (
                <Portrait key={id} id={id} className="h-12 w-10 rounded-lg ring-2 ring-[#120812]" />
              ))}
            </div>
          </button>
        </div>
      </div>
    </main>
  );
}
