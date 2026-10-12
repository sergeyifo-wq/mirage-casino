"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useCallback,
  type Dispatch,
  type ReactNode,
} from "react";
import { CHARACTER_IDS, CHARACTERS } from "@/lib/characters";
import {
  COURTESY_STAKE,
  DRINKS,
  LIMITS,
  NIGHTLY_ALLOWANCE,
} from "@/lib/presence";
import {
  isJackpot,
  isSymbolGrid,
  scoreGrid,
  SPIN_DURATION,
  type SlotSpin,
} from "@/lib/slots";
import {
  ROULETTE_SPIN_DURATION,
  settleRoulette,
  validRouletteSpin,
  type RouletteSpin,
} from "@/lib/roulette";
import { advanceTime } from "@/lib/presence";
import {
  blankRelationship,
  clampAffinity,
  derive,
  rapportDelta,
} from "@/lib/progress";
import type {
  CharacterId,
  ChoiceEffects,
  GameId,
  JournalEntry,
  OutfitId,
  SaveState,
  ThemeId,
  Tone,
} from "@/lib/types";

const SAVE_KEY = "midnight-mirage-v1";

export type Screen =
  | { name: "title" }
  | { name: "map" }
  | { name: "blackjack" }
  | { name: "poker" }
  | { name: "roulette" }
  | { name: "slots" }
  | { name: "baccarat" }
  | { name: "bar" }
  | { name: "suite" }
  | { name: "journal" }
  | { name: "profiles"; focus?: CharacterId }
  | { name: "dialogue"; sceneId: string; back: Screen }
  | { name: "hotel"; characterId: CharacterId; sceneId: string };

export type Action =
  | { type: "hydrate"; state: SaveState }
  | { type: "new-game"; name: string }
  | { type: "rename"; name: string }
  | { type: "advance-time" }
  | { type: "rest" }
  | { type: "courtesy" }
  | {
      type: "round";
      game: GameId;
      live: boolean;
      profit: number;
      net?: number;
      with: CharacterId[];
      dramatic?: CharacterId[];
    }
  | { type: "chips"; delta: number }
  | { type: "slots-spin"; spin: SlotSpin }
  | { type: "slots-settle"; id: string }
  | { type: "roulette-spin"; spin: RouletteSpin }
  | { type: "roulette-settle"; id: string }
  | { type: "talked"; id: CharacterId }
  | {
      type: "choice";
      sceneId: string;
      characterId: CharacterId;
      affects?: CharacterId[];
      tone: Tone;
      effects?: ChoiceEffects;
      choiceId: string;
      place?: string;
    }
  | { type: "reply"; id: CharacterId; tone: Tone }
  | { type: "drink"; drinkId: string; with?: CharacterId }
  | { type: "tutorial"; id: string }
  | { type: "theme"; theme: ThemeId }
  | { type: "outfit"; id: CharacterId; outfit: OutfitId }
  | { type: "toggle-music" }
  | { type: "toggle-sfx" }
  | { type: "excuse"; id: CharacterId };

export function cleanName(name: string): string {
  const trimmed = name.replace(/\s+/g, " ").trim().slice(0, 18);
  return trimmed || "Traveler";
}

export function createSave(name: string): SaveState {
  const relationships = Object.fromEntries(
    CHARACTER_IDS.map((id) => [id, blankRelationship()]),
  ) as SaveState["relationships"];
  const state: SaveState = {
    version: 1,
    playerName: cleanName(name),
    chips: 1000,
    highWater: 1000,
    evening: 1,
    time: "early",
    relationships,
    flags: {},
    journal: [
      {
        id: "welcome",
        evening: 1,
        time: "early",
        title: "The rack",
        body: "Aoi set a thousand house chips in your hand and asked only that you enjoy the building. The nightly allowance waits in the suite.",
        characterId: "aoi",
      },
    ],
    tutorialsSeen: {},
    theme: "velvet",
    unlockedThemes: ["velvet"],
    outfits: {},
    unlockedOutfits: [],
    gamesPlayed: { blackjack: 0, poker: 0, roulette: 0, slots: 0, baccarat: 0 },
    pendingInvites: [],
    openDoors: [],
    courtesyEvening: 0,
    groupEvening: 0,
    drinks: 0,
    stats: { biggestWin: 0, rounds: 0 },
    music: true,
    sfx: true,
  };
  return derive(state);
}

