"use client";

import { CHARACTERS, portraitSrc } from "@/lib/characters";
import { choiceVisible, fillName } from "@/lib/story";
import { useGame } from "@/lib/store";
import type { CharacterId, Scene, ScriptChoice } from "@/lib/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TONE_LABEL } from "@/lib/banter";

export function ScenePlayer({
  scene,
  onClose,
  onAccept,
}: {
  scene: Scene;
  onClose: () => void;
  onAccept?: (id: CharacterId) => void;
}) {
  const { state, dispatch } = useGame();
  const [nodeId, setNodeId] = useState(scene.entry);
  const node = scene.nodes[nodeId];
  if (!node) {
    return (
      <div className="p-6">
        <Button onClick={onClose}>Return</Button>
      </div>
    );
  }
  const speaker = node.speaker === "narration" || node.speaker === "you" ? null : CHARACTERS[node.speaker];
  const choices = (node.choices ?? []).filter((choice) => choiceVisible(choice, state, scene.characterId));

  function pick(choice: ScriptChoice) {
    dispatch({
      type: "choice",
      sceneId: scene.id,
      characterId: scene.characterId,
      affects: scene.affects,
      tone: choice.tone,
      effects: choice.effects,
      choiceId: choice.id,
      place: scene.place,
    });
    if (choice.effects?.acceptInvite && onAccept) {
      onAccept(scene.characterId);
      return;
    }
    if (choice.next && scene.nodes[choice.next]) setNodeId(choice.next);
    else onClose();
  }

  const outfit =
    scene.place === "hotel" || scene.place === "encore"
      ? "evening"
      : state.outfits[scene.characterId] ?? "uniform";

  return (
    <div className="mx-auto grid max-w-4xl gap-4 p-4 lg:grid-cols-[240px_1fr]">
      <div>
        {speaker ? (
          <img
            src={portraitSrc(speaker.id, speaker.id === scene.characterId ? outfit : "uniform")}
            alt={`${speaker.name}, age ${speaker.age}`}
            className="portrait-frame aspect-[3/4] w-full rounded-2xl object-cover"
          />
        ) : (
          <div className="rounded-2xl border border-[#e4c27a]/30 bg-black/30 p-4 text-sm text-[#f0d7a2]">The room</div>
        )}
        {speaker && (
          <div className="mt-3">
            <div className="font-display text-2xl">{speaker.name}</div>
            <div className="text-sm text-[#e4c27a]/80">Age {speaker.age} · {speaker.role}</div>
          </div>
        )}
      </div>
      <div className="flex min-h-[320px] flex-col rounded-3xl border border-white/10 bg-black/45 p-5">
        <p className={`text-lg leading-8 ${node.speaker === "narration" ? "text-[#f0d7a2] italic" : "text-[#f7f1e6]"}`}>
          {fillName(node.text, state.playerName)}
        </p>
        <div className="mt-auto flex flex-col gap-2 pt-6">
          {choices.map((choice) => (
            <Button key={choice.id} variant="outline" className="h-auto justify-start bg-black/20 px-4 py-3 text-left whitespace-normal" onClick={() => pick(choice)}>
              <span className="mr-2 text-xs tracking-wide text-[#e4c27a] uppercase">
                {choice.tone === "leave" ? "Leave" : TONE_LABEL[choice.tone]}
              </span>
              {fillName(choice.text, state.playerName)}
            </Button>
          ))}
          {!choices.length && node.next && (
            <Button onClick={() => setNodeId(node.next!)}>Continue</Button>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              const upstairs = scene.place === "hotel" || scene.place === "encore";
              if (upstairs && nodeId !== scene.entry) dispatch({ type: "excuse", id: scene.characterId });
              onClose();
            }}
          >
            {scene.place === "hotel" || scene.place === "encore" ? "Excuse yourself" : "Step away"}
          </Button>
        </div>
      </div>
    </div>
  );
}
