import { type Card, combinations, draw, makeDeck, pokerRank, shuffle } from "@/lib/cards";

export type SeatId = "player" | "hana" | "rin";
export type Street = "preflop" | "flop" | "turn" | "river";

export type Seat = {
  id: SeatId;
  stack: number;
  hole: [Card, Card] | null;
  committed: number;
  streetBet: number;
  folded: boolean;
  allIn: boolean;
  acted: boolean;
};

export type Winner = { id: SeatId; amount: number; handName?: string };
export type ShownHand = { id: SeatId; name: string; score: number };

export type PokerHand = {
  seats: Seat[];
  button: number;
  deck: Card[];
  board: Card[];
  street: Street | "showdown";
  currentBet: number;
  minRaise: number;
  toAct: number | null;
  sb: number;
  bb: number;
  revealed: boolean;
  handOver: boolean;
  log: string[];
  winners: Winner[];
  shown: ShownHand[];
};

export type PokerMove =
  | { type: "fold" }
  | { type: "check" }
  | { type: "call" }
  | { type: "raise"; to: number };

export const HAND_NAMES = [
  "High card",
  "Pair",
  "Two pair",
  "Three of a kind",
  "Straight",
  "Flush",
  "Full house",
  "Four of a kind",
  "Straight flush",
];

export function bestHand(cards: readonly Card[]): { score: number; name: string; five: Card[] } {
  const pool = cards.length === 5 ? [cards] : combinations(cards, 5);
  let best: { score: number; name: string; five: Card[] } | null = null;
  for (const five of pool) {
    const scored = scoreFive(five as Card[]);
    if (!best || scored.score > best.score) best = { ...scored, five: [...(five as Card[])] };
  }
  if (!best) throw new Error("A hand needs at least five cards.");
  return best;
}

export function scoreFive(cards: Card[]): { score: number; name: string } {
  const ranks = cards.map((card) => pokerRank(card.rank)).sort((a, b) => b - a);
  const flush = cards.every((card) => card.suit === cards[0].suit);
  const counts = new Map<number, number>();
  for (const rank of ranks) counts.set(rank, (counts.get(rank) ?? 0) + 1);
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const unique = [...new Set(ranks)];
  let straightHigh = 0;
  if (unique.length === 5) {
    if (unique[0] - unique[4] === 4) straightHigh = unique[0];
    else if (unique.join(",") === "14,5,4,3,2") straightHigh = 5;
  }
  const kickers = groups.map(([rank]) => rank);
  let category = 0;
  let key = kickers;
  if (flush && straightHigh) {
    category = 8;
    key = [straightHigh];
  } else if (groups[0][1] === 4) {
    category = 7;
    key = [groups[0][0], groups[1][0]];
  } else if (groups[0][1] === 3 && groups[1][1] === 2) {
    category = 6;
    key = [groups[0][0], groups[1][0]];
  } else if (flush) {
    category = 5;
    key = unique;
  } else if (straightHigh) {
    category = 4;
    key = [straightHigh];
  } else if (groups[0][1] === 3) {
    category = 3;
    key = kickers;
  } else if (groups[0][1] === 2 && groups[1][1] === 2) {
    category = 2;
    key = kickers;
  } else if (groups[0][1] === 2) {
    category = 1;
    key = kickers;
  }
  const name = category === 8 && straightHigh === 14 ? "Royal flush" : HAND_NAMES[category];
  return { score: encode(category, key), name };
}

function encode(category: number, kickers: number[]): number {
  let value = category;
  for (let i = 0; i < 5; i++) value = value * 15 + (kickers[i] ?? 0);
  return value;
}

export function categoryOf(score: number): number {
  let value = score;
  for (let i = 0; i < 5; i++) value = Math.floor(value / 15);
  return value;
}

export function startHand(
  stacks: { id: SeatId; stack: number }[],
  button: number,
  rng: () => number = Math.random,
  blinds: { sb: number; bb: number } = { sb: 5, bb: 10 },
): PokerHand {
  const n = stacks.length;
  const buttonIndex = ((button % n) + n) % n;
  return dealAndOpen(stacks, buttonIndex, rng, blinds);
}