function journalEntry(state: SaveState, entry: JournalEntry): SaveState {
  if (state.journal.some((item) => item.id === entry.id)) return state;
  return { ...state, journal: [...state.journal, entry] };
}

function addMemory(
  state: SaveState,
  id: CharacterId,
  memoryId: string,
  text: string,
): SaveState {
  const rel = state.relationships[id];
  if (rel.memories.some((memory) => memory.id === memoryId)) return state;
  return {
    ...state,
    relationships: {
      ...state.relationships,
      [id]: {
        ...rel,
        memories: [
          ...rel.memories,
          { id: memoryId, text, evening: state.evening },
        ].slice(-12),
      },
    },
  };
}

function bump(
  state: SaveState,
  id: CharacterId,
  tone: Tone,
  bonus = 0,
): SaveState {
  const rel = state.relationships[id];
  const delta = rapportDelta(id, tone, rel.affinity) + bonus;
  return {
    ...state,
    relationships: {
      ...state.relationships,
      [id]: {
        ...rel,
        affinity: clampAffinity(rel.affinity + delta),
        tones: {
          ...rel.tones,
          [tone]: rel.tones[tone] + (tone === "leave" ? 0 : 1),
        },
      },
    },
  };
}

function finishVisit(
  state: SaveState,
  id: CharacterId,
  end: "romantic" | "talk" | "leave",
): SaveState {
  const rel = state.relationships[id];
  let romance = rel.romance;
  if (end === "romantic") romance = "close";
  else if (end === "talk" && romance !== "close") romance = "accepted";
  let next = addMemory(
    state,
    id,
    `visit-${id}-${state.evening}-${end}`,
    end === "romantic"
      ? `You and ${CHARACTERS[id].name} chose a quiet, close moment and let the floor stay downstairs.`
      : end === "talk"
        ? `You spent an unhurried hour with ${CHARACTERS[id].name} and left when it felt right.`
        : `You said goodnight to ${CHARACTERS[id].name} without owing the room anything.`,
  );
  if (end === "romantic") {
    next = journalEntry(next, {
      id: `romance-${id}-${state.evening}`,
      evening: state.evening,
      time: state.time,
      title: `Close with ${CHARACTERS[id].name}`,
      body: "The room stayed tasteful and unhurried. Closeness was a choice, and the door still opened from the inside.",
      characterId: id,
    });
  }
  return {
    ...next,
    openDoors: next.openDoors.filter((door) => door !== id),
    relationships: {
      ...next.relationships,
      [id]: {
        ...next.relationships[id],
        romance,
        visitedEvening: state.evening,
      },
    },
  };
}

