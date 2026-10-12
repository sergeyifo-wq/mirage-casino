"use client";

import { playSfx } from "@/lib/audio";
import { pickLine } from "@/lib/banter";
import { LIMITS, pokerOpponents } from "@/lib/presence";
import {
  act,
  aiMove,
  forceFold,
  legalActions,
  potSize,
  seatName,
  startHand,
  type PokerHand,
  type PokerMove,
  type SeatId,
} from "@/lib/poker";
import { topicsFor } from "@/lib/story";
import { useGame, useTableExitLock } from "@/lib/store";
import { validWager } from "@/lib/chips";
import { ChipBetControl, ChipStack } from "@/components/casino-chips";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  HostRail,
  PlayingCard,
  RulesButton,
  Tutorial,
  money,
} from "@/components/widgets";

type SeatStack = { id: SeatId; stack: number };

export function PokerTable() {
  const { state, dispatch, setScreen, setTableExitLock, toast } = useGame();
  const opponents = pokerOpponents(state.time);
  const [practice, setPractice] = useState(false);
  const [buyIn, setBuyIn] = useState(200);
  const [seated, setSeated] = useState(false);
  const [hand, setHand] = useState<PokerHand | null>(null);
  const [button, setButton] = useState(0);
  const [line, setLine] = useState(pickLine("akari", "greet", state.evening));
  const counted = useRef("");
  useTableExitLock(
    seated && !practice,
    "Use Cash out or Fold out and leave to return your table stack to your rack.",
  );

  useEffect(() => {
    if (!hand?.handOver) return;
    const key = hand.log.join("|");
    if (counted.current === key) return;
    counted.current = key;
    const won = hand.winners.find((winner) => winner.id === "player");
    if (!practice) {
      dispatch({
        type: "round",
        game: "poker",
        live: true,
        profit: 0,
        with: ["akari", ...opponents],
        dramatic: won && won.amount >= 80 ? ["akari", ...opponents] : [],
      });
    }
    setLine(pickLine("akari", won ? "win" : "lose", won?.amount ?? 1));
  }, [hand, practice, dispatch, opponents]);

  useEffect(() => {
    if (!hand || hand.handOver || hand.toAct === null) return;
    const seat = hand.seats[hand.toAct];
    if (seat.id === "player") return;
    const timer = window.setTimeout(() => {
      const move = aiMove(hand, hand.toAct!);
      const next = act(hand, hand.toAct!, move);
      setHand(next === hand ? act(hand, hand.toAct!, { type: "fold" }) : next);
      setLine(
        pickLine(
          "akari",
          move.type === "raise"
            ? "raise"
            : move.type === "fold"
              ? "fold"
              : move.type,
          hand.board.length + hand.toAct!,
        ),
      );
      playSfx("chip", state.sfx);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [hand, state.sfx]);

  function begin(stacks: SeatStack[], buttonIndex: number) {
    setHand(
      startHand(stacks, buttonIndex, Math.random, {
        sb: LIMITS.poker.sb,
        bb: LIMITS.poker.bb,
      }),
    );
    setButton(buttonIndex);
  }

  function sit() {
    if (
      seated ||
      !validWager(buyIn, LIMITS.poker.min, LIMITS.poker.max, LIMITS.poker.step)
    )
      return;
    const cost = buyIn;
    if (!practice && state.chips < cost) {
      toast("You need at least the buy-in. Practice is free.");
      return;
    }
    if (!practice) dispatch({ type: "chips", delta: -cost });
    const stacks: SeatStack[] = [
      { id: "player", stack: cost },
      ...opponents.map((id) => ({ id, stack: 400 }) as SeatStack),
    ];
    setSeated(true);
    begin(stacks, 0);
    setLine(pickLine("akari", "greet", cost));
  }

  function cash(stack: number) {
    setTableExitLock(null);
    if (!practice) dispatch({ type: "chips", delta: stack });
    setSeated(false);
    setHand(null);
    setScreen({ name: "map" });
  }

  function nextHand() {
    if (!hand) return;
    const stacks = hand.seats.map((seat) => ({
      id: seat.id,
      stack: seat.id === "player" ? seat.stack : Math.max(seat.stack, 200),
    }));
    if (stacks[0].stack < LIMITS.poker.bb) {
      toast("Your table stack can't post the blind. Rebuy or leave.");
      return;
    }
    begin(stacks, (button + 1) % stacks.length);
  }

  const topics = topicsFor(state, "akari", "table");
  const actor = hand && hand.toAct !== null ? hand.seats[hand.toAct] : null;
  const legal =
    hand && hand.toAct !== null ? legalActions(hand, hand.toAct) : null;
  const playerTurn = actor?.id === "player" && legal?.canAct;

  function send(move: PokerMove) {
    if (!hand || hand.toAct === null || !playerTurn) return;
    setHand(act(hand, hand.toAct, move));
    setLine(
      pickLine(
        "akari",
        move.type === "raise" ? "raise" : move.type,
        hand.board.length,
      ),
    );
    playSfx("chip", state.sfx);
  }

  return (
    <main className="casino-table-layout">
      <Tutorial
        id="poker"
        title="Poker with Akari"
        bullets={[
          "Texas hold'em. Blinds are 5 and 10. You see two cards, then a flop, turn, and river.",
          "Hana raises when she likes the hand. Rin checks until the pot is worth taking.",
          "Akari hosts. She comments. She does not play. Winning the pot is not how you earn her invitation.",
          "Cash out returns whatever is left of your buy-in. Practice never touches your rack.",
        ]}
      />
      <HostRail
        host="akari"
        line={line}
        aside="She watches faces more closely than cards."
      />
      <section className="felt rounded-[28px] p-4 text-[#f7f1e6]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="table-heading">
            <small>The velvet table · No. 02</small>Poker
          </h2>
          <div className="flex flex-wrap gap-2">
            <RulesButton
              title="Texas hold'em"
              body={[
                "Best five-card hand using your two hole cards and the five community cards.",
                "Any all-in reopens the betting at this house. Side pots are paid correctly.",
                "Hana is loose-aggressive. Rin is patient and then sudden.",
                "Leaving mid-hand folds you. Chips already in the pot stay there.",
              ]}
            />
            {topics.slice(0, 1).map((topic) => (
              <Button
                key={topic.id}
                size="sm"
                variant="outline"
                className="bg-black/20"
                onClick={() =>
                  setScreen({
                    name: "dialogue",
                    sceneId: topic.id,
                    back: { name: "poker" },
                  })
                }
              >
                Talk with Akari
              </Button>
            ))}
          </div>
        </div>

        {!seated || !hand ? (
          <div className="wager-well">
            <p className="mb-3 text-sm">
              Buy in for a session. Opponents bring their own stacks.{" "}
              {opponents.map(seatName).join(" and ")}{" "}
              {opponents.length === 1 ? "is" : "are"} at the table.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <ChipBetControl
                value={buyIn}
                min={LIMITS.poker.min}
                max={Math.min(
                  LIMITS.poker.max,
                  practice ? LIMITS.poker.max : state.chips,
                )}
                step={LIMITS.poker.step}
                onChange={setBuyIn}
                label="Poker buy-in"
              />
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={practice} onCheckedChange={setPractice} />{" "}
                Practice
              </label>
              <Button
                className="h-11"
                disabled={
                  !validWager(
                    buyIn,
                    LIMITS.poker.min,
                    LIMITS.poker.max,
                    LIMITS.poker.step,
                  ) ||
                  (!practice && buyIn > state.chips)
                }
                onClick={sit}
              >
                Sit down
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="dealer-bay mb-3 text-center">
              <div className="text-xs tracking-[0.2em] text-(--rim) uppercase">
                {hand.street} · pot {money(potSize(hand))}
              </div>
              <div className="mt-3">
                <ChipStack amount={potSize(hand)} small />
              </div>
              <div className="card-row center mt-2 min-h-24">
                {hand.board.map((card) => (
                  <PlayingCard key={card.id} card={card} />
                ))}
                {hand.board.length === 0 && (
                  <p className="text-sm text-white/70">Hole cards only.</p>
                )}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {hand.seats.map((seat, index) => (
                <div
                  key={seat.id}
                  className={`card-seat ${hand.toAct === index ? "ring-1 ring-(--rim)" : ""}`}
                >
                  <div className="flex justify-between text-sm">
                    <span>
                      {seat.id === "player"
                        ? state.playerName
                        : seatName(seat.id)}
                      {index === hand.button ? " · button" : ""}
                    </span>
                    <span>{money(seat.stack)}</span>
                  </div>
                  <div className="card-row mt-2">
                    {seat.hole?.map((card, cardIndex) => (
                      <PlayingCard
                        key={card.id}
                        card={card}
                        hidden={seat.id !== "player" && !hand.revealed}
                        delay={cardIndex * 40}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-white/75">
                    {seat.folded ? "Folded" : `In for ${money(seat.committed)}`}
                    {hand.shown.find((shown) => shown.id === seat.id)?.name
                      ? ` · ${hand.shown.find((shown) => shown.id === seat.id)?.name}`
                      : ""}
                  </p>
                  {seat.committed > 0 && (
                    <div className="mt-3">
                      <ChipStack amount={seat.committed} small />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 max-h-24 overflow-auto rounded-xl bg-black/20 p-2 text-xs leading-5">
              {hand.log.slice(-6).map((entry, index) => (
                <div key={`${entry}-${index}`}>
                  {entry
                    .replaceAll("player", "You")
                    .replaceAll("hana", "Hana")
                    .replaceAll("rin", "Rin")}
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {playerTurn && legal && (
                <>
                  <Button
                    variant="outline"
                    className="bg-black/20"
                    onClick={() => send({ type: "fold" })}
                  >
                    Fold
                  </Button>
                  {legal.canCheck && (
                    <Button onClick={() => send({ type: "check" })}>
                      Check
                    </Button>
                  )}
                  {legal.canCall && (
                    <Button onClick={() => send({ type: "call" })}>
                      Call {money(legal.callAmount)}
                    </Button>
                  )}
                  {legal.canRaise && (
                    <Button
                      variant="outline"
                      className="bg-black/20"
                      onClick={() =>
                        send({ type: "raise", to: legal.minRaiseTo })
                      }
                    >
                      Raise to {money(legal.minRaiseTo)}
                    </Button>
                  )}
                  {legal.canRaise && legal.maxRaiseTo > legal.minRaiseTo && (
                    <Button
                      variant="outline"
                      className="bg-black/20"
                      onClick={() =>
                        send({ type: "raise", to: legal.maxRaiseTo })
                      }
                    >
                      All in {money(legal.maxRaiseTo)}
                    </Button>
                  )}
                </>
              )}
              {hand.handOver && (
                <>
                  <p className="w-full text-sm">
                    {hand.winners
                      .map(
                        (winner) =>
                          `${seatName(winner.id)} takes ${money(winner.amount)}${winner.handName ? ` with ${winner.handName}` : ""}`,
                      )
                      .join(". ")}
                  </p>
                  <Button onClick={nextHand}>Next hand</Button>
                  <Button
                    variant="outline"
                    className="bg-black/20"
                    onClick={() =>
                      cash(
                        hand.seats.find((seat) => seat.id === "player")
                          ?.stack ?? 0,
                      )
                    }
                  >
                    Cash out{" "}
                    {money(
                      hand.seats.find((seat) => seat.id === "player")?.stack ??
                        0,
                    )}
                  </Button>
                </>
              )}
              {!hand.handOver && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    const folded = forceFold(hand, "player");
                    const stack =
                      folded.seats.find((seat) => seat.id === "player")
                        ?.stack ?? 0;
                    if (!practice) {
                      dispatch({
                        type: "round",
                        game: "poker",
                        live: true,
                        profit: 0,
                        with: ["akari", ...opponents],
                      });
                    }
                    cash(stack);
                  }}
                >
                  Fold out and leave
                </Button>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