function dealAndOpen(
  stacks: { id: SeatId; stack: number }[],
  buttonIndex: number,
  rng: () => number,
  blinds: { sb: number; bb: number },
): PokerHand {
  const n = stacks.length;
  let deck = shuffle(makeDeck(1), rng);
  let seats: Seat[] = stacks.map((seat) => ({
    id: seat.id,
    stack: seat.stack,
    hole: null,
    committed: 0,
    streetBet: 0,
    folded: seat.stack <= 0,
    allIn: false,
    acted: false,
  }));
  const sbIndex = n === 2 ? buttonIndex : (buttonIndex + 1) % n;
  const bbIndex = (sbIndex + 1) % n;
  seats = seats.map((seat, index) => {
    if (seat.folded) return seat;
    if (index === sbIndex) return postBlind(seat, blinds.sb);
    if (index === bbIndex) return postBlind(seat, blinds.bb);
    return seat;
  });
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < n; i++) {
      const index = (sbIndex + i) % n;
      if (seats[index].folded && seats[index].stack <= 0 && seats[index].committed === 0) continue;
      const pulled = draw(deck, 1);
      deck = pulled.deck;
      const hole = seats[index].hole;
      seats[index] = {
        ...seats[index],
        hole: hole ? [hole[0], pulled.cards[0]] : [pulled.cards[0], pulled.cards[0]],
      };
    }
  }
  const currentBet = Math.max(...seats.map((seat) => seat.streetBet), 0);
  const hand: PokerHand = {
    seats,
    button: buttonIndex,
    deck,
    board: [],
    street: "preflop",
    currentBet,
    minRaise: blinds.bb,
    toAct: null,
    sb: blinds.sb,
    bb: blinds.bb,
    revealed: false,
    handOver: false,
    log: [`Blinds are ${blinds.sb} / ${blinds.bb}.`],
    winners: [],
    shown: [],
  };
  const actor = nextActor(hand, bbIndex);
  return proceed({ ...hand, toAct: actor });
}

function postBlind(seat: Seat, amount: number): Seat {
  const pay = Math.min(seat.stack, amount);
  const stack = seat.stack - pay;
  return {
    ...seat,
    stack,
    committed: seat.committed + pay,
    streetBet: seat.streetBet + pay,
    allIn: stack === 0,
  };
}

export function potSize(hand: PokerHand): number {
  return hand.seats.reduce((sum, seat) => sum + seat.committed, 0);
}

export function legalActions(hand: PokerHand, index: number) {
  const seat = hand.seats[index];
  const toCall = Math.max(0, hand.currentBet - seat.streetBet);
  const canAct = !hand.handOver && hand.toAct === index && !!seat && !seat.folded && !seat.allIn;
  const maxRaiseTo = seat ? seat.streetBet + seat.stack : 0;
  const minRaiseTo = hand.currentBet === 0 ? hand.bb : hand.currentBet + hand.minRaise;
  return {
    canAct,
    canFold: canAct,
    canCheck: canAct && toCall === 0,
    canCall: canAct && toCall > 0 && seat.stack > 0,
    callAmount: seat ? Math.min(seat.stack, toCall) : 0,
    canRaise: canAct && !!seat && seat.stack > toCall,
    minRaiseTo: Math.min(maxRaiseTo, minRaiseTo),
    maxRaiseTo,
    toCall,
  };
}