export function gameReducer(state: SaveState, action: Action): SaveState {
  switch (action.type) {
    case "hydrate":
      return derive(normalize(action.state));
    case "new-game":
      return createSave(action.name);
    case "rename":
      return { ...state, playerName: cleanName(action.name) };
    case "advance-time": {
      const time = advanceTime(state.time);
      if (!time) return state;
      const flags =
        time === "after" ? { ...state.flags, after_hours: true } : state.flags;
      return derive({ ...state, time, flags });
    }
    case "rest": {
      const relationships = { ...state.relationships };
      if (state.pendingInvites.length) {
        for (const id of state.pendingInvites) {
          if (relationships[id].romance === "pending")
            relationships[id] = { ...relationships[id], romance: "none" };
        }
      }
      let next: SaveState = {
        ...state,
        relationships,
        evening: state.evening + 1,
        time: "early",
        chips: state.chips + NIGHTLY_ALLOWANCE,
        pendingInvites: [],
        openDoors: [],
        courtesyEvening: 0,
      };
      next = journalEntry(next, {
        id: `allowance-${next.evening}`,
        evening: next.evening,
        time: "early",
        title: "Nightly allowance",
        body: `Aoi refreshed the rack with ${NIGHTLY_ALLOWANCE} chips. The house would rather you stay in the game than grind for the privilege.`,
        characterId: "aoi",
      });
      if (state.pendingInvites.length) {
        next = journalEntry(next, {
          id: `missed-${state.evening}`,
          evening: state.evening,
          time: state.time,
          title: "Unanswered notes",
          body: "A few invitations waited with Aoi. By morning they had been collected, politely, as if the night had changed its mind without taking offense.",
        });
      }
      return derive(next);
    }
    case "courtesy": {
      if (state.courtesyEvening === state.evening || state.chips >= 10)
        return state;
      return derive(
        journalEntry(
          {
            ...state,
            chips: state.chips + COURTESY_STAKE,
            courtesyEvening: state.evening,
          },
          {
            id: `courtesy-${state.evening}`,
            evening: state.evening,
            time: state.time,
            title: "Courtesy stake",
            body: "Aoi slid two hundred chips across the desk. Not a reward. A way to stay in the building.",
            characterId: "aoi",
          },
        ),
      );
    }
    case "slots-spin": {
      if (state.pendingSlotSpin || !validSlotSpin(action.spin)) return state;
      const spin = {
        ...action.spin,
        practice: action.spin.practice || state.time === "after",
        hosted: state.time !== "after",
      };
      if (!spin.practice && state.chips < spin.bet) return state;
      return derive({
        ...state,
        chips: state.chips - (spin.practice ? 0 : spin.bet),
        pendingSlotSpin: spin,
      });
    }
    case "slots-settle": {
      const spin = state.pendingSlotSpin;
      if (!spin || spin.id !== action.id) return state;
      const scored = scoreGrid(spin.grid, spin.bet);
      const next = { ...state, pendingSlotSpin: null, lastSlotSpin: spin };
      if (spin.practice) return next;
      return gameReducer(next, {
        type: "round",
        game: "slots",
        live: true,
        profit: scored.total,
        net: scored.total - spin.bet,
        with: spin.hosted ? ["mika"] : [],
        dramatic: spin.hosted && isJackpot(scored.lines) ? ["mika"] : [],
      });
    }
    case "roulette-spin": {
      if (state.pendingRouletteSpin || !validRouletteSpin(action.spin))
        return state;
      const stake = action.spin.bets.reduce((sum, bet) => sum + bet.amount, 0);
      if (!action.spin.practice && stake > state.chips) return state;
      return derive({
        ...state,
        chips: state.chips - (action.spin.practice ? 0 : stake),
        pendingRouletteSpin: action.spin,
      });
    }
    case "roulette-settle": {
      const spin = state.pendingRouletteSpin;
      if (!spin || spin.id !== action.id) return state;
      const paid = settleRoulette(spin.bets, spin.result).returned;
      const stake = spin.bets.reduce((sum, bet) => sum + bet.amount, 0);
      const next = {
        ...state,
        pendingRouletteSpin: null,
        lastRouletteSpin: spin,
        rouletteHistory: [spin.result, ...(state.rouletteHistory ?? [])].slice(
          0,
          12,
        ),
      };
      if (spin.practice) return next;
      return gameReducer(next, {
        type: "round",
        game: "roulette",
        live: true,
        profit: paid,
        net: paid - stake,
        with: ["celeste"],
        dramatic: spin.bets.some(
          (bet) => bet.kind === "straight" && bet.n === spin.result,
        )
          ? ["celeste"]
          : [],
      });
    }
    case "round": {
      const liveProfit = action.live ? action.profit : 0;
      const chips = Math.max(0, state.chips + liveProfit);
      const relationships = { ...state.relationships };
      if (action.live) {
        for (const id of action.with) {
          relationships[id] = {
            ...relationships[id],
            realSessions: relationships[id].realSessions + 1,
          };
        }
      }
      let next: SaveState = {
        ...state,
        chips,
        relationships,
        gamesPlayed: {
          ...state.gamesPlayed,
          [action.game]: state.gamesPlayed[action.game] + 1,
        },
        stats: {
          rounds: state.stats.rounds + 1,
          biggestWin: Math.max(
            state.stats.biggestWin,
            action.live ? (action.net ?? liveProfit) : state.stats.biggestWin,
          ),
        },
      };
      if (action.dramatic?.length) next = rollLucky(next, action.dramatic);
      return derive(next);
    }
    case "chips":
      return derive({
        ...state,
        chips: Math.max(0, state.chips + action.delta),
      });
    case "talked": {
      const rel = state.relationships[action.id];
      return {
        ...state,
        relationships: {
          ...state.relationships,
          [action.id]: { ...rel, conversations: rel.conversations + 1 },
        },
      };
    }
    case "choice": {
      let next = state;
      const talkKey = `talked:${action.sceneId}:${state.evening}`;
      if (!next.flags[talkKey]) {
        const rel = next.relationships[action.characterId];
        next = {
          ...next,
          flags: { ...next.flags, [talkKey]: true },
          relationships: {
            ...next.relationships,
            [action.characterId]: {
              ...rel,
              conversations: rel.conversations + 1,
            },
          },
        };
      }
      const people = action.affects?.length
        ? action.affects
        : [action.characterId];
      for (const id of people) {
        const extra =
          id === action.characterId ? (action.effects?.affinity ?? 0) : 0;
        const other =
          action.effects?.others?.find((item) => item.id === id)?.affinity ?? 0;
        next = bump(next, id, action.tone, extra + other);
      }
      if (action.effects?.memory) {
        next = addMemory(
          next,
          action.characterId,
          `${action.sceneId}:${action.choiceId}`,
          action.effects.memory,
        );
      }
      if (action.effects?.journal) {
        next = journalEntry(next, {
          id: `${action.sceneId}:${action.choiceId}`,
          evening: next.evening,
          time: next.time,
          title: action.effects.journal.title,
          body: action.effects.journal.body,
          characterId: action.characterId,
        });
      }
      if (action.effects?.flags) {
        const flags = { ...next.flags };
        for (const flag of action.effects.flags) flags[flag] = true;
        next = { ...next, flags };
      }
      if (action.effects?.completeScene) {
        next = {
          ...next,
          flags: { ...next.flags, [`seen:${action.sceneId}`]: true },
        };
      }
      if (action.effects?.markGroup) {
        next = {
          ...next,
          groupEvening: next.evening,
          flags: { ...next.flags, group_bluff: true },
        };
      }
      if (action.effects?.acceptInvite) {
        const rel = next.relationships[action.characterId];
        next = {
          ...next,
          pendingInvites: next.pendingInvites.filter(
            (id) => id !== action.characterId,
          ),
          openDoors: [...new Set([...next.openDoors, action.characterId])],
          relationships: {
            ...next.relationships,
            [action.characterId]: {
              ...rel,
              romance: rel.romance === "close" ? "close" : "accepted",
            },
          },
        };
      }
      if (action.effects?.declineInvite) {
        const rel = next.relationships[action.characterId];
        next = {
          ...next,
          pendingInvites: next.pendingInvites.filter(
            (id) => id !== action.characterId,
          ),
          relationships: {
            ...next.relationships,
            [action.characterId]: {
              ...rel,
              romance: "declined",
              declinedUntil: next.evening + 2,
            },
          },
        };
        next = journalEntry(next, {
          id: `declined-${action.characterId}-${next.evening}`,
          evening: next.evening,
          time: next.time,
          title: `A gentle no`,
          body: `You declined ${CHARACTERS[action.characterId].name}'s invitation. The floor did not charge you for it.`,
          characterId: action.characterId,
        });
      }
      if (
        action.effects?.end &&
        (action.place === "hotel" || action.place === "encore")
      ) {
        next = finishVisit(next, action.characterId, action.effects.end);
      }
      return derive(next);
    }
    case "reply":
      return derive(bump(state, action.id, action.tone));
    case "drink": {
      const drink = DRINKS.find((item) => item.id === action.drinkId);
      if (!drink || state.chips < drink.price) return state;
      let next: SaveState = {
        ...state,
        chips: state.chips - drink.price,
        drinks: state.drinks + 1,
      };
      if (action.with && drink.likes.includes(action.with)) {
        next = bump(next, action.with, "friendly", 2);
        next = addMemory(
          next,
          action.with,
          `drink-${drink.id}-${action.with}`,
          `${CHARACTERS[action.with].name} noticed you ordered ${drink.name}.`,
        );
      }
      return derive(next);
    }
    case "tutorial":
      return {
        ...state,
        tutorialsSeen: { ...state.tutorialsSeen, [action.id]: true },
      };
    case "theme":
      if (!state.unlockedThemes.includes(action.theme)) return state;
      return { ...state, theme: action.theme };
    case "outfit":
      if (
        action.outfit === "evening" &&
        !state.unlockedOutfits.includes(action.id)
      )
        return state;
      return {
        ...state,
        outfits: { ...state.outfits, [action.id]: action.outfit },
      };
    case "toggle-music":
      return { ...state, music: !state.music };
    case "toggle-sfx":
      return { ...state, sfx: !state.sfx };
    case "excuse":
      return derive(finishVisit(state, action.id, "leave"));
    default:
      return state;
  }
}

