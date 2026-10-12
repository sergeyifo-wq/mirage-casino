"use client";

import { playSfx } from "@/lib/audio";
import { pickLine } from "@/lib/banter";
import {
  dealBaccarat,
  handTotal,
  outcomeOf,
  settleBaccarat,
  type BaccaratHand,
  type Side,
} from "@/lib/baccarat";
import { LIMITS } from "@/lib/presence";
import { topicsFor } from "@/lib/story";
import { useGame } from "@/lib/store";
import { validWager } from "@/lib/chips";
import { ChipBetControl } from "@/components/casino-chips";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  HostRail,
  PlayingCard,
  RulesButton,
  Tutorial,
  money,
} from "@/components/widgets";

export function BaccaratTable() {
  const { state, dispatch, setScreen, toast } = useGame();
  const [practice, setPractice] = useState(false);
  const [amount, setAmount] = useState(40);
  const [side, setSide] = useState<Side>("player");
  const [hand, setHand] = useState<BaccaratHand | null>(null);
  const [receipt, setReceipt] = useState<{
    side: Side;
    amount: number;
    returned: number;
    practice: boolean;
  } | null>(null);
  const [note, setNote] = useState(
    "Shiori waits for a bet. She will explain the draw if you want the rule.",
  );
  const [line, setLine] = useState(pickLine("shiori", "greet", 4));
  const topics = topicsFor(state, "shiori", "table");

  function deal() {
    if (
      !validWager(
        amount,
        LIMITS.baccarat.min,
        LIMITS.baccarat.max,
        LIMITS.baccarat.step,
      )
    )
      return;
    if (!practice && state.chips < amount) {
      toast("The stake is larger than your rack.");
      return;
    }
    const dealt = dealBaccarat();
    const returned = settleBaccarat(dealt, [{ side, amount }]);
    const profit = returned - amount;
    setReceipt({ side, amount, returned, practice });
    setHand(dealt);
    setNote(dealt.notes.join(" "));
    if (!practice) {
      const outcome = outcomeOf(dealt);
      dispatch({
        type: "round",
        game: "baccarat",
        live: true,
        profit,
        with: ["shiori"],
        dramatic: dealt.natural && outcome === side ? ["shiori"] : [],
      });
    }
    const outcome = outcomeOf(dealt);
    const key = dealt.natural
      ? "natural"
      : outcome === "tie"
        ? "tie"
        : profit > 0
          ? "win"
          : "lose";
    setLine(pickLine("shiori", practice ? "practice" : key, amount));
    playSfx(profit > 0 ? "win" : "card", state.sfx);
  }

  const outcome = hand ? outcomeOf(hand) : null;

  return (
    <main className="casino-table-layout">
      <Tutorial
        id="baccarat"
        title="Baccarat with Shiori"
        bullets={[
          "Bet on Player, Banker, or Tie. Cards are drawn by rule. You don't hit.",
          "Face cards are worth zero, aces one, everything else its number. Only the last digit counts.",
          "A natural 8 or 9 stands. Otherwise the player draws on 5 or less, and the banker answers to that card.",
          "Banker wins pay 0.95 to 1. Ties pay 8 to 1 and push the other bets. Ask Shiori why.",
        ]}
      />
      <HostRail
        host="shiori"
        line={line}
        aside="Exact, and warmer once the quiet is shared."
      />
      <section className="felt rounded-[28px] p-4 text-[#f7f1e6]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="table-heading">
            <small>The art of a quiet wager · No. 05</small>Baccarat
          </h2>
          <div className="flex flex-wrap gap-2">
            <RulesButton
              title="Punto banco"
              body={[
                "Player stands on 6 or 7 and draws on 0–5, unless either side has a natural 8 or 9.",
                "Banker draws on 0–2, stands on 7, and follows the third-card table between.",
                "Player pays 1 to 1. Banker pays 1 to 1 minus 5% commission. Tie pays 8 to 1.",
                "A tie returns player and banker stakes.",
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
                    back: { name: "baccarat" },
                  })
                }
              >
                Talk with Shiori
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              className="bg-black/20"
              onClick={() => setScreen({ name: "map" })}
            >
              Leave
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <HandView title="Player" cards={hand?.player} />
          <HandView title="Banker" cards={hand?.banker} />
        </div>
        <p className="mt-4 text-sm leading-6">{note}</p>
        {outcome && (
          <p className="mt-2 font-display text-2xl capitalize">
            {outcome}
            {hand?.natural ? " · natural" : ""}
          </p>
        )}
        <div className="wager-well mt-4 flex flex-wrap items-center gap-3">
          {(["player", "banker", "tie"] as Side[]).map((option) => (
            <Button
              key={option}
              variant={side === option ? "default" : "outline"}
              className={`capitalize ${side === option ? "" : "bg-black/25"}`}
              onClick={() => setSide(option)}
            >
              {option}
            </Button>
          ))}
          <ChipBetControl
            value={amount}
            min={LIMITS.baccarat.min}
            max={Math.min(
              LIMITS.baccarat.max,
              practice ? LIMITS.baccarat.max : state.chips,
            )}
            step={LIMITS.baccarat.step}
            onChange={setAmount}
            label={`${side[0].toUpperCase() + side.slice(1)} wager`}
          />
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={practice} onCheckedChange={setPractice} /> Practice
          </label>
          <Button
            className="h-11"
            disabled={
              !validWager(
                amount,
                LIMITS.baccarat.min,
                LIMITS.baccarat.max,
                LIMITS.baccarat.step,
              ) ||
              (!practice && amount > state.chips)
            }
            onClick={deal}
          >
            Deal
          </Button>
        </div>
        {receipt && (
          <p className="mt-3 text-sm">
            {receipt.practice ? "Practice · " : ""}Returned{" "}
            {money(receipt.returned)} on the last {money(receipt.amount)}{" "}
            {receipt.side} bet. Net{" "}
            {receipt.returned - receipt.amount >= 0 ? "+" : ""}
            {money(receipt.returned - receipt.amount)} chips.
            {receipt.practice ? " Your rack did not move." : ""}
          </p>
        )}
      </section>
    </main>
  );
}

function HandView({
  title,
  cards,
}: {
  title: string;
  cards?: BaccaratHand["player"];
}) {
  return (
    <div className="card-seat">
      <div className="mb-2 text-xs tracking-[0.2em] text-(--rim) uppercase">
        {title}
        {cards ? ` · ${handTotal(cards)}` : ""}
      </div>
      <div className="card-row">
        {cards ? (
          cards.map((card) => <PlayingCard key={card.id} card={card} />)
        ) : (
          <PlayingCard hidden />
        )}
      </div>
    </div>
  );
}
