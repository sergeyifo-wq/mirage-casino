import { type Card, draw, makeDeck, shuffle } from "@/lib/cards";

export type BJId = "player" | "naomi" | "yuki";
export type BJAction = "hit" | "stand" | "double";
export type BJResult = "blackjack" | "win" | "push" | "lose" | "bust";

export type BJHand = {
  id: BJId;
  cards: Card[];
  bet: number;
  stood: boolean;
  doubled: boolean;
  finished: boolean;
  insurance: number;
  result?: BJResult;
  returned: number;
};

export type BJPhase = "insurance" | "acting" | "dealer" | "done";

export type BJRound = {
  deck: Card[];
  hands: BJHand[];
  dealer: Card[];
  dealerHoleRevealed: boolean;
  phase: BJPhase;
  turn: number;
  message: string;
  insuranceResolved: boolean;
};

export function handValue(cards: readonly Card[]): { total: number; soft: boolean; bust: boolean } {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.rank === 1) {
      aces += 1;
      total += 11;
    } else {
      total += Math.min(card.rank, 10);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return { total, soft: aces > 0 && total <= 21, bust: total > 21 };
}

export function isBlackjack(cards: readonly Card[]): boolean {
  return cards.length === 2 && handValue(cards).total === 21;
}

export function dealerShouldHit(cards: readonly Card[]): boolean {
  const value = handValue(cards);
  return !value.bust && value.total < 17;
}

export function dealerUpcard(round: BJRound): Card | null {
  return round.dealer[0] ?? null;
}

export function startRound(
  bets: { id: BJId; bet: number }[],
  rng: () => number = Math.random,
): BJRound {
  let deck = shuffle(makeDeck(4), rng);
  const dealOne = () => {
    const next = draw(deck, 1);
    deck = next.deck;
    return next.cards[0];
  };
  const hands: BJHand[] = bets.map((bet) => ({
    id: bet.id,
    cards: [dealOne()],
    bet: bet.bet,
    stood: false,
    doubled: false,
    finished: false,
    insurance: 0,
    returned: 0,
  }));
  const dealer = [dealOne()];
  for (const hand of hands) hand.cards.push(dealOne());
  dealer.push(dealOne());

  const round: BJRound = {
    deck,
    hands,
    dealer,
    dealerHoleRevealed: false,
    phase: "acting",
    turn: 0,
    message: "Cards are out.",
    insuranceResolved: true,
  };

  const up = dealer[0];
  const dealerBJ = isBlackjack(dealer);
  if (up.rank === 1) {
    round.insuranceResolved = false;
    round.phase = "insurance";
    round.message = "Reina shows an ace. Insurance is open, if you want it.";
    return round;
  }
  if (dealerBJ) {
    round.dealerHoleRevealed = true;
    round.message = "Reina turns a blackjack before the table can breathe.";
    return settle(round);
  }
  round.hands = round.hands.map(finishNaturals);
  return jumpToActor({ ...round, message: "Your action." });
}

function finishNaturals(hand: BJHand): BJHand {
  if (!isBlackjack(hand.cards)) return hand;
  return { ...hand, finished: true, stood: true };
}

export function takeInsurance(round: BJRound, yes: boolean): { round: BJRound; charge: number } {
  if (round.phase !== "insurance") return { round, charge: 0 };
  const player = round.hands.find((hand) => hand.id === "player");
  const charge = yes && player ? Math.floor(player.bet / 2) : 0;
  const hands = round.hands.map((hand) =>
    hand.id === "player" ? { ...hand, insurance: charge } : hand,
  );
  const next: BJRound = {
    ...round,
    hands,
    insuranceResolved: true,
    phase: "acting",
  };
  if (isBlackjack(next.dealer)) {
    next.dealerHoleRevealed = true;
    next.message = yes
      ? "The hole card makes a blackjack. Insurance pays."
      : "The hole card makes a blackjack.";
    return { round: settle(next), charge };
  }
  next.hands = next.hands.map(finishNaturals);
  next.message = yes ? "No blackjack underneath. Insurance is gone, and the hand continues." : "No blackjack. The hand continues.";
  return { round: jumpToActor(next), charge };
}

export function applyAction(round: BJRound, action: BJAction): { round: BJRound; charge: number } {
  if (round.phase !== "acting") return { round, charge: 0 };
  const current = round.hands[round.turn];
  if (!current || current.finished) return { round, charge: 0 };
  let deck = round.deck;
  let cards = current.cards;
  let bet = current.bet;
  let charge = 0;
  let doubled = current.doubled;
  const stood = action === "stand" || action === "double";
  if (action === "hit" || action === "double") {
    if (action === "double" && cards.length !== 2) return { round, charge: 0 };
    const pulled = draw(deck, 1);
    deck = pulled.deck;
    cards = [...cards, pulled.cards[0]];
  }
  if (action === "double") {
    charge = current.bet;
    bet = current.bet * 2;
    doubled = true;
  }
  const value = handValue(cards);
  const finished = stood || value.bust || value.total === 21;
  const hands = round.hands.map((hand, index) =>
    index === round.turn ? { ...hand, cards, bet, doubled, stood: finished, finished } : hand,
  );
  const verb =
    action === "stand" ? "stands" : action === "double" ? "doubles" : value.bust ? "busts" : "takes a card";
  return {
    charge,
    round: jumpToActor({
      ...round,
      deck,
      hands,
      message: `${label(current.id)} ${verb}.`,
    }),
  };
}

