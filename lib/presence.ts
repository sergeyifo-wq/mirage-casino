import type { CharacterId, GameId, SaveState, TimeOfNight } from "@/lib/types";

export const TIME_ORDER: TimeOfNight[] = ["early", "prime", "late", "after"];

export const TIME_META: Record<TimeOfNight, { label: string; clock: string; blurb: string }> = {
  early: { label: "Early evening", clock: "7:30 PM", blurb: "The chandeliers are just warming up." },
  prime: { label: "Prime time", clock: "9:40 PM", blurb: "Every table has a story in progress." },
  late: { label: "Late night", clock: "11:15 PM", blurb: "Voices soften. The bets do not." },
  after: { label: "After hours", clock: "1:05 AM", blurb: "The floor thins. The people who stay mean it." },
};

export function advanceTime(time: TimeOfNight): TimeOfNight | null {
  if (time === "early") return "prime";
  if (time === "prime") return "late";
  if (time === "late") return "after";
  return null;
}

export function blackjackOpponents(time: TimeOfNight): ("naomi" | "yuki")[] {
  if (time === "early") return ["naomi"];
  if (time === "after") return ["yuki"];
  return ["naomi", "yuki"];
}

export function pokerOpponents(time: TimeOfNight): ("hana" | "rin")[] {
  if (time === "early") return ["hana"];
  if (time === "after") return ["rin"];
  return ["hana", "rin"];
}

export function barPatrons(time: TimeOfNight): CharacterId[] {
  switch (time) {
    case "early":
      return ["iris", "mika", "naomi", "aoi"];
    case "prime":
      return ["iris", "akari", "hana", "yuki", "celeste"];
    case "late":
      return ["iris", "reina", "shiori", "rin", "hana"];
    case "after":
      return ["iris", "celeste", "rin", "reina"];
  }
}

export function roomLine(game: GameId, time: TimeOfNight): string {
  const lines: Record<GameId, Record<TimeOfNight, string>> = {
    blackjack: {
      early: "Naomi has the notebook open. Reina is already dealing air into a shuffle.",
      prime: "Yuki has taken the end seat and is grinning at a stiff hand.",
      late: "The table is quieter. Reina's tells are mostly courtesy.",
      after: "Naomi has gone up. Yuki remains, daring the shoe to surprise her.",
    },
    poker: {
      early: "Hana is early, which means she wants the table before it gets loud.",
      prime: "Hana and Rin are both in. Akari is already collecting faces.",
      late: "The pots get personal. Rin still hasn't said much.",
      after: "Rin stays. She plays as if the room belongs to the river card.",
    },
    roulette: {
      early: "Celeste is setting the wheel like a stage.",
      prime: "A small crowd watches. Celeste watches the crowd.",
      late: "Fewer bets, longer ceremonies.",
      after: "The wheel sounds louder when the floor is this empty.",
    },
    slots: {
      early: "Mika is explaining a payline to an empty chair, practicing.",
      prime: "Lights, cheers, and Mika conducting both.",
      late: "The cabinet is still awake. Mika is negotiating with her own bedtime.",
      after: "Mika has clocked out. The machine will still take a practice spin.",
    },
    baccarat: {
      early: "Shiori is aligning the shoe. Conversation is optional.",
      prime: "A polished crowd. Shiori's voice stays low.",
      late: "This is her hour. The rules feel like a kindness.",
      after: "She is still here, which means she chose to be.",
    },
  };
  return lines[game][time];
}

export function aoiLine(state: SaveState): string {
  if (state.chips < 10 && state.courtesyEvening !== state.evening) {
    return "Your rack is thin. The house can spare a courtesy stake — two hundred, once tonight. It is not a compliment. It is a door staying open.";
  }
  if (state.pendingInvites.length > 0) {
    const name = state.pendingInvites[0];
    return `A note arrived for you. I did not read it. I did notice the handwriting belongs to ${display(name)}.`;
  }
  if (state.openDoors.length > 0) {
    return "One of the upstairs doors is open, if you still want the quieter part of the night.";
  }
  if (state.time === "after") {
    return "The floor is thinning. Your suite is ready whenever the night is.";
  }
  if (state.evening === 1 && state.stats.rounds === 0) {
    return `${state.playerName}, welcome to Midnight Mirage. The rack in your hand is one thousand chips, on the house. Play, or don't. The bar is kind either way.`;
  }
  return "The evening is yours. Tables to the left, the bar through the velvet, and your suite whenever you want the city without the noise.";
}

function display(id: CharacterId): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

export const DRINKS = [
  { id: "mule", name: "Midnight Mule", price: 20, blurb: "Ginger, lime, and a rumor of smoke.", likes: ["yuki", "akari", "reina"] as CharacterId[] },
  { id: "velvet", name: "Velvet Spark", price: 30, blurb: "Blackcurrant, bubbles, and a gold rim.", likes: ["celeste", "hana", "reina"] as CharacterId[] },
  { id: "jasmine", name: "Jasmine Highball", price: 25, blurb: "Tea, citrus, and a little patience.", likes: ["shiori", "rin", "naomi", "aoi"] as CharacterId[] },
  { id: "moon", name: "Moonlight Fizz", price: 15, blurb: "Zero-proof. Lychee, soda, a clean finish.", likes: ["mika", "iris", "aoi", "celeste"] as CharacterId[] },
] as const;

export const LIMITS = {
  blackjack: { min: 10, max: 200, step: 10 },
  poker: { min: 100, max: 500, step: 50, sb: 5, bb: 10 },
  roulette: { min: 5, maxSpot: 50, maxTotal: 300 },
  slots: [5, 10, 25, 50] as const,
  baccarat: { min: 20, max: 200, step: 10 },
};

export const STARTING_CHIPS = 1000;
export const NIGHTLY_ALLOWANCE = 500;
export const COURTESY_STAKE = 200;
