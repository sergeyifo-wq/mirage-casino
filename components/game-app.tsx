"use client";

import { jazz } from "@/lib/audio";
import { assetPath } from "@/lib/assets";
import { GameProvider, useGame } from "@/lib/store";
import { getScene } from "@/lib/story";
import { useEffect } from "react";
import { BaccaratTable } from "@/components/baccarat-table";
import { BarScreen } from "@/components/bar-screen";
import { BlackjackTable } from "@/components/blackjack-table";
import { JournalScreen } from "@/components/journal-screen";
import { MapScreen } from "@/components/map-screen";
import { PokerTable } from "@/components/poker-table";
import { ProfilesScreen } from "@/components/profiles-screen";
import { RouletteTable } from "@/components/roulette-table";
import { ScenePlayer } from "@/components/scene-player";
import { SlotsTable } from "@/components/slots-table";
import { SuiteScreen } from "@/components/suite-screen";
import { TitleScreen } from "@/components/title-screen";
import { NoticeToast, TopBar } from "@/components/widgets";

export function GameApp() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  );
}

function Shell() {
  const game = useGame();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [game.screen.name]);
  useEffect(() => {
    if (game.ready) jazz.set(game.state.music);
  }, [game.ready, game.state.music]);

  if (!game.ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#120812] text-[#f0d7a2]">
        <p className="font-display text-3xl">The chandeliers are warming.</p>
      </div>
    );
  }

  const screen = game.screen;
  let view = <MapScreen />;
  if (screen.name === "title") view = <TitleScreen />;
  else if (screen.name === "map") view = <MapScreen />;
  else if (screen.name === "blackjack") view = <BlackjackTable />;
  else if (screen.name === "poker") view = <PokerTable />;
  else if (screen.name === "roulette") view = <RouletteTable />;
  else if (screen.name === "slots") view = <SlotsTable />;
  else if (screen.name === "baccarat") view = <BaccaratTable />;
  else if (screen.name === "bar") view = <BarScreen />;
  else if (screen.name === "suite") view = <SuiteScreen />;
  else if (screen.name === "journal") view = <JournalScreen />;
  else if (screen.name === "profiles") view = <ProfilesScreen />;
  else if (screen.name === "dialogue") {
    const scene = getScene(screen.sceneId);
    view = scene ? (
      <ScenePlayer
        scene={scene}
        onClose={() => game.setScreen(screen.back)}
        onAccept={(id) => game.setScreen({ name: "hotel", characterId: id, sceneId: `hotel-${id}` })}
      />
    ) : (
      <MapScreen />
    );
  } else if (screen.name === "hotel") {
    const scene = getScene(screen.sceneId);
    view = scene ? (
      <div className="scene-scrim min-h-[calc(100vh-64px)]" style={{ ["--scene" as string]: `url("${assetPath("/art/bg-suite.jpg")}")` }}>
        <ScenePlayer scene={scene} onClose={() => game.setScreen({ name: "map" })} />
      </div>
    ) : (
      <MapScreen />
    );
  }

  return (
    <div data-theme={game.state.theme} className="casino-shell min-h-screen text-[#f6efe4]">
      {screen.name !== "title" && <TopBar />}
      {view}
      <NoticeToast />
    </div>
  );
}
