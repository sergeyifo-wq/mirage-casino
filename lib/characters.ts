import type { CharacterId, GameId, Tone } from "@/lib/types";

export type CharacterDef = {
  id: CharacterId;
  name: string;
  age: number;
  role: string;
  game?: GameId;
  tagline: string;
  look: string;
  about: string;
  wish: string;
  likes: Tone[];
  dislikesEarly: Tone[];
  favoriteDrink: string;
  voice: string;
};

export const CHARACTER_IDS: CharacterId[] = [
  "reina",
  "akari",
  "celeste",
  "mika",
  "shiori",
  "naomi",
  "yuki",
  "hana",
  "rin",
  "iris",
  "aoi",
];

export const EVENING_LOOKS: CharacterId[] = ["reina", "akari", "celeste", "mika", "shiori", "iris"];

export const ROMANCE_IDS: CharacterId[] = [
  "reina",
  "akari",
  "celeste",
  "mika",
  "shiori",
  "iris",
  "naomi",
  "yuki",
  "hana",
  "rin",
];

export const STORY_FLAG: Record<Exclude<CharacterId, "aoi">, string> = {
  reina: "reina_rival",
  akari: "akari_tell",
  celeste: "celeste_fate",
  mika: "mika_dream",
  shiori: "shiori_patience",
  naomi: "naomi_journal",
  yuki: "yuki_risk",
  hana: "hana_story",
  rin: "rin_music",
  iris: "iris_song",
};

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  reina: {
    id: "reina",
    name: "Reina",
    age: 28,
    role: "Blackjack dealer",
    game: "blackjack",
    tagline: "Composed, witty, and impossible to rush.",
    look: "Long black hair, amber eyes, a beauty mark under her left eye, and a black vest with a narrow gold collar bar.",
    about: "Reina deals as if the shoe is a conversation. She likes a fair fight, remembers the hands that were played well, and gives advice only when it will actually help.",
    wish: "A rival who stays interesting after the cards are put away.",
    likes: ["humorous", "friendly"],
    dislikesEarly: [],
    favoriteDrink: "Velvet Spark",
    voice: "Dry, precise, warmer than she pretends.",
  },
  akari: {
    id: "akari",
    name: "Akari",
    age: 26,
    role: "Poker host",
    game: "poker",
    tagline: "Confident, mischievous, and professionally nosy.",
    look: "Wavy auburn hair, emerald eyes, faint freckles, and a burgundy blazer she treats like a dare.",
    about: "Akari does not play the hand. She watches the people who do. Bluffs delight her, bad ones especially, and she will tell you — almost — what your face just confessed.",
    wish: "Someone who can call her bluff and still want another hand.",
    likes: ["humorous", "flirtatious"],
    dislikesEarly: [],
    favoriteDrink: "Midnight Mule",
    voice: "Teasing, quick, always one question ahead.",
  },
  celeste: {
    id: "celeste",
    name: "Celeste",
    age: 31,
    role: "Roulette hostess",
    game: "roulette",
    tagline: "Elegant, mysterious, and fond of ceremony.",
    look: "Silver-lavender hair, violet eyes, a crescent hairpin, and a midnight-blue gown stitched with tiny stars.",
    about: "Celeste treats every spin as a small play. She will not pretend the wheel loves you. She will make the moment worth watching anyway.",
    wish: "A guest who asks what she believes, and then listens.",
    likes: ["curious", "flirtatious"],
    dislikesEarly: [],
    favoriteDrink: "Moonlight Fizz",
    voice: "Unhurried, poetic, never quite answering first.",
  },
  mika: {
    id: "mika",
    name: "Mika",
    age: 24,
    role: "Slots attendant",
    game: "slots",
    tagline: "Bright, encouraging, and sincerely thrilled by small wins.",
    look: "A honey-blonde bob, hazel eyes, gold studs, and a coral attendant jacket with more enthusiasm than the dress code required.",
    about: "Mika learned the floor by teaching nervous guests how to press one button without apologizing. She sketches game symbols in the margins of her shift notes.",
    wish: "To design a cabinet people remember for the celebration, not the loss.",
    likes: ["friendly", "humorous"],
    dislikesEarly: [],
    favoriteDrink: "Moonlight Fizz",
    voice: "Warm, specific, a little breathless when she's happy.",
  },
  shiori: {
    id: "shiori",
    name: "Shiori",
    age: 30,
    role: "Baccarat dealer",
    game: "baccarat",
    tagline: "Reserved, exact, and quietly capable of warmth.",
    look: "Very long black hair, dark eyes, a jade stud, and an ivory-and-black high collar.",
    about: "Shiori deals baccarat because the rules are strict and the room is quiet. She does not perform intimacy. If it arrives, it arrives slowly, and she means it.",
    wish: "A silence that is shared, not demanded.",
    likes: ["curious", "friendly"],
    dislikesEarly: ["flirtatious"],
    favoriteDrink: "Jasmine Highball",
    voice: "Sparse at first. Softer once she decides you are safe.",
  },
  naomi: {
    id: "naomi",
    name: "Naomi",
    age: 29,
    role: "Blackjack regular",
    tagline: "Analytical, cool, and more superstitious than she admits.",
    look: "A neat dark twist of hair, rectangular glasses, and a navy suit she wears like a uniform of her own.",
    about: "Naomi keeps a notebook of decisions, not outcomes. She respects Reina, distrusts hunches, and will explain a hand if you ask without turning it into a performance.",
    wish: "To be known for something other than being right.",
    likes: ["curious", "friendly"],
    dislikesEarly: ["flirtatious"],
    favoriteDrink: "Jasmine Highball",
    voice: "Clipped, numerical, then suddenly human.",
  },
  yuki: {
    id: "yuki",
    name: "Yuki",
    age: 25,
    role: "Blackjack regular",
    tagline: "Bold, grinning, and honest about the thrill.",
    look: "Short silver-blue hair, a gold ear cuff, and a crimson shirt under a black jacket.",
    about: "Yuki hits when the book says stand and laughs when the book is right. She likes risk that is chosen, not sloppy, and she will buy the round either way.",
    wish: "A night that feels brave without becoming careless.",
    likes: ["humorous", "flirtatious"],
    dislikesEarly: [],
    favoriteDrink: "Midnight Mule",
    voice: "Punchy, daring, sincere underneath the grin.",
  },
  hana: {
    id: "hana",
    name: "Hana",
    age: 27,
    role: "Poker regular",
    tagline: "Warm, sharp, and always reading the room.",
    look: "Side-swept black hair, warm brown eyes, a plum dress, and a silver flower brooch.",
    about: "Hana plays tight and talks like a novelist, because she is one. The casino is research she keeps failing to treat as research. She regrets one bluff more than any loss.",
    wish: "A chapter she doesn't have to write down.",
    likes: ["curious", "friendly"],
    dislikesEarly: ["flirtatious"],
    favoriteDrink: "Velvet Spark",
    voice: "Literary, observant, gentle even when she cuts.",
  },
  rin: {
    id: "rin",
    name: "Rin",
    age: 28,
    role: "Poker regular",
    tagline: "Quiet, patient, and devastating exactly once a night.",
    look: "A precise black bob, gray eyes, a charcoal turtleneck, and a thin silver necklace.",
    about: "Rin learned cards from her aunt and music from nobody in particular. She checks, checks, and then takes the pot as if it had always been hers. She speaks when the sentence is finished.",
    wish: "Company that does not need the quiet filled.",
    likes: ["curious"],
    dislikesEarly: ["flirtatious"],
    favoriteDrink: "Jasmine Highball",
    voice: "Few words. None of them wasted.",
  },
  iris: {
    id: "iris",
    name: "Iris",
    age: 32,
    role: "Bartender",
    tagline: "Warm, observant, and done performing for a crowd.",
    look: "Wine-red curls, amber eyes, a bartender's vest, and the smile of someone who has already heard the story.",
    about: "Iris keeps the bar between the games. She remembers drinks, not secrets. She used to sing. She still can. She chooses the room first.",
    wish: "One listener, not an audience.",
    likes: ["friendly", "curious", "humorous"],
    dislikesEarly: [],
    favoriteDrink: "Moonlight Fizz",
    voice: "Hospitable, wry, never cruel with what she knows.",
  },
  aoi: {
    id: "aoi",
    name: "Aoi",
    age: 27,
    role: "Hotel concierge",
    tagline: "Kind, precise, and professionally delighted by the night.",
    look: "A teal-black bob, brown eyes, and a cream concierge jacket with gold piping.",
    about: "Aoi runs the threshold between the casino and the rooms upstairs. She will refresh your rack, hold a note, and walk you to your door. She will not be a prize for a good night at the tables.",
    wish: "A house where people leave happier than they arrived, including her.",
    likes: ["friendly", "curious"],
    dislikesEarly: ["flirtatious"],
    favoriteDrink: "Jasmine Highball",
    voice: "Polite, lightly funny, impossible to fluster for long.",
  },
};

export function stageName(affinity: number, romance: RelationshipRomance): string {
  if (romance === "close") return "Close";
  if (romance === "accepted") return "Trusted";
  if (affinity >= 70) return "Devoted";
  if (affinity >= 50) return "Confidant";
  if (affinity >= 32) return "Familiar";
  if (affinity >= 14) return "Acquaintance";
  return "Stranger";
}

type RelationshipRomance = import("@/lib/types").Romance;

export function portraitSrc(id: CharacterId, outfit: "uniform" | "evening" = "uniform"): string {
  if (outfit === "evening" && EVENING_LOOKS.includes(id)) return `/art/${id}-evening.jpg`;
  return `/art/${id}.jpg`;
}