function rollLucky(state: SaveState, ids: CharacterId[]): SaveState {
  let next = state;
  for (const id of ids) {
    if (id === "aoi" || next.flags[`lucky_${id}`]) continue;
    const rel = next.relationships[id];
    if (rel.affinity < 26) continue;
    if (rel.memories.length < 1 && rel.conversations < 1) continue;
    if (Math.random() > 0.34) continue;
    next = {
      ...next,
      flags: { ...next.flags, [`lucky_${id}`]: true },
    };
    next = journalEntry(next, {
      id: `lucky-${id}-${next.evening}`,
      evening: next.evening,
      time: next.time,
      title: `A lucky pause with ${CHARACTERS[id].name}`,
      body: "The moment had nothing to do with the size of the pot. She looked at you as if the night had leaned in.",
      characterId: id,
    });
  }
  return next;
}

function validSlotSpin(spin: SlotSpin | null | undefined): spin is SlotSpin {
  return (
    !!spin &&
    typeof spin.id === "string" &&
    spin.id.length > 0 &&
    isSymbolGrid(spin.grid) &&
    LIMITS.slots.some((bet) => bet === spin.bet) &&
    Number.isFinite(spin.endsAt) &&
    typeof spin.practice === "boolean" &&
    typeof spin.hosted === "boolean"
  );
}

