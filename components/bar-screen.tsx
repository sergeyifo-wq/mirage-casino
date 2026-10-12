"use client";

import { CHARACTERS } from "@/lib/characters";
import { assetPath } from "@/lib/assets";
import { DRINKS, barPatrons } from "@/lib/presence";
import { checkInScene, getScene, groupSceneAvailable, topicsFor } from "@/lib/story";
import { useGame } from "@/lib/store";
import type { CharacterId } from "@/lib/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Portrait, StageBadge, money } from "@/components/widgets";
import { ScenePlayer } from "@/components/scene-player";

export function BarScreen() {
  const { state, dispatch, setScreen } = useGame();
  const patrons = barPatrons(state.time);
  const [seat, setSeat] = useState<CharacterId>(patrons[0]);
  const [mode, setMode] = useState<"browse" | "scene">("browse");
  const [sceneId, setSceneId] = useState<string | null>(null);
  const group = groupSceneAvailable(state);
  const active = patrons.includes(seat) ? seat : patrons[0];
  const scene = sceneId === "checkin" ? checkInScene(state, active) : sceneId ? getScene(sceneId) : undefined;

  if (mode === "scene" && scene) {
    return (
      <main className="scene-scrim min-h-[calc(100vh-64px)]" style={{ ["--scene" as string]: `url("${assetPath("/art/bg-bar.jpg")}")` }}>
        <ScenePlayer
          scene={scene}
          onClose={() => {
            setMode("browse");
            setSceneId(null);
          }}
          onAccept={(id) => setScreen({ name: "hotel", characterId: id, sceneId: `hotel-${id}` })}
        />
      </main>
    );
  }

  const topics = topicsFor(state, active, "bar").concat(active === "aoi" ? topicsFor(state, active, "lobby") : []);

  return (
    <main className="scene-scrim min-h-[calc(100vh-64px)]" style={{ ["--scene" as string]: `url("${assetPath("/art/bg-bar.jpg")}")` }}>
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl border border-white/10 bg-black/55 p-3">
          <h2 className="font-display px-2 text-3xl">Stools</h2>
          <div className="mt-2 flex flex-col gap-2">
            {patrons.map((id) => (
              <button
                key={id}
                className={`flex items-center gap-3 rounded-2xl p-2 text-left ${id === active ? "bg-[#e4c27a]/15 ring-1 ring-[#e4c27a]/50" : "hover:bg-white/5"}`}
                onClick={() => setSeat(id)}
              >
                <Portrait id={id} className="h-16 w-14 rounded-xl" />
                <span>
                  <span className="block font-display text-xl">{CHARACTERS[id].name}</span>
                  <span className="text-xs text-[#f0d7a2]/80">{CHARACTERS[id].role} · {CHARACTERS[id].age}</span>
                </span>
              </button>
            ))}
          </div>
        </aside>
        <section className="rounded-3xl border border-white/10 bg-black/55 p-4">
          {group && (
            <div className="mb-4 rounded-2xl border border-[#ff8fb7]/30 bg-[#2a1022]/70 p-3">
              <p className="text-sm">Akari, Hana, and Rin are already arguing about bluffs. Iris is refereeing.</p>
              <Button className="mt-2" size="sm" onClick={() => { setSceneId("group-bluff"); setMode("scene"); }}>
                Join the conversation
              </Button>
            </div>
          )}
          <div className="flex flex-wrap items-start gap-4">
            <Portrait id={active} outfit={state.outfits[active] ?? "uniform"} className="h-40 w-32 rounded-2xl" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-4xl">{CHARACTERS[active].name}</h2>
                <StageBadge id={active} />
              </div>
              <p className="mt-1 max-w-xl text-sm leading-6">{CHARACTERS[active].tagline}</p>
              <p className="mt-2 text-sm text-[#e4c27a]">Favorite glass: {CHARACTERS[active].favoriteDrink}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => { setSceneId("checkin"); setMode("scene"); }}>Sit and talk</Button>
            {topics.map((topic) => (
              <Button key={topic.id} variant="outline" className="bg-black/25" onClick={() => { setSceneId(topic.id); setMode("scene"); }}>
                {topic.title}
              </Button>
            ))}
          </div>
          <h3 className="mt-6 font-display text-2xl">The rail</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {DRINKS.map((drink) => (
              <button
                key={drink.id}
                className="rounded-2xl border border-white/10 bg-black/30 p-3 text-left disabled:opacity-40"
                disabled={state.chips < drink.price}
                onClick={() => {
                  dispatch({ type: "drink", drinkId: drink.id, with: active });
                }}
              >
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{drink.name}</span>
                  <span className="text-[#e4c27a]">{money(drink.price)}</span>
                </div>
                <p className="mt-1 text-sm text-[#f6efe4]/80">{drink.blurb}</p>
                {drink.likes.includes(active) && <p className="mt-1 text-xs text-[#ffd0e0]">A favorite of the person beside you.</p>}
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
