import assert from "node:assert/strict";
import { type Card, type Suit } from "../lib/cards";
import {
  applyAction,
  chooseAiAction,
  dealerHit,
  dealerShouldHit,
  handValue,
  insuranceReturn,
  isBlackjack,
  settle,
  startRound,
  takeInsurance,
} from "../lib/blackjack";
import { bestHand, act, aiMove, award, legalActions, stacksTotal, startHand, type Seat } from "../lib/poker";
import { betWins, settleRoulette, spinWheel } from "../lib/roulette";
import { PAYLINES, scoreGrid, spinReels, type SymbolId } from "../lib/slots";
import { dealSequence, handTotal, outcomeOf, pip, settleBaccarat } from "../lib/baccarat";

function card(rank: number, suit: Suit, id = `${suit}${rank}`): Card {
  return { rank, suit, id };
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function testHands() {
  assert.equal(handValue([card(1, "s"), card(13, "h")]).total, 21);
  assert.equal(isBlackjack([card(1, "s"), card(13, "h")]), true);
  assert.equal(handValue([card(1, "s"), card(1, "d")]).total, 12);
  assert.equal(handValue([card(1, "s"), card(1, "d")]).soft, true);
  assert.equal(handValue([card(1, "s"), card(1, "d"), card(9, "c")]).total, 21);
  assert.equal(handValue([card(10, "s"), card(6, "h"), card(6, "d")]).bust, true);
  assert.equal(dealerShouldHit([card(1, "s"), card(6, "h")]), false);
  assert.equal(dealerShouldHit([card(10, "s"), card(6, "h")]), true);
  assert.equal(isBlackjack([card(1, "s"), card(9, "h"), card(1, "d")]), false);
}

function testPokerRanks() {
  const royal = bestHand([card(1, "s"), card(13, "s"), card(12, "s"), card(11, "s"), card(10, "s")]);
  assert.equal(royal.name, "Royal flush");
  const steel = bestHand([card(1, "h"), card(2, "h"), card(3, "h"), card(4, "h"), card(5, "h")]);
  const sixHigh = bestHand([card(2, "d"), card(3, "d"), card(4, "d"), card(5, "d"), card(6, "d")]);
  assert.ok(sixHigh.score > steel.score);
  assert.ok(royal.score > sixHigh.score);
  const wheel = bestHand([card(1, "s"), card(2, "h"), card(3, "d"), card(4, "c"), card(5, "s")]);
  assert.equal(wheel.name, "Straight");
  const sixStraight = bestHand([card(2, "s"), card(3, "h"), card(4, "d"), card(5, "c"), card(6, "s")]);
  assert.ok(sixStraight.score > wheel.score);
  const quads = bestHand([card(9, "s"), card(9, "h"), card(9, "d"), card(9, "c"), card(2, "s")]);
  const boat = bestHand([card(8, "s"), card(8, "h"), card(8, "d"), card(3, "c"), card(3, "s")]);
  const flush = bestHand([card(2, "c"), card(5, "c"), card(9, "c"), card(11, "c"), card(13, "c")]);
  assert.equal(quads.name, "Four of a kind");
  assert.equal(boat.name, "Full house");
  assert.equal(flush.name, "Flush");
  assert.ok(quads.score > boat.score && boat.score > flush.score);
  const aces = bestHand([card(1, "s"), card(1, "h"), card(13, "d"), card(4, "c"), card(2, "s")]);
  const kings = bestHand([card(13, "s"), card(13, "h"), card(12, "d"), card(4, "c"), card(2, "s")]);
  assert.ok(aces.score > kings.score);
  const board = [card(2, "c"), card(2, "d"), card(7, "h"), card(8, "s"), card(13, "c")];
  const full = bestHand([card(7, "s"), card(7, "d"), ...board]);
  assert.equal(full.name, "Full house");
}

function seat(partial: Partial<Seat> & Pick<Seat, "id" | "committed" | "hole" | "folded">): Seat {
  return {
    stack: 0,
    streetBet: partial.committed,
    allIn: true,
    acted: true,
    ...partial,
  };
}

function testSidePot() {
  const board = [card(2, "c"), card(5, "d"), card(8, "h"), card(9, "s"), card(3, "c")];
  const hand = award(
    {
      seats: [
        seat({ id: "player", committed: 100, hole: [card(13, "s"), card(13, "h")], folded: false }),
        seat({ id: "hana", committed: 50, hole: [card(1, "s"), card(1, "d")], folded: false }),
        seat({ id: "rin", committed: 50, hole: [card(12, "c"), card(12, "d")], folded: true }),
      ],
      button: 0,
      deck: [],
      board,
      street: "river",
      currentBet: 100,
      minRaise: 10,
      toAct: null,
      sb: 5,
      bb: 10,
      revealed: false,
      handOver: false,
      log: [],
      winners: [],
      shown: [],
    },
    true,
  );
  const player = hand.seats.find((entry) => entry.id === "player")!;
  const hana = hand.seats.find((entry) => entry.id === "hana")!;
  const rin = hand.seats.find((entry) => entry.id === "rin")!;
  assert.equal(hana.stack, 150);
  assert.equal(player.stack, 50);
  assert.equal(rin.stack, 0);
  assert.equal(player.stack + hana.stack + rin.stack, 200);
}

function testPokerPlay() {
  const rng = mulberry32(7);
  const hand = startHand(
    [
      { id: "player", stack: 200 },
      { id: "hana", stack: 200 },
    ],
    0,
    rng,
  );
  assert.equal(stacksTotal(hand), 400);
  assert.equal(hand.seats[0].streetBet, 5);
  assert.equal(hand.seats[1].streetBet, 10);
  assert.equal(hand.toAct, 0);
  assert.equal(hand.seats[0].hole![0].id === hand.seats[0].hole![1].id, false);

  let cursor = hand;
  let guard = 0;
  while (!cursor.handOver && guard < 40) {
    const index = cursor.toAct;
    assert.notEqual(index, null);
    const legal = legalActions(cursor, index!);
    assert.equal(legal.canAct, true);
    const move = index === 0 ? { type: "call" as const } : aiMove(cursor, index!, rng);
    if (move.type === "check" && !legal.canCheck) cursor = act(cursor, index!, { type: "call" });
    else if (move.type === "call" && !legal.canCall) cursor = act(cursor, index!, legal.canCheck ? { type: "check" } : { type: "fold" });
    else cursor = act(cursor, index!, move);
    assert.equal(stacksTotal(cursor), 400);
    guard += 1;
  }
  assert.equal(cursor.handOver, true);
  assert.equal(stacksTotal(cursor), 400);

  for (let seed = 1; seed <= 80; seed++) {
    const random = mulberry32(seed);
    const seats = seed % 2 === 0
      ? [
          { id: "player" as const, stack: 180 },
          { id: "hana" as const, stack: 220 },
          { id: "rin" as const, stack: 160 },
        ]
      : [
          { id: "player" as const, stack: 150 },
          { id: "hana" as const, stack: 150 },
        ];
    let play = startHand(seats, seed, random);
    const total = stacksTotal(play);
    let steps = 0;
    while (!play.handOver && steps < 60) {
      const index = play.toAct;
      if (index === null) throw new Error(`No actor on seed ${seed}`);
      const before = play;
      play = act(play, index, aiMove(play, index, random));
      if (play === before) throw new Error(`Stalled on seed ${seed} street ${play.street}`);
      steps += 1;
    }
    if (!play.handOver) throw new Error(`Unfinished seed ${seed}`);
    assert.equal(stacksTotal(play), total, `chips leaked on seed ${seed}`);
  }
}

function testFold() {
  let hand = startHand(
    [
      { id: "player", stack: 100 },
      { id: "hana", stack: 100 },
    ],
    0,
    mulberry32(1),
  );
  hand = act(hand, hand.toAct!, { type: "fold" });
  assert.equal(hand.handOver, true);
  assert.equal(stacksTotal(hand), 200);
  assert.equal(hand.revealed, false);
  const winner = hand.seats.find((seat) => seat.stack > 100);
  assert.ok(winner);
}

function testRoulette() {
  assert.equal(betWins({ id: "a", kind: "red", amount: 10 }, 19), true);
  assert.equal(betWins({ id: "b", kind: "black", amount: 10 }, 19), false);
  assert.equal(betWins({ id: "c", kind: "odd", amount: 10 }, 19), true);
  assert.equal(betWins({ id: "d", kind: "high", amount: 10 }, 19), true);
  assert.equal(betWins({ id: "e", kind: "dozen", amount: 10, n: 2 }, 19), true);
  assert.equal(betWins({ id: "f", kind: "column", amount: 10, n: 1 }, 19), true);
  assert.equal(betWins({ id: "g", kind: "red", amount: 10 }, 0), false);
  assert.equal(betWins({ id: "h", kind: "straight", amount: 5, n: 0 }, 0), true);
  const settled = settleRoulette(
    [
      { id: "s", kind: "straight", amount: 5, n: 19 },
      { id: "r", kind: "red", amount: 10 },
    ],
    19,
  );
  assert.equal(settled.returned, 5 * 36 + 10 * 2);
  const seen = new Set<number>();
  const rng = mulberry32(3);
  for (let i = 0; i < 400; i++) seen.add(spinWheel(rng));
  assert.equal(seen.size > 20, true);
}

function testBaccarat() {
  const natural = dealSequence([
    card(1, "s"),
    card(5, "h"),
    card(7, "d"),
    card(2, "c"),
  ]);
  assert.equal(handTotal(natural.player), 8);
  assert.equal(natural.natural, true);
  assert.equal(natural.player.length, 2);
  assert.equal(natural.banker.length, 2);

  const drawEight = dealSequence([
    card(4, "s"),
    card(1, "h"),
    card(1, "d"),
    card(2, "c"),
    card(8, "s"),
  ]);
  assert.equal(drawEight.player.length, 3);
  assert.equal(drawEight.banker.length, 2);

  const bankerDraws = dealSequence([
    card(2, "s"),
    card(1, "h"),
    card(3, "d"),
    card(2, "c"),
    card(9, "s"),
    card(13, "h"),
  ]);
  assert.equal(bankerDraws.player.length, 3);
  assert.equal(bankerDraws.banker.length, 3);
  assert.equal(pip(13), 0);
  assert.equal(outcomeOf(natural), "player");
  const returned = settleBaccarat(natural, [
    { side: "player", amount: 20 },
    { side: "banker", amount: 20 },
  ]);
  assert.equal(returned, 40);
  const tie = dealSequence([
    card(10, "s"),
    card(10, "h"),
    card(9, "d"),
    card(9, "c"),
  ]);
  assert.equal(outcomeOf(tie), "tie");
  assert.equal(settleBaccarat(tie, [{ side: "tie", amount: 10 }, { side: "player", amount: 15 }]), 10 * 9 + 15);
  assert.equal(settleBaccarat(natural, [{ side: "banker", amount: 20 }]), 0);
  const bankerWin = dealSequence([
    card(10, "s"),
    card(9, "h"),
    card(5, "d"),
    card(10, "c"),
  ]);
  assert.equal(outcomeOf(bankerWin), "banker");
  assert.equal(settleBaccarat(bankerWin, [{ side: "banker", amount: 20 }]), 20 + 19);
}

function testBlackjackRound() {
  const round = startRound(
    [
      { id: "naomi", bet: 20 },
      { id: "player", bet: 20 },
      { id: "yuki", bet: 40 },
    ],
    mulberry32(11),
  );
  assert.equal(round.hands.length, 3);
  assert.equal(round.dealer.length, 2);
  let cursor = round;
  let guard = 0;
  if (cursor.phase === "insurance") {
    const insured = takeInsurance(cursor, true);
    assert.equal(insured.charge, 10);
    cursor = insured.round;
  }
  while (cursor.phase === "acting" && guard < 20) {
    const hand = cursor.hands[cursor.turn];
    const up = cursor.dealer[0];
    const action = hand.id === "player" ? "stand" : chooseAiAction(hand.id, hand.cards, up);
    cursor = applyAction(cursor, action).round;
    guard += 1;
  }
  while (cursor.phase === "dealer" && guard < 30) {
    cursor = dealerHit(cursor);
    guard += 1;
  }
  if (cursor.phase !== "done") cursor = settle(cursor);
  assert.equal(cursor.phase, "done");
  const player = cursor.hands.find((hand) => hand.id === "player")!;
  assert.ok(player.result);
  if (player.insurance) {
    const back = insuranceReturn(player, cursor.dealer);
    assert.ok(back === 0 || back === player.insurance * 3);
  }
}

function testSlots() {
  const grid: SymbolId[][] = [
    ["seven", "cherry", "bell"],
    ["seven", "cherry", "star"],
    ["seven", "wild", "gem"],
  ];
  const scored = scoreGrid(grid, 20);
  assert.ok(scored.lines.some((line) => line.symbol === "seven"));
  assert.equal(PAYLINES.length, 5);
  const rng = mulberry32(99);
  let stake = 0;
  let back = 0;
  for (let i = 0; i < 20000; i++) {
    const bet = 10;
    stake += bet;
    back += scoreGrid(spinReels(rng), bet).total;
  }
  const rtp = back / stake;
  console.log(`slots rtp ${rtp.toFixed(3)}`);
  assert.ok(rtp > 0.9 && rtp < 1.08, `unexpected rtp ${rtp}`);
}

testHands();
testPokerRanks();
testSidePot();
testFold();
testPokerPlay();
testRoulette();
testBaccarat();
testBlackjackRound();
testSlots();
console.log("rules ok");