export function act(hand: PokerHand, index: number, move: PokerMove): PokerHand {
  const legal = legalActions(hand, index);
  if (!legal.canAct) return hand;
  const seat = hand.seats[index];
  if (move.type === "fold") {
    if (!legal.canFold) return hand;
    return afterMove(hand, index, { ...seat, folded: true, acted: true }, hand.currentBet, hand.minRaise, `${seat.id} folds.`);
  }
  if (move.type === "check") {
    if (!legal.canCheck) return hand;
    return afterMove(hand, index, { ...seat, acted: true }, hand.currentBet, hand.minRaise, `${seat.id} checks.`);
  }
  if (move.type === "call") {
    if (!legal.canCall) return hand;
    const pay = legal.callAmount;
    const stack = seat.stack - pay;
    return afterMove(
      hand,
      index,
      {
        ...seat,
        stack,
        committed: seat.committed + pay,
        streetBet: seat.streetBet + pay,
        allIn: stack === 0,
        acted: true,
      },
      hand.currentBet,
      hand.minRaise,
      `${seat.id} calls ${pay}.`,
    );
  }
  if (!legal.canRaise) return hand;
  const target = Math.max(legal.minRaiseTo, Math.min(move.to, legal.maxRaiseTo));
  if (target <= seat.streetBet) return hand;
  const pay = target - seat.streetBet;
  if (pay > seat.stack) return hand;
  const stack = seat.stack - pay;
  const raiseSize = target - hand.currentBet;
  const seats = hand.seats.map((other, seatIndex) => {
    if (seatIndex === index) {
      return {
        ...seat,
        stack,
        committed: seat.committed + pay,
        streetBet: target,
        allIn: stack === 0,
        acted: true,
      };
    }
    if (!other.folded && !other.allIn) return { ...other, acted: false };
    return other;
  });
  const next: PokerHand = {
    ...hand,
    seats,
    currentBet: target,
    minRaise: Math.max(hand.minRaise, raiseSize),
    log: [...hand.log, `${seat.id} raises to ${target}.`],
  };
  return proceed({ ...next, toAct: nextActor(next, index) });
}

function afterMove(hand: PokerHand, index: number, seat: Seat, currentBet: number, minRaise: number, line: string): PokerHand {
  const seats = hand.seats.map((other, seatIndex) => (seatIndex === index ? seat : other));
  const next: PokerHand = { ...hand, seats, currentBet, minRaise, log: [...hand.log, line] };
  return proceed({ ...next, toAct: nextActor(next, index) });
}

function nextActor(hand: PokerHand, from: number): number | null {
  const n = hand.seats.length;
  for (let step = 1; step <= n; step++) {
    const index = (from + step) % n;
    const seat = hand.seats[index];
    if (seat.folded || seat.allIn) continue;
    if (seat.acted && seat.streetBet === hand.currentBet) continue;
    return index;
  }
  return null;
}

export function bettingDone(hand: PokerHand): boolean {
  const contenders = hand.seats.filter((seat) => !seat.folded);
  if (contenders.length <= 1) return true;
  const actors = contenders.filter((seat) => !seat.allIn);
  if (actors.length <= 1) {
    if (actors.length === 0) return true;
    return actors[0].streetBet === hand.currentBet;
  }
  return actors.every((seat) => seat.acted && seat.streetBet === hand.currentBet);
}

function proceed(hand: PokerHand): PokerHand {
  if (hand.handOver) return hand;
  const contenders = hand.seats.filter((seat) => !seat.folded);
  if (contenders.length <= 1) return award(hand, false);
  if (!bettingDone(hand)) {
    if (hand.toAct === null) {
      const fallback = hand.seats.findIndex((seat) => !seat.folded && !seat.allIn && !(seat.acted && seat.streetBet === hand.currentBet));
      if (fallback === -1) return award(hand, hand.street === "river");
      return { ...hand, toAct: fallback };
    }
    return hand;
  }
  if (hand.street === "river") return award(hand, true);
  const nextStreet: Street = hand.street === "preflop" ? "flop" : hand.street === "flop" ? "turn" : "river";
  const count = nextStreet === "flop" ? 3 : 1;
  const pulled = draw(hand.deck, count);
  const opened: PokerHand = {
    ...hand,
    deck: pulled.deck,
    board: [...hand.board, ...pulled.cards],
    street: nextStreet,
    currentBet: 0,
    minRaise: hand.bb,
    seats: hand.seats.map((seat) => ({ ...seat, streetBet: 0, acted: false })),
    toAct: null,
    log: [...hand.log, nextStreet === "flop" ? "The flop falls." : nextStreet === "turn" ? "Turn." : "River."],
  };
  if (bettingDone(opened)) return proceed(opened);
  const actor = nextActor(opened, opened.button);
  return { ...opened, toAct: actor };
}

