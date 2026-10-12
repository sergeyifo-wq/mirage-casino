"use client";

import { jazz } from "@/lib/audio";
import { assetPath } from "@/lib/assets";
import { cleanName, useGame } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function TitleScreen() {
  const { state, dispatch, setScreen, existingSave } = useGame();
  const [name, setName] = useState(state.playerName === "Traveler" ? "" : state.playerName);

  function enter(fresh: boolean) {
    if (fresh) dispatch({ type: "new-game", name: cleanName(name) });
    if (state.music) jazz.start();
    setScreen({ name: "map" });
  }

  return (
    <main
      className="relative min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url("${assetPath("/art/bg-title.jpg")}")` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#120812]/90 via-[#120812]/70 to-[#120812]/25" />
      <div className="title-copy relative mx-auto flex min-h-screen flex-col justify-end px-6 sm:justify-center">
        <p className="text-sm tracking-[0.35em] text-[#e4c27a] uppercase">Casino & Hotel</p>
        <h1 className="font-display text-6xl leading-none text-[#f7f1e6] sm:text-8xl">Midnight Mirage</h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-[#f3e6c8]">
          Velvet, neon, and a jazz that never quite ends. Five tables, a bar that remembers your drink, and people who remember the conversation — not just the pot.
        </p>
        <p className="mt-2 text-sm text-[#f0d7a2]/80">Everyone on the floor is 21 or older. Chips are fictional. Romance is optional, and always yours to decline.</p>
        <div className="mt-8 flex max-w-md flex-col gap-3">
          <label className="text-sm text-[#f6efe4]" htmlFor="guest-name">
            The night remembers a name
          </label>
          <Input
            id="guest-name"
            value={name}
            placeholder="What should they call you?"
            maxLength={18}
            className="h-11 bg-black/40 text-base"
            onChange={(event) => setName(event.target.value)}
          />
          <Button className="h-11" onClick={() => enter(true)}>
            {existingSave ? "Begin a new evening" : "Enter the floor"}
          </Button>
          {existingSave && (
            <Button variant="outline" className="h-11 bg-black/30" onClick={() => enter(false)}>
              Continue as {state.playerName}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
