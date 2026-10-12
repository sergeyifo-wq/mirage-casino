"use client";

import { CHARACTERS } from "@/lib/characters";
import { assetPath } from "@/lib/assets";
import {
  TIME_META,
  advanceTime,
  aoiLine,
  barPatrons,
  blackjackOpponents,
  pokerOpponents,
  roomLine,
} from "@/lib/presence";
import { inviteHint } from "@/lib/progress";
import { useGame } from "@/lib/store";
import type { CharacterId, GameId } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Portrait } from "@/components/widgets";
import {
  ArrowUpRight,
  Club,
  Diamond,
  Martini,
  Sparkles,
  Spade,
  Target,
} from "lucide-react";
import styles from "./map-screen.module.css";

const ROOM_DETAILS = {
  blackjack: {
    tag: "The twenty-one club",
    detail: "3:2 blackjack · Dealer stands on 17",
    icon: Spade,
  },
  poker: {
    tag: "A seat at the velvet table",
    detail: "Texas hold’em · 5 / 10 blinds",
    icon: Club,
  },
  roulette: {
    tag: "A little theater, in motion",
    detail: "European wheel · Single zero",
    icon: Target,
  },
  slots: {
    tag: "The midnight collection",
    detail: "Mirage Reels · Five paylines",
    icon: Sparkles,
  },
  baccarat: {
    tag: "The art of a quiet wager",
    detail: "Punto banco · Player, banker, tie",
    icon: Diamond,
  },
};

