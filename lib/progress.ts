import { CHARACTERS, ROMANCE_IDS, STORY_FLAG, type CharacterDef } from "@/lib/characters";
import type { CharacterId, GameId, Relationship, Romance, SaveState, ThemeId, TimeOfNight, Tone } from "@/lib/types";

export const STARTING_CHIPS = 1000;

type Rule = {
  affinity: number;
  flag: string;
  memories: number;
  conversations: number;
  sessions: number;
  times: TimeOfNight[];
  likesNeeded: number;
};

const RULES: Record<Exclude<CharacterId, "aoi">, Rule> = {
  reina: { affinity: 42, flag: STORY_FLAG.reina, memories: 2, conversations: 2, sessions: 1, times: ["late", "after"], likesNeeded: 2 },
  akari: { affinity: 40, flag: STORY_FLAG.akari, memories: 2, conversations: 2, sessions: 1, times: ["prime", "late"], likesNeeded: 2 },
  celeste: { affinity: 44, flag: STORY_FLAG.celeste, memories: 2, conversations: 2, sessions: 1, times: ["late", "after"], likesNeeded: 2 },
  mika: { affinity: 38, flag: STORY_FLAG.mika, memories: 2, conversations: 2, sessions: 1, times: ["early", "prime"], likesNeeded: 2 },
  shiori: { affinity: 52, flag: STORY_FLAG.shiori, memories: 2, conversations: 2, sessions: 1, times: ["late", "after"], likesNeeded: 2 },
  iris: { affinity: 40, flag: STORY_FLAG.iris, memories: 2, conversations: 2, sessions: 0, times: ["after"], likesNeeded: 2 },
  naomi: { affinity: 46, flag: STORY_FLAG.naomi, memories: 2, conversations: 2, sessions: 1, times: ["late"], likesNeeded: 2 },
  yuki: { affinity: 40, flag: STORY_FLAG.yuki, memories: 2, conversations: 2, sessions: 1, times: ["prime", "late"], likesNeeded: 2 },
  hana: { affinity: 44, flag: STORY_FLAG.hana, memories: 2, conversations: 2, sessions: 1, times: ["prime", "late"], likesNeeded: 2 },
  rin: { affinity: 56, flag: STORY_FLAG.rin, memories: 2, conversations: 3, sessions: 1, times: ["after"], likesNeeded: 2 },
};

export function blankRelationship(): Relationship {
  return {
    affinity: 0,
    memories: [],
    tones: { friendly: 0, humorous: 0, curious: 0, flirtatious: 0, leave: 0 },
    conversations: 0,
    realSessions: 0,
    romance: "none",
    declinedUntil: 0,
    visitedEvening: 0,
  };
}

export function rapportDelta(id: CharacterId, tone: Tone, affinity: number): number {
  if (tone === "leave") return 0;
  const character: CharacterDef = CHARACTERS[id];
  if (id === "aoi" && tone === "flirtatious") return 0;
  if (id === "reina" && tone === "flirtatious" && affinity < 24) return 0;
  if (character.dislikesEarly.includes(tone) && affinity < 24) return -1;
  let delta = character.likes.includes(tone) ? 3 : 1;
  if (tone === "flirtatious" && affinity >= 40 && character.likes.includes("flirtatious")) delta += 1;
  return delta;
}

export function likedToneCount(id: CharacterId, rel: Relationship): number {
  return CHARACTERS[id].likes.reduce((sum, tone) => sum + rel.tones[tone], 0);
}

function affinityNeeded(state: SaveState, id: Exclude<CharacterId, "aoi">): number {
  const rule = RULES[id];
  if (id === "shiori" && state.flags.shiori_rushed) return 68;
  return rule.affinity;
}

export function gateExceptTime(state: SaveState, id: CharacterId): boolean {
  if (id === "aoi") return false;
  const rule = RULES[id];
  const rel = state.relationships[id];
  if (!state.flags[rule.flag]) return false;
  if (rel.memories.length < rule.memories) return false;
  if (rel.conversations < rule.conversations) return false;
  const lucky = Boolean(state.flags[`lucky_${id}`]);
  if (rel.realSessions < rule.sessions && !lucky) return false;
  if (rel.affinity < affinityNeeded(state, id)) return false;
  if (likedToneCount(id, rel) < rule.likesNeeded) return false;
  return true;
}

