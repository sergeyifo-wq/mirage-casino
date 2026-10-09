"use client";

import { playSfx } from "@/lib/audio";
import { pickLine } from "@/lib/banter";
import {
  applyAction,
  dealerHit,
  dealerUpcard,
  handValue,
  insuranceReturn,
  isBlackjack,
  startRound,
  takeInsurance,
  chooseAiAction,
  type BJId,
  type BJRound,
} from "@/lib/blackjack";
import { LIMITS, blackjackOpponents } from "@/lib/presence";
import { topicsFor } from "@/lib/story";
import { useGame } from "@/lib/store";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { HostRail, PlayingCard, RulesButton, Stepper, Tutorial } from "@/components/widgets";

export function BlackjackTable() {
  const { state, dispatch, setScreen, toast } = useGame();
  const opponents = blackjackOpponents(state.time);
  const [practice, setPractice] = useState(false);
  const [bet, setBet] = useState(20);
  const [round, setRound] = useState<BJRound | null>(null);
  const [line, setLine] = useState(pickLine("reina", "greet", state.evening));
  const [nonce, setNonce] = useState(0);
  const settled = useRef(false);
  const [liveHand, setLiveHand] = useState(false);

  useEffect(() => {
    if (!round || round.phase !== "acting") return;
    const hand = round.hands[round.turn];
    if (!hand || hand.id === "player") return;
    const timer = window.setTimeout(() => {
      const up = dealerUpcard(round);
      if (!up) return;
      const action = chooseAiAction(hand.id, hand.cards, up);
      setRound(applyAction(round, action).round);
      if (hand.id !== "player") setLine(pickLine(hand.id, action === "hit" ? "bust" : "win", nonce + round.turn));
    }, 650);
    return () => window.clearTimeout(timer);
  }, [round, nonce]);

  useEffect(() => {
    if (!round || round.phase !== "dealer") return;
    const timer = window.setTimeout(() => setRound(dealerHit(round)), 650);
    return () => window.clearTimeout(timer);
  }, [round]);

  useEffect(() => {
    if (!round || round.phase !== "done" || settled.current) return;
    settled.current = true;
    const player = round.hands.find((hand) => hand.id === "player");
    if (!player?.result) return;
    const returned = player.returned + insuranceReturn(player, round.dealer);
    const net = returned - player.bet - player.insurance;
    dispatch({
      type: "round",
      game: "blackjack",
      live: liveHand,
      profit: liveHand ? returned : 0,
      net,
      with: ["reina", ...opponents],
      dramatic: liveHand && player.result === "blackjack" ? ["reina", ...opponents] : [],
    });
    if (liveHand) playSfx(net > 0 ? "win" : net < 0 ? "lose" : "card", state.sfx);
  }, [round, liveHand, dispatch, opponents, state.sfx]);

  function deal() {
    if (!practice && state.chips < bet) {
      toast("Not enough chips. Practice is open, or rest in the suite for the allowance.");
      return;
    }
    const live = !practice;
    setLiveHand(live);
    if (live) dispatch({ type: "chips", delta: -bet });
    settled.current = false;
    const bets: { id: BJId; bet: number }[] = [
      ...opponents.map((id) => ({ id, bet: id === "yuki" ? 40 : 20 })),
      { id: "player" as const, bet },
    ];
    const order = opponents.includes("naomi") ? (["naomi", "player", ...opponents.filter((id) => id === "yuki")] as BJId[]) : (["player", "yuki"] as BJId[]);
    const seated = order.filter((id) => bets.some((item) => item.id === id)).map((id) => bets.find((item) => item.id === id)!);
    setRound(startRound(seated));
    setNonce((value) => value + 1);
    playSfx("card", state.sfx);
    setLine(pickLine("reina", bet >= 100 ? "bigbet" : "greet", bet));
  }

  const player = round?.hands.find((hand) => hand.id === "player");
  const yourTurn = round?.phase === "acting" && round.hands[round.turn]?.id === "player";
  const spoken =
    round?.phase === "done" && player?.result
      ? pickLine(
          "reina",
          !liveHand ? "practice" : player.result === "blackjack" ? "blackjack" : player.result === "bust" ? "bust" : player.result === "push" ? "push" : player.result,
          player.returned + nonce,
        )
      : line;
  const topics = topicsFor(state, "reina", "table");

  return (
    <main className="mx-auto grid max-w-6xl gap-4 px-3 py-4 lg:grid-cols-[240px_1fr]">
      <Tutorial
        id="blackjack"
        title="Blackjack with Reina"
        bullets={[
          "Get closer to 21 than the dealer without going over. Reina stands on every 17, including soft 17.",
          "Blackjack pays 3 to 2. A tie returns your stake. This table does not offer splits.",
          "Naomi plays by the book. Yuki hits like the night is short. You can answer them between hands.",
          "Practice keeps your rack exactly where it is.",
        ]}
      />
      <HostRail host="reina" line={spoken} aside="Composed, and willing to tip a player who thinks." />
      <section className="felt rounded-[28px] p-4 text-[#f7f1e6]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-4xl">Blackjack</h2>
          <div className="flex flex-wrap gap-2">
            <RulesButton
              title="Blackjack"
              body={[
                "Four decks. Dealer stands on soft 17. Blackjack pays 3 to 2.",
                "You may hit, stand, or double on your first two cards. No splits at this table.",
                "If Reina shows an ace, insurance pays 2 to 1 when she has blackjack.",
                "Practice mode changes nothing in your rack.",
              ]}
            />
            {topics.slice(0, 1).map((topic) => (
              <Button key={topic.id} size="sm" variant="outline" className="bg-black/20" onClick={() => setScreen({ name: "dialogue", sceneId: topic.id, back: { name: "blackjack" } })}>
                Talk with Reina
              </Button>
            ))}
            <Button size="sm" variant="outline" className="bg-black/20" onClick={() => setScreen({ name: "map" })}>
              Leave table
            </Button>
          </div>
        </div>
        <p className="mb-4 text-sm text-white/80">{round?.message ?? "Place a stake. Naomi is already counting."}</p>
        <div className="mb-4">
          <div className="mb-2 text-xs tracking-[0.2em] text-(--rim) uppercase">Reina</div>
          <div className="flex gap-2">
            {round ? (
              <>
                <PlayingCard card={round.dealer[0]} />
                <PlayingCard card={round.dealer[1]} hidden={!round.dealerHoleRevealed} />
                {round.dealer.slice(2).map((card) => (
                  <PlayingCard key={card.id} card={card} />
                ))}
              </>
            ) : (
              <PlayingCard hidden />
            )}
            {round?.dealerHoleRevealed && <Total cards={round.dealer} />}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {(["naomi", "player", "yuki"] as BJId[]).map((id) => {
            const hand = round?.hands.find((item) => item.id === id);
            const here = id === "player" || opponents.includes(id as "naomi" | "yuki");
            if (!here) return <EmptySeat key={id} name={id === "yuki" ? "Yuki steps out early" : "Naomi has gone up"} />;
            return (
              <div key={id} className={`rounded-2xl bg-black/20 p-3 ${yourTurn && id === "player" ? "ring-1 ring-(--rim)" : ""}`}>
                <div className="mb-2 text-sm">{id === "player" ? state.playerName : id === "naomi" ? "Naomi" : "Yuki"}</div>
                <div className="flex gap-2">
                  {hand ? hand.cards.map((card, index) => <PlayingCard key={card.id} card={card} delay={index * 40} />) : <PlayingCard hidden />}
                </div>
                {hand && <Total cards={hand.cards} result={hand.result} />}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-black/25 p-3">
          {!round || round.phase === "done" ? (
            <>
              <Stepper value={bet} min={LIMITS.blackjack.min} max={Math.min(LIMITS.blackjack.max, practice ? LIMITS.blackjack.max : Math.max(LIMITS.blackjack.min, state.chips))} step={LIMITS.blackjack.step} onChange={setBet} />
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={practice} onCheckedChange={setPractice} /> Practice
              </label>
              <Button className="h-11" onClick={deal}>Deal</Button>
            </>
          ) : round.phase === "insurance" ? (
            <>
              <p className="text-sm">Insure for {Math.floor(bet / 2)}?</p>
              <Button
                disabled={liveHand && state.chips < Math.floor(bet / 2)}
                onClick={() => {
                  const next = takeInsurance(round, true);
                  if (liveHand && next.charge) dispatch({ type: "chips", delta: -next.charge });
                  setRound(next.round);
                }}
              >
                Take insurance
              </Button>
              <Button variant="outline" className="bg-black/20" onClick={() => setRound(takeInsurance(round, false).round)}>No thanks</Button>
            </>
          ) : (
            <>
              <Button disabled={!yourTurn} onClick={() => yourTurn && setRound(applyAction(round, "hit").round)}>Hit</Button>
              <Button disabled={!yourTurn} variant="outline" className="bg-black/20" onClick={() => yourTurn && setRound(applyAction(round, "stand").round)}>Stand</Button>
              <Button
                disabled={!yourTurn || player?.cards.length !== 2 || (liveHand && state.chips < (player?.bet ?? bet))}
                variant="outline"
                className="bg-black/20"
                onClick={() => {
                  if (!yourTurn) return;
                  const next = applyAction(round, "double");
                  if (liveHand && next.charge) dispatch({ type: "chips", delta: -next.charge });
                  setRound(next.round);
                }}
              >
                Double
              </Button>
              <p className="w-full text-xs text-white/70">Leaving mid-hand from the floor map forfeits the stake already on the felt.</p>
            </>
          )}
        </div>
        {round?.phase === "done" && player && (
          <p className="mt-3 text-sm">
            {!liveHand
              ? `Practice result: ${player.result}. The rack is untouched.`
              : `Net ${player.returned + insuranceReturn(player, round.dealer) - player.bet - player.insurance >= 0 ? "+" : ""}${player.returned + insuranceReturn(player, round.dealer) - player.bet - player.insurance} chips.`}
            {isBlackjack(player.cards) ? " Natural." : ""}
          </p>
        )}
      </section>
    </main>
  );
}

function Total({ cards, result }: { cards: BJRound["dealer"]; result?: string }) {
  const value = handValue(cards);
  return <p className="mt-2 text-sm">{value.bust ? "Bust" : value.total}{value.soft ? " soft" : ""}{result ? ` · ${result}` : ""}</p>;
}

function EmptySeat({ name }: { name: string }) {
  return <div className="rounded-2xl border border-dashed border-white/20 p-3 text-sm text-white/70">{name}</div>;
}