const ROOMS: {
  id: GameId;
  title: string;
  host: CharacterId;
  screen: "blackjack" | "poker" | "roulette" | "slots" | "baccarat";
}[] = [
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
    if (game === "blackjack")
      return ["reina", ...blackjackOpponents(state.time)];
    if (game === "poker") return ["akari", ...pokerOpponents(state.time)];
    if (game === "roulette") return ["celeste"];
    if (game === "slots") return state.time === "after" ? [] : ["mika"];
    return ["shiori"];
  };

  return (
    <main
      className="relative min-h-[calc(100vh-64px)] bg-cover bg-center"
      style={{ backgroundImage: `url("${assetPath("/art/bg-floor.jpg")}")` }}
    >
      <div className={styles.scrim} />
      <div
        className={`relative mx-auto max-w-[1440px] px-4 py-8 sm:px-6 ${styles.floor}`}
      >
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className={styles.eyebrow}>Midnight Mirage · {time.label}</p>
            <h2 className={styles.floorTitle}>The night is yours.</h2>
            <p className="max-w-xl text-sm leading-6 text-[#f3e6c8]/90">
              {time.blurb}
            </p>
          </div>
          <Button
            variant="outline"
            className="bg-black/30"
            disabled={!next}
            onClick={() => dispatch({ type: "advance-time" })}
          >
            {next
              ? `Let the night move toward ${TIME_META[next].label.toLowerCase()}`
              : "The night is as late as it gets"}
          </Button>
        </div>

        <section className={`${styles.concierge} mb-6 sm:flex sm:gap-4`}>
          <Portrait id="aoi" className="mb-3 h-28 w-24 rounded-2xl sm:mb-0" />
          <div>
            <div className="font-display text-2xl">Aoi · Concierge · 27</div>
            <p className="mt-1 text-sm leading-6 text-[#f6efe4]">
              {aoiLine(state)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-black/30"
                onClick={() =>
                  setScreen({
                    name: "dialogue",
                    sceneId: "lobby-aoi",
                    back: { name: "map" },
                  })
                }
              >
                Speak with Aoi
              </Button>
              <Button size="sm" onClick={() => setScreen({ name: "suite" })}>
                Your suite
              </Button>
              {state.chips < 10 && state.courtesyEvening !== state.evening && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => dispatch({ type: "courtesy" })}
                >
                  Accept 200 courtesy chips
                </Button>
              )}
            </div>
          </div>
        </section>

        {state.pendingInvites.length > 0 && (
          <section className="mb-4 rounded-3xl border border-[#ff8fb7]/40 bg-[#2a1022]/80 p-4">
            <h3 className="font-display text-2xl text-[#ffd0e0]">
              Notes at the desk
            </h3>
            <div className="mt-3 flex flex-col gap-2">
              {state.pendingInvites.map((id) => (
                <div key={id} className="flex flex-wrap items-center gap-3">
                  <Portrait id={id} className="h-14 w-12 rounded-lg" />
                  <p className="text-sm">
                    {CHARACTERS[id].name} left an invitation. Chips will not
                    open this door. The conversation might.
                  </p>
                  <Button
                    size="sm"
                    onClick={() =>
                      setScreen({
                        name: "dialogue",
                        sceneId: `invite-${id}`,
                        back: { name: "map" },
                      })
                    }
                  >
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
                      sceneId:
                        state.relationships[id].visitedEvening > 0
                          ? `encore-${id}`
                          : `hotel-${id}`,
                    })
                  }
                >
                  Visit {CHARACTERS[id].name}
                </Button>
              ))}
            </div>
          </section>
        )}

        <div className={styles.collectionHeading}>
          <span>Choose your table</span>
          <span>01 — 05 / The evening collection</span>
        </div>
        <div className={styles.roomGrid}>
          {ROOMS.map((room, index) => {
            const faces = present(room.id);
            const hint = inviteHint(state, room.host);
            const detail = ROOM_DETAILS[room.id];
            const Icon = detail.icon;
            return (
              <button
                key={room.id}
                className={styles.room}
                aria-label={`Open ${room.title} with ${CHARACTERS[room.host].name}`}
                onClick={() => setScreen({ name: room.screen })}
              >
                <Portrait
                  id={room.host}
                  className={styles.roomPortrait}
                  ring={false}
                />
                <div className={styles.roomShade} />
                <div className={styles.roomTop}>
                  <span>0{index + 1}</span>
                  <Icon size={22} strokeWidth={1.2} />
                </div>
                <div className={styles.roomContent}>
                  <div className={styles.eyebrow}>{detail.tag}</div>
                  <div className={styles.roomTitle}>{room.title}</div>
                  <p className={styles.roomDetail}>
                    {detail.detail} · {CHARACTERS[room.host].name}
                  </p>
                  <p className="mt-1 min-h-12 text-sm leading-6 text-[#f6efe4]/90">
                    {roomLine(room.id, state.time)}
                  </p>
                  <div className="mt-3 flex -space-x-2">
                    {faces.map((id) => (
                      <Portrait
                        key={id}
                        id={id}
                        className="h-12 w-10 rounded-lg ring-2 ring-[#120812]"
                      />
                    ))}
                    {faces.length === 0 && (
                      <span className="text-sm text-[#f0d7a2]/70">
                        The cabinet is still lit.
                      </span>
                    )}
                  </div>
                  {hint && (
                    <p className="mt-3 text-xs leading-5 text-[#ffd0e0]">
                      {hint}
                    </p>
                  )}
                  <div className={styles.enter}>
                    Take a seat <ArrowUpRight size={17} />
                  </div>
                </div>
              </button>
            );
          })}
          <button
            className={`${styles.room} ${styles.bar}`}
            aria-label="Visit the bar with Iris"
            onClick={() => setScreen({ name: "bar" })}
          >
            <Portrait id="iris" className={styles.roomPortrait} ring={false} />
            <div className={styles.roomShade} />
            <div className={styles.roomTop}>
              <span>06</span>
              <Martini size={22} strokeWidth={1.2} />
            </div>
            <div className={styles.roomContent}>
              <div className={styles.eyebrow}>One more conversation</div>
              <div className={styles.roomTitle}>The bar</div>
              <p className={styles.roomDetail}>
                A seat beside Iris · Jazz until late
              </p>
              <p className="mt-1 text-sm leading-6">
                Sit beside someone, order a drink, or walk into a conversation
                already underway.
              </p>
              <div className="mt-3 flex -space-x-2">
                {barPatrons(state.time).map((id) => (
                  <Portrait
                    key={id}
                    id={id}
                    className="h-12 w-10 rounded-lg ring-2 ring-[#120812]"
                  />
                ))}
              </div>
              <div className={styles.enter}>
                Stay a little longer <ArrowUpRight size={17} />
              </div>
            </div>
          </button>
        </div>
      </div>
    </main>
  );
}
