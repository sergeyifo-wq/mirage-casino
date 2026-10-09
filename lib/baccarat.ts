import { type Card, makeDeck, shuffle } from "@/lib/cards";

export type Side = "player" | "banker" | "tie";

export type BaccaratBet = { side: Side; amount: number };

export type BaccaratHand = {
  player: Card[];
  banker: Card[];
  notes: string[];
  natural: boolean;
};

export function pip(rank: number): number {
  if (rank === 1) return 1;
  if (rank >= 10) return 0;
  return rank;
}

export function handTotal(cards: readonly Card[]): number {
  return cards.reduce((sum, card) => sum + pip(card.rank), 0) % 10;
}

export function dealSequence(deck: readonly Card[]): BaccaratHand {
  let index = 0;
  const take = () => {
    const card = deck[index];
    if (!card) throw new Error("The shoe ran out.");
    index += 1;
    return card;
  };
  const player: Card[] = [take()];
  const banker: Card[] = [take()];
  player.push(take());
  banker.push(take());
  const notes: string[] = [];
  const playerTwo = handTotal(player);
  const bankerTwo = handTotal(banker);
  if (playerTwo >= 8 || bankerTwo >= 8) {
    const who =
      playerTwo >= 8 && bankerTwo >= 8
        ? "Both sides hold a natural."
        : `${playerTwo >= 8 ? "Player" : "Banker"} holds a natural ${Math.max(playerTwo, bankerTwo)}.`;
    notes.push(`${who} No third card is drawn.`);
    return { player, banker, notes, natural: true };
  }
  let third: Card | null = null;
  if (playerTwo <= 5) {
    third = take();
    player.push(third);
    notes.push(`Player shows ${playerTwo} and draws.`);
  } else {
    notes.push(`Player shows ${playerTwo} and stands.`);
  }
  if (bankerDraws(bankerTwo, third)) {
    banker.push(take());
    notes.push(bankerNote(bankerTwo, third, true));
  } else {
    notes.push(bankerNote(bankerTwo, third, false));
  }
  return { player, banker, notes, natural: false };
}

export function dealBaccarat(rng: () => number = Math.random): BaccaratHand {
  return dealSequence(shuffle(makeDeck(6), rng));
}

export function bankerDraws(total: number, third: Card | null): boolean {
  if (!third) return total <= 5;
  const value = pip(third.rank);
  if (total <= 2) return true;
  if (total === 3) return value !== 8;
  if (total === 4) return value >= 2 && value <= 7;
  if (total === 5) return value >= 4 && value <= 7;
  if (total === 6) return value === 6 || value === 7;
  return false;
}

function bankerNote(total: number, third: Card | null, drew: boolean): string {
  if (!third) return `Banker shows ${total} and ${drew ? "draws" : "stands"}.`;
  return `Banker shows ${total}. The player's third card is ${pip(third.rank)}, so the banker ${drew ? "draws" : "stands"}.`;
}

export function outcomeOf(hand: BaccaratHand): Side {
  const player = handTotal(hand.player);
  const banker = handTotal(hand.banker);
  if (player > banker) return "player";
  if (banker > player) return "banker";
  return "tie";
}

export function settleBaccarat(hand: BaccaratHand, bets: readonly BaccaratBet[]): number {
  const outcome = outcomeOf(hand);
  let returned = 0;
  for (const bet of bets) {
    if (outcome === "tie" && bet.side !== "tie") {
      returned += bet.amount;
      continue;
    }
    if (bet.side !== outcome) continue;
    if (bet.side === "tie") returned += bet.amount * 9;
    else if (bet.side === "banker") returned += bet.amount + Math.floor(bet.amount * 0.95);
    else returned += bet.amount * 2;
  }
  return returned;
}
