export type Suit = "s" | "h" | "d" | "c";

export type Card = {
  rank: number;
  suit: Suit;
  id: string;
};

export const SUITS: Suit[] = ["s", "h", "d", "c"];

export function makeDeck(decks = 1): Card[] {
  const cards: Card[] = [];
  let n = 0;
  for (let d = 0; d < decks; d++) {
    for (const suit of SUITS) {
      for (let rank = 1; rank <= 13; rank++) {
        cards.push({ rank, suit, id: `${suit}${rank}-${d}-${n++}` });
      }
    }
  }
  return cards;
}

export function shuffle<T>(list: readonly T[], rng: () => number = Math.random): T[] {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function draw(deck: Card[], count: number): { cards: Card[]; deck: Card[] } {
  return { cards: deck.slice(0, count), deck: deck.slice(count) };
}

export function rankLabel(rank: number): string {
  if (rank === 1 || rank === 14) return "A";
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";
  return String(rank);
}

export function suitSymbol(suit: Suit): string {
  return { s: "♠", h: "♥", d: "♦", c: "♣" }[suit];
}

export function isRedSuit(suit: Suit): boolean {
  return suit === "h" || suit === "d";
}

export function pokerRank(rank: number): number {
  return rank === 1 ? 14 : rank;
}

export function combinations<T>(items: readonly T[], k: number): T[][] {
  const out: T[][] = [];
  const walk = (start: number, acc: T[]) => {
    if (acc.length === k) {
      out.push([...acc]);
      return;
    }
    for (let i = start; i <= items.length - (k - acc.length); i++) {
      acc.push(items[i]);
      walk(i + 1, acc);
      acc.pop();
    }
  };
  if (k >= 0 && k <= items.length) walk(0, []);
  return out;
}