export function award(hand: PokerHand, reveal: boolean): PokerHand {
  const board = hand.board;
  const shown: ShownHand[] = [];
  if (reveal) {
    for (const seat of hand.seats) {
      if (seat.folded || !seat.hole) continue;
      const scored = bestHand([...seat.hole, ...board]);
      shown.push({ id: seat.id, name: scored.name, score: scored.score });
    }
  }
  const levels = [...new Set(hand.seats.map((seat) => seat.committed))].filter((level) => level > 0).sort((a, b) => a - b);
  const won = new Map<SeatId, number>();
  const names = new Map<SeatId, string>();
  let previous = 0;
  for (const level of levels) {
    const layer = level - previous;
    previous = level;
    const contributors = hand.seats.filter((seat) => seat.committed >= level);
    const amount = layer * contributors.length;
    const eligible = contributors.filter((seat) => !seat.folded);
    if (eligible.length === 0 || amount <= 0) continue;
    if (!reveal || eligible.length === 1) {
      const only = eligible[0];
      won.set(only.id, (won.get(only.id) ?? 0) + amount);
      continue;
    }
    const scored = eligible.map((seat) => {
      const best = bestHand([...seat.hole!, ...board]);
      return { seat, best };
    });
    const top = Math.max(...scored.map((entry) => entry.best.score));
    const winners = scored.filter((entry) => entry.best.score === top);
    const share = Math.floor(amount / winners.length);
    let remainder = amount - share * winners.length;
    for (const winner of winners) {
      const bonus = remainder > 0 ? 1 : 0;
      remainder -= bonus;
      won.set(winner.seat.id, (won.get(winner.seat.id) ?? 0) + share + bonus);
      names.set(winner.seat.id, winner.best.name);
    }
  }
  const seats = hand.seats.map((seat) => ({
    ...seat,
    stack: seat.stack + (won.get(seat.id) ?? 0),
    committed: 0,
    streetBet: 0,
  }));
  const winners = [...won.entries()].filter(([, amount]) => amount > 0).map(([id, amount]) => ({
    id,
    amount,
    handName: names.get(id),
  }));
  return {
    ...hand,
    seats,
    revealed: reveal,
    handOver: true,
    toAct: null,
    street: reveal ? "showdown" : hand.street,
    winners,
    shown,
    log: [...hand.log, describeWinners(winners, reveal)],
  };
}

function describeWinners(winners: Winner[], reveal: boolean): string {
  if (winners.length === 0) return "The pot is empty.";
  if (!reveal && winners.length === 1) return `${winners[0].id} wins the pot.`;
  return winners.map((winner) => `${winner.id} wins ${winner.amount}${winner.handName ? ` with ${winner.handName}` : ""}`).join(". ");
}

export function forceFold(hand: PokerHand, id: SeatId): PokerHand {
  if (hand.handOver) return hand;
  const index = hand.seats.findIndex((seat) => seat.id === id);
  if (index < 0 || hand.seats[index].folded) return hand;
  const seats = hand.seats.map((seat, seatIndex) =>
    seatIndex === index ? { ...seat, folded: true, acted: true } : seat,
  );
  const next: PokerHand = {
    ...hand,
    seats,
    log: [...hand.log, `${id} folds.`],
    toAct: hand.toAct === index ? nextActor({ ...hand, seats }, index) : hand.toAct,
  };
  return proceed(next);
}

export function stacksTotal(hand: Pick<PokerHand, "seats">): number {
  return hand.seats.reduce((sum, seat) => sum + seat.stack + seat.committed, 0);
}