export function normalize(raw: Partial<SaveState> | null): SaveState {
  const base = createSave(raw?.playerName || "Traveler");
  if (!raw || raw.version !== 1) return base;
  const relationships = { ...base.relationships };
  for (const id of CHARACTER_IDS) {
    relationships[id] = { ...blankRelationship(), ...raw.relationships?.[id] };
    relationships[id].tones = {
      ...blankRelationship().tones,
      ...raw.relationships?.[id]?.tones,
    };
    relationships[id].memories = raw.relationships?.[id]?.memories ?? [];
  }
  return {
    ...base,
    ...raw,
    version: 1,
    relationships,
    flags: raw.flags ?? {},
    journal: raw.journal?.length ? raw.journal : base.journal,
    tutorialsSeen: raw.tutorialsSeen ?? {},
    unlockedThemes: raw.unlockedThemes?.length
      ? raw.unlockedThemes
      : ["velvet"],
    outfits: raw.outfits ?? {},
    unlockedOutfits: raw.unlockedOutfits ?? [],
    gamesPlayed: { ...base.gamesPlayed, ...raw.gamesPlayed },
    pendingInvites: raw.pendingInvites ?? [],
    openDoors: raw.openDoors ?? [],
    stats: { ...base.stats, ...raw.stats },
    pendingSlotSpin: validSlotSpin(raw.pendingSlotSpin)
      ? raw.pendingSlotSpin
      : null,
    lastSlotSpin: validSlotSpin(raw.lastSlotSpin) ? raw.lastSlotSpin : null,
    pendingRouletteSpin: validRouletteSpin(raw.pendingRouletteSpin)
      ? raw.pendingRouletteSpin
      : null,
    lastRouletteSpin: validRouletteSpin(raw.lastRouletteSpin)
      ? raw.lastRouletteSpin
      : null,
    rouletteHistory: Array.isArray(raw.rouletteHistory)
      ? raw.rouletteHistory
          .filter((n) => Number.isInteger(n) && n >= 0 && n <= 36)
          .slice(0, 12)
      : [],
  };
}