function jumpToActor(round: BJRound): BJRound {
  let turn = round.hands.findIndex((hand) => !hand.finished);
  if (round.phase === "acting" && round.turn > 0) {
    const later = round.hands.findIndex((hand, index) => index >= round.turn && !hand.finished);
    turn = later;
  }
  if (turn === -1) return enterDealer(round);
  return { ...round, phase: "acting", turn };
}

export function enterDealer(round: BJRound): BJRound {
  const revealed: BJRound = { ...round, dealerHoleRevealed: true };
  const pending = revealed.hands.some((hand) => !handValue(hand.cards).bust && !isBlackjack(hand.cards));
  if (pending && dealerShouldHit(revealed.dealer)) {
    return { ...revealed, phase: "dealer", message: "Reina turns her hole card." };
  }
  return settle({ ...revealed, message: "Reina's hand is finished." });
}

export function dealerHit(round: BJRound): BJRound {
  if (round.phase !== "dealer") return round;
  if (!dealerShouldHit(round.dealer)) return settle(round);
  const pulled = draw(round.deck, 1);
  const dealer = [...round.dealer, pulled.cards[0]];
  const next: BJRound = {
    ...round,
    deck: pulled.deck,
    dealer,
    message: handValue(dealer).bust ? "Reina busts." : `Reina draws to ${handValue(dealer).total}.`,
  };
  if (!dealerShouldHit(dealer)) return settle(next);
  return next;
}

export function settle(round: BJRound): BJRound {
  const dealerValue = handValue(round.dealer);
  const dealerBJ = isBlackjack(round.dealer);
  const hands = round.hands.map((hand) => {
    const value = handValue(hand.cards);
    const playerBJ = isBlackjack(hand.cards);
    let result: BJResult = "lose";
    let returned = 0;
    if (value.bust) {
      result = "bust";
    } else if (playerBJ && dealerBJ) {
      result = "push";
      returned = hand.bet;
    } else if (playerBJ) {
      result = "blackjack";
      returned = Math.round(hand.bet * 2.5);
    } else if (dealerBJ || (!dealerValue.bust && value.total < dealerValue.total)) {
      result = "lose";
    } else if (dealerValue.bust || value.total > dealerValue.total) {
      result = "win";
      returned = hand.bet * 2;
    } else {
      result = "push";
      returned = hand.bet;
    }
    return { ...hand, finished: true, result, returned };
  });
  return {
    ...round,
    hands,
    phase: "done",
    dealerHoleRevealed: true,
    message: summary(hands.find((hand) => hand.id === "player")),
  };
}

function summary(player: BJHand | undefined): string {
  if (!player?.result) return "The hand is settled.";
  if (player.result === "blackjack") return "Blackjack. Reina pays three to two.";
  if (player.result === "win") return "You win the hand.";
  if (player.result === "push") return "Push. Your stake comes back.";
  if (player.result === "bust") return "Bust. The stake stays on the felt.";
  return "Reina takes the hand.";
}

export function insuranceReturn(hand: BJHand, dealer: readonly Card[]): number {
  if (hand.insurance <= 0) return 0;
  return isBlackjack(dealer) ? hand.insurance * 3 : 0;
}

export function chooseAiAction(id: BJId, cards: readonly Card[], upcard: Card): BJAction {
  const value = handValue(cards);
  const up = upcard.rank === 1 ? 11 : Math.min(upcard.rank, 10);
  if (value.bust || value.total >= 21) return "stand";
  if (id === "yuki") return yukiAction(value.total, value.soft, up, cards.length);
  return naomiAction(value.total, value.soft, up, cards.length);
}

function naomiAction(total: number, soft: boolean, up: number, count: number): BJAction {
  if (count === 2 && !soft && total === 11) return "double";
  if (count === 2 && !soft && total === 10 && up <= 9) return "double";
  if (count === 2 && !soft && total === 9 && up >= 3 && up <= 6) return "double";
  if (soft && total >= 19) return "stand";
  if (soft && total === 18) {
    if (count === 2 && up >= 3 && up <= 6) return "double";
    if (up >= 9) return "hit";
    return "stand";
  }
  if (soft) {
    if (count === 2 && total >= 15 && total <= 18 && up >= 4 && up <= 6) return "double";
    return "hit";
  }
  if (total >= 17) return "stand";
  if (total >= 13 && up >= 2 && up <= 6) return "stand";
  if (total === 12 && up >= 4 && up <= 6) return "stand";
  return "hit";
}

function yukiAction(total: number, soft: boolean, up: number, count: number): BJAction {
  if (count === 2 && !soft && total >= 9 && total <= 11 && up <= 9) return "double";
  if (count === 2 && soft && total <= 18 && up >= 3 && up <= 6) return "double";
  if (soft && total >= 19) return "stand";
  if (soft) return "hit";
  if (total >= 17) return "stand";
  if (total >= 14 && total <= 16 && up >= 4 && up <= 6) return "stand";
  return "hit";
}

function label(id: BJId): string {
  if (id === "player") return "You";
  if (id === "naomi") return "Naomi";
  return "Yuki";
}

export function upcardValue(card: Card): number {
  return card.rank === 1 ? 11 : Math.min(card.rank, 10);
}
