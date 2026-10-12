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
import { WHEEL, addRouletteChip, betWins, isRed, roulettePose, settleRoulette, spinWheel, validRouletteBets, type RouletteSpin } from "../lib/roulette";
import { splitChips, validWager } from "../lib/chips";
import { PAYLINES, SYMBOLS, isJackpot, linePayout, scoreGrid, spinReels, type SlotSpin, type SymbolId } from "../lib/slots";
import { createSave, gameReducer, normalize } from "../lib/store";
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
  assert.equal(scored.total, 225);
  assert.deepEqual(scored.lines.map((line) => line.index), [0, 1]);
  assert.equal(linePayout("cherry", 5), 6);
  const wildGrid: SymbolId[][] = Array.from({ length: 3 }, () => ["wild", "wild", "wild"]);
  assert.equal(scoreGrid(wildGrid, 10).total, 625);
  assert.equal(isJackpot(scoreGrid(wildGrid, 10).lines), true);
  assert.equal(isJackpot([{ index: 0, symbol: "gem", pay: 20, amount: 50 }]), false);

  // Exhaust all 216 line combinations, including wilds in each position.
  for (const a of SYMBOLS) for (const b of SYMBOLS) for (const c of SYMBOLS) {
    const ids = [a.id, b.id, c.id];
    const concrete = new Set(ids.filter((id) => id !== "wild"));
    const expected = concrete.size > 1 ? 0 : Math.floor(25 * SYMBOLS.find((s) => s.id === (concrete.values().next().value ?? "wild"))!.pay / 4);
    const candidate = ids.map((id): SymbolId[] => ["bell", id, "gem"]);
    assert.equal(scoreGrid(candidate, 25).lines.find((line) => line.index === 0)?.amount ?? 0, expected);
  }
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

function testSlotTransactions() {
  const base = createSave("Slots test");
  const spin: SlotSpin = {
    id: "test-spin", bet: 25, practice: false, hosted: true, endsAt: 100,
    grid: [["seven", "cherry", "bell"], ["seven", "cherry", "star"], ["seven", "wild", "gem"]],
  };
  const started = gameReducer(base, { type: "slots-spin", spin });
  assert.equal(started.chips, 975, "stake reserved immediately");
  assert.equal(started.stats.rounds, 0);
  assert.equal(gameReducer(started, { type: "slots-spin", spin: { ...spin, id: "double-click" } }), started);
  assert.equal(gameReducer(started, { type: "slots-settle", id: "stale-id" }), started);
  const settled = gameReducer(started, { type: "slots-settle", id: spin.id });
  assert.equal(settled.chips, base.chips - spin.bet + scoreGrid(spin.grid, spin.bet).total);
  assert.equal(settled.stats.biggestWin, 256, "record net win, not gross payout");
  assert.equal(settled.gamesPlayed.slots, 1);
  assert.equal(settled.relationships.mika.realSessions, 1);
  assert.equal(settled.pendingSlotSpin, null);
  assert.equal(settled.lastSlotSpin?.id, spin.id);
  assert.equal(gameReducer(settled, { type: "slots-settle", id: spin.id }), settled, "cannot pay twice");

  const reloaded = normalize(JSON.parse(JSON.stringify(started)));
  assert.equal(gameReducer(reloaded, { type: "slots-settle", id: spin.id }).chips, settled.chips, "reload retains outcome and reserved stake");
  const poor = { ...base, chips: 0 };
  assert.equal(gameReducer(poor, { type: "slots-spin", spin }), poor);
  for (const state of [poor, { ...base, time: "after" as const }]) {
    const practice = gameReducer(state, { type: "slots-spin", spin: { ...spin, practice: state.chips === 0 } });
    assert.equal(practice.pendingSlotSpin?.practice, true);
    const done = gameReducer(practice, { type: "slots-settle", id: spin.id });
    assert.equal(done.chips, state.chips);
    assert.deepEqual(done.stats, state.stats);
    assert.deepEqual(done.relationships, state.relationships);
    assert.deepEqual(done.gamesPlayed, state.gamesPlayed);
  }
  assert.equal(gameReducer(base, { type: "slots-spin", spin: { ...spin, bet: 999 } }), base);
  assert.equal(gameReducer(base, { type: "slots-spin", spin: { ...spin, grid: [] } }), base);
  assert.equal(normalize({ ...base, pendingSlotSpin: { ...spin, grid: [] } }).pendingSlotSpin, null);
  assert.equal(normalize(base).chips, base.chips, "old saves remain compatible");
}