export function aiMove(hand: PokerHand, index: number, rng: () => number = Math.random): PokerMove {
  const seat = hand.seats[index];
  const legal = legalActions(hand, index);
  if (!seat.hole || !legal.canAct) return { type: "check" };
  const strength = estimateStrength(seat.hole, hand.board);
  const pot = potSize(hand);
  const style = seat.id === "hana" ? "hana" : "rin";
  const bluff = rng() < (style === "hana" ? 0.14 : 0.04);
  const wantRaise =
    strength >= (style === "hana" ? 0.72 : 0.84) ||
    (style === "hana" && strength >= 0.58 && legal.toCall === 0) ||
    (bluff && strength < 0.38 && legal.toCall <= pot * 0.35);
  if (legal.toCall === 0) {
    if (wantRaise && legal.canRaise) return { type: "raise", to: raiseTarget(hand, index, rng) };
    return { type: "check" };
  }
  const potOdds = legal.toCall / (pot + legal.toCall);
  if (wantRaise && legal.canRaise && strength >= 0.7) return { type: "raise", to: raiseTarget(hand, index, rng) };
  if (strength >= 0.56 || (style === "hana" && strength + 0.08 >= potOdds && legal.toCall <= pot * 0.75)) {
    return { type: "call" };
  }
  if (style === "rin" && strength >= 0.42 && legal.toCall <= pot * 0.28) return { type: "call" };
  if (strength >= potOdds + 0.18) return { type: "call" };
  if (bluff && legal.canRaise && legal.toCall < seat.stack * 0.2) return { type: "raise", to: raiseTarget(hand, index, rng) };
  return { type: "fold" };
}

function raiseTarget(hand: PokerHand, index: number, rng: () => number): number {
  const legal = legalActions(hand, index);
  const pot = potSize(hand);
  const sized = hand.currentBet === 0 ? Math.max(hand.bb, Math.min(pot, hand.bb * (rng() < 0.5 ? 2 : 3))) : hand.currentBet + pot + legal.toCall;
  return Math.max(legal.minRaiseTo, Math.min(legal.maxRaiseTo, sized));
}

export function estimateStrength(hole: [Card, Card], board: readonly Card[]): number {
  if (board.length === 0) return preflopStrength(hole);
  const made = bestHand([...hole, ...board]);
  const category = categoryOf(made.score);
  const base = [0.32, 0.52, 0.66, 0.74, 0.78, 0.83, 0.9, 0.96, 0.99][category] ?? 0.3;
  let bonus = 0;
  if (board.length < 5) {
    const cards = [...hole, ...board];
    const suits = new Map<string, number>();
    for (const card of cards) suits.set(card.suit, (suits.get(card.suit) ?? 0) + 1);
    if ([...suits.values()].some((count) => count === 4)) bonus += 0.1;
    const ranks = [...new Set(cards.map((card) => pokerRank(card.rank)))].sort((a, b) => a - b);
    if (hasOpenEnded(ranks)) bonus += 0.08;
  }
  return Math.min(0.99, base + bonus);
}

function preflopStrength(hole: [Card, Card]): number {
  const [a, b] = [...hole].map((card) => pokerRank(card.rank)).sort((x, y) => y - x);
  const suited = hole[0].suit === hole[1].suit;
  const gap = a - b;
  if (a === b) return Math.min(0.96, 0.48 + a / 35);
  let score = 0.18 + a / 40 + b / 80;
  if (suited) score += 0.07;
  if (gap === 1) score += 0.05;
  if (a === 14 && b >= 13) score += 0.18;
  else if (a === 14 && b >= 10) score += 0.1;
  return Math.max(0.08, Math.min(0.9, score));
}

function hasOpenEnded(ranks: number[]): boolean {
  const set = new Set(ranks);
  for (let low = 2; low <= 10; low++) {
    let run = 0;
    for (let rank = low; rank < low + 4; rank++) if (set.has(rank)) run += 1;
    if (run === 4) return true;
  }
  return false;
}

export function seatName(id: SeatId): string {
  if (id === "player") return "You";
  if (id === "hana") return "Hana";
  return "Rin";
}
