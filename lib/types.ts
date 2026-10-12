import type { SlotSpin } from "./slots";
import type { RouletteSpin } from "./roulette";

export type CharacterId =
  | "reina"
  | "akari"
  | "celeste"
  | "mika"
  | "shiori"
  | "naomi"
  | "yuki"
  | "hana"
  | "rin"
  | "iris"
  | "aoi";

export type Tone =
  | "friendly"
  | "humorous"
  | "curious"
  | "flirtatious"
  | "leave";
export type TimeOfNight = "early" | "prime" | "late" | "after";
export type ThemeId = "velvet" | "neon" | "gilded" | "moonlit";
export type OutfitId = "uniform" | "evening";
export type GameId = "blackjack" | "poker" | "roulette" | "slots" | "baccarat";
export type Romance = "none" | "pending" | "declined" | "accepted" | "close";
export type Speaker = CharacterId | "narration" | "you";

export type Memory = { id: string; text: string; evening: number };

export type JournalEntry = {
  id: string;
  evening: number;
  time: TimeOfNight;
  title: string;
  body: string;
  characterId?: CharacterId;
};

export type Relationship = {
  affinity: number;
  memories: Memory[];
  tones: Record<Tone, number>;
  conversations: number;
  realSessions: number;
  romance: Romance;
  declinedUntil: number;
  visitedEvening: number;
};

export type SaveStats = {
  biggestWin: number;
  rounds: number;
};

export type SaveState = {
  version: 1;
  playerName: string;
  chips: number;
  highWater: number;
  evening: number;
  time: TimeOfNight;
  relationships: Record<CharacterId, Relationship>;
  flags: Record<string, boolean>;
  journal: JournalEntry[];
  tutorialsSeen: Record<string, boolean>;
  theme: ThemeId;
  unlockedThemes: ThemeId[];
  outfits: Partial<Record<CharacterId, OutfitId>>;
  unlockedOutfits: CharacterId[];
  gamesPlayed: Record<GameId, number>;
  pendingInvites: CharacterId[];
  openDoors: CharacterId[];
  courtesyEvening: number;
  groupEvening: number;
  drinks: number;
  stats: SaveStats;
  music: boolean;
  sfx: boolean;
  pendingSlotSpin?: SlotSpin | null;
  lastSlotSpin?: SlotSpin | null;
  pendingRouletteSpin?: RouletteSpin | null;
  lastRouletteSpin?: RouletteSpin | null;
  rouletteHistory?: number[];
};

export type ChoiceEffects = {
  flags?: string[];
  memory?: string;
  journal?: { title: string; body: string };
  affinity?: number;
  others?: { id: CharacterId; affinity: number }[];
  markGroup?: boolean;
  acceptInvite?: boolean;
  declineInvite?: boolean;
  end?: "romantic" | "talk" | "leave";
  completeScene?: boolean;
};

export type ScriptChoice = {
  id: string;
  text: string;
  tone: Tone;
  next?: string;
  minAffinity?: number;
  requiresFlag?: string;
  hideFlag?: string;
  effects?: ChoiceEffects;
};

export type ScriptNode = {
  id: string;
  speaker: Speaker;
  text: string;
  next?: string;
  choices?: ScriptChoice[];
};

export type ScenePlace =
  | "bar"
  | "table"
  | "hotel"
  | "invite"
  | "group"
  | "encore"
  | "lobby";

export type Scene = {
  id: string;
  title: string;
  characterId: CharacterId;
  place: ScenePlace;
  affects?: CharacterId[];
  once?: boolean;
  flag?: string;
  time?: TimeOfNight[];
  requiresFlag?: string;
  entry: string;
  nodes: Record<string, ScriptNode>;
};