function testChipBetting() {
  assert.deepEqual(splitChips(185), [100, 50, 25, 10]);
  assert.deepEqual(splitChips(70, [10, 50, 100]), [50, 10, 10]);
  assert.deepEqual(splitChips(-5), []);
  assert.equal(validWager(0, 10, 200, 10), false);
  assert.equal(validWager(25, 10, 200, 10), false);
  assert.equal(validWager(200, 10, 200, 10), true);
  assert.equal(validWager(210, 10, 200, 10), false);
  assert.equal(validWager(50, 100, 500, 50), false);

  const target = { kind: "straight" as const, n: 17 };
  const first = addRouletteChip([], target, 25);
  const second = addRouletteChip(first.bets, target, 25);
  assert.equal(second.bets.length, 1);
  assert.equal(second.bets[0].amount, 50);
  assert.equal(first.bets[0].amount, 25, "placements are immutable");
  assert.ok(addRouletteChip(second.bets, target, 5).error);
  assert.ok(addRouletteChip([], { kind: "straight", n: 37 }, 5).error);
  assert.ok(addRouletteChip([], { kind: "dozen", n: 0 }, 5).error);
  assert.ok(addRouletteChip([], { kind: "black", n: 2 }, 5).error);
  assert.ok(addRouletteChip([], target, 100).error);
  assert.ok(addRouletteChip([], target, 25, 20).error);
  let layout = first.bets;
  for (let i = 0; i < 5; i++) layout = addRouletteChip(layout, { kind: "red" }, 50).bets;
  layout = addRouletteChip(layout, { kind: "black" }, 25).bets;
  assert.equal(layout.reduce((sum, bet) => sum + bet.amount, 0), 300);
  assert.ok(addRouletteChip(layout, { kind: "odd" }, 5).error);
  assert.equal(validRouletteBets(layout), true);
  assert.equal(validRouletteBets([]), false);
  assert.equal(validRouletteBets([{ id: "bad", kind: "straight", n: 17, amount: 55 }]), false);
  assert.equal(validRouletteBets([first.bets[0], first.bets[0]]), false);
  assert.equal(validRouletteBets([{ ...first.bets[0], amount: -5 }]), false);
}

function testRouletteGeometryAndTransactions() {
  assert.equal(WHEEL.length, 37);
  assert.equal(new Set(WHEEL).size, 37);
  assert.equal(WHEEL.filter(isRed).length, 18);
  for (const result of WHEEL) {
    const pose = roulettePose(result, 1);
    const center = (WHEEL.indexOf(result) + .5) * Math.PI * 2 / 37;
    assert.ok(Math.abs(Math.sin(pose.ball - pose.wheel - center)) < 1e-8, `ball must rest in pocket ${result}`);
    assert.ok(Math.cos(pose.ball - pose.wheel - center) > .99999);
    assert.ok(Math.abs(Math.sin(pose.ball)) < 1e-8, "settled pocket faces the table");
    assert.ok(Math.abs(pose.radius - 1.29) < 1e-8);
    for (let frame = 0; frame <= 100; frame++) {
      const live = roulettePose(result, frame / 100);
      assert.ok(live.radius >= 1.29 - 1e-8 && live.radius <= 1.98);
      assert.ok(live.height >= .33 - 1e-8 && live.height <= .71);
    }
  }
  const redBet = { id: "red", kind: "red" as const, amount: 10 };
  assert.equal(WHEEL.reduce<number>((sum, result) => sum + settleRoulette([redBet], result).returned, 0), 360);
  const base = createSave("Roulette test");
  const spin: RouletteSpin = { id: "wheel-test", result: 17, bets: [{ id: "17", kind: "straight", n: 17, amount: 10 }, { id: "red", kind: "red", amount: 10 }], practice: false, startedAt: 0, endsAt: 7400 };
  const started = gameReducer(base, { type: "roulette-spin", spin });
  assert.equal(started.chips, 980);
  assert.equal(gameReducer(started, { type: "roulette-spin", spin: { ...spin, id: "duplicate" } }), started);
  assert.equal(gameReducer(started, { type: "roulette-settle", id: "old" }), started);
  const paid = gameReducer(normalize(JSON.parse(JSON.stringify(started))), { type: "roulette-settle", id: spin.id });
  assert.equal(paid.chips, 1340, "17 is black; only the straight bet pays 360");
  assert.equal(paid.stats.biggestWin, 340);
  assert.equal(paid.gamesPlayed.roulette, 1);
  assert.deepEqual(paid.rouletteHistory, [17]);
  assert.equal(gameReducer(paid, { type: "roulette-settle", id: spin.id }), paid);
  const poor = { ...base, chips: 5 };
  assert.equal(gameReducer(poor, { type: "roulette-spin", spin }), poor);
  const practice = gameReducer(poor, { type: "roulette-spin", spin: { ...spin, practice: true } });
  const done = gameReducer(practice, { type: "roulette-settle", id: spin.id });
  assert.equal(done.chips, poor.chips);
  assert.deepEqual(done.relationships, poor.relationships);
  assert.deepEqual(done.stats, poor.stats);
  assert.deepEqual(done.gamesPlayed, poor.gamesPlayed);
  assert.equal(gameReducer(base, { type: "roulette-spin", spin: { ...spin, result: 37 } }), base);
  assert.equal(normalize({ ...base, pendingRouletteSpin: { ...spin, bets: [] } }).pendingRouletteSpin, null);
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
testSlotTransactions();
testChipBetting();
testRouletteGeometryAndTransactions();
console.log("rules ok");