export function canInvite(state: SaveState, id: CharacterId): boolean {
  if (id === "aoi") return false;
  if (!gateExceptTime(state, id)) return false;
  const lucky = Boolean(state.flags[`lucky_${id}`]);
  return lucky || RULES[id].times.includes(state.time);
}

export function inviteHint(state: SaveState, id: CharacterId): string | null {
  if (id === "aoi") return null;
  const rel = state.relationships[id];
  if (rel.romance === "pending" || rel.romance === "close" || rel.romance === "accepted") return null;
  if (!gateExceptTime(state, id)) return null;
  if (RULES[id].times.includes(state.time)) return null;
  const when = RULES[id].times.map((time) => time.replace("early", "early evening").replace("prime", "prime time").replace("late", "late night").replace("after", "after hours")).join(" or ");
  return `${CHARACTERS[id].name} seems to have something private to say during ${when}.`;
}

export function romanceBlockedReason(state: SaveState, id: CharacterId): string | null {
  if (id === "aoi") return "Aoi keeps the doors. She is a friend of the house, not a prize upstairs.";
  const rel = state.relationships[id];
  if (rel.romance === "close") return "You already share an easy privacy. Another evening, the door can open again.";
  if (!state.flags[RULES[id].flag]) return "Winning the table will not open this door. She is waiting on a real conversation.";
  if (likedToneCount(id, rel) < RULES[id].likesNeeded) return "The tone between you is still off. She responds to a particular kind of attention.";
  if (rel.realSessions < RULES[id].sessions && !state.flags[`lucky_${id}`]) return "Talk is part of it. So is actually sitting at her table, with chips that count.";
  return null;
}

export function derive(state: SaveState): SaveState {
  const unlockedThemes = new Set<ThemeId>(state.unlockedThemes);
  unlockedThemes.add("velvet");
  const games: GameId[] = ["blackjack", "poker", "roulette", "slots", "baccarat"];
  if (games.every((game) => (state.gamesPlayed[game] ?? 0) > 0)) unlockedThemes.add("neon");
  if (state.highWater >= 2500) unlockedThemes.add("gilded");
  if (state.flags.after_hours) unlockedThemes.add("moonlit");

  const unlockedOutfits = new Set<CharacterId>(state.unlockedOutfits);
  const relationships = { ...state.relationships };
  const pending = new Set(state.pendingInvites);
  const openDoors = new Set(state.openDoors);

  for (const id of ROMANCE_IDS) {
    const rel = relationships[id];
    if (rel.romance === "accepted" || rel.romance === "close") {
      if (["reina", "akari", "celeste", "mika", "shiori", "iris"].includes(id)) unlockedOutfits.add(id);
    }
    if (rel.affinity >= 72 && ["reina", "akari", "celeste", "mika", "shiori", "iris"].includes(id)) {
      unlockedOutfits.add(id);
    }
    if (rel.romance === "declined" && state.evening >= rel.declinedUntil) {
      relationships[id] = { ...rel, romance: "none" };
    }
    const current = relationships[id];
    if (current.romance === "pending") pending.add(id);
    if ((current.romance === "accepted" || current.romance === "close") && current.visitedEvening < state.evening) {
      const lucky = Boolean(state.flags[`lucky_${id}`]);
      const timeOk = id === "aoi" ? false : lucky || RULES[id].times.includes(state.time);
      if (timeOk) openDoors.add(id);
    }
    if (current.romance === "none" && canInvite({ ...state, relationships }, id)) {
      relationships[id] = { ...current, romance: "pending" };
      pending.add(id);
    }
  }

  return {
    ...state,
    relationships,
    pendingInvites: [...pending],
    openDoors: [...openDoors].filter((id) => !pending.has(id)),
    unlockedThemes: [...unlockedThemes],
    unlockedOutfits: [...unlockedOutfits],
    highWater: Math.max(state.highWater, state.chips),
  };
}

export function clampAffinity(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function themeBlurb(theme: ThemeId): string {
  switch (theme) {
    case "velvet":
      return "Burgundy, gold, and the house felt. Always available.";
    case "neon":
      return "Magenta light on dark water. Unlock by finishing a round at every table.";
    case "gilded":
      return "A brighter gold salon. Unlock by holding 2,500 chips at any point.";
    case "moonlit":
      return "Blue hush and silver trim. Unlock by staying until after hours.";
  }
}

export function isRomance(value: Romance): boolean {
  return value === "close" || value === "accepted";
}