export function loadSave(): SaveState | null {
  try {
    const text = localStorage.getItem(SAVE_KEY);
    if (!text) return null;
    return derive(normalize(JSON.parse(text) as SaveState));
  } catch {
    return null;
  }
}

export function writeSave(state: SaveState) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

type GameValue = {
  state: SaveState;
  dispatch: Dispatch<Action>;
  screen: Screen;
  setScreen: (screen: Screen) => void;
  setTableExitLock: (message: string | null) => void;
  notice: string | null;
  toast: (message: string) => void;
  ready: boolean;
  existingSave: boolean;
};

const GameContext = createContext<GameValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, null, () =>
    createSave("Traveler"),
  );
  const [screen, changeScreen] = useReducer((_: Screen, next: Screen) => next, {
    name: "title",
  } as Screen);
  const [notice, setNotice] = useReducer(
    (_: string | null, next: string | null) => next,
    null,
  );
  const exitLock = useRef<string | null>(null);
  const setTableExitLock = useCallback((message: string | null) => {
    exitLock.current = message;
  }, []);
  const setScreen = useCallback((next: Screen) => {
    if (exitLock.current) {
      setNotice(exitLock.current);
      return;
    }
    changeScreen(next);
  }, []);
  const [ready, setReady] = useReducer(() => true, false);
  const [existingSave, setExistingSave] = useReducer(
    (_: boolean, next: boolean) => next,
    false,
  );

  useEffect(() => {
    const saved = loadSave();
    if (saved) {
      dispatch({ type: "hydrate", state: saved });
      setExistingSave(true);
    }
    setReady();
  }, []);

  useEffect(() => {
    if (ready) writeSave(state);
  }, [state, ready]);

  // The provider owns settlement, so navigation cannot cancel an accepted spin.
  // A saved pending spin also resumes after a reload; its ID prevents double payment.
  useEffect(() => {
    const spin = state.pendingSlotSpin;
    if (!ready || !spin) return;
    const timer = window.setTimeout(
      () => dispatch({ type: "slots-settle", id: spin.id }),
      Math.max(0, Math.min(SPIN_DURATION, spin.endsAt - Date.now())),
    );
    return () => window.clearTimeout(timer);
  }, [state.pendingSlotSpin, ready]);

  useEffect(() => {
    const spin = state.pendingRouletteSpin;
    if (!ready || !spin) return;
    const timer = window.setTimeout(
      () => dispatch({ type: "roulette-settle", id: spin.id }),
      Math.max(0, Math.min(ROULETTE_SPIN_DURATION, spin.endsAt - Date.now())),
    );
    return () => window.clearTimeout(timer);
  }, [state.pendingRouletteSpin, ready]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        screen,
        setScreen,
        setTableExitLock,
        notice,
        toast: setNotice,
        ready,
        existingSave,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameValue {
  const value = useContext(GameContext);
  if (!value) throw new Error("useGame must be used inside GameProvider");
  return value;
}

/** Interactive hands must finish or cash out before navigation can discard them. */
export function useTableExitLock(active: boolean, message: string) {
  const { setTableExitLock } = useGame();
  useEffect(() => {
    setTableExitLock(active ? message : null);
    return () => setTableExitLock(null);
  }, [active, message, setTableExitLock]);
}
