"use client";

import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { RotateCw, Undo2 } from "lucide-react";
import { playSfx } from "@/lib/audio";
import { pickLine } from "@/lib/banter";
import {
  addRouletteChip,
  betLabel,
  betWins,
  isRed,
  ROULETTE_CHIPS,
  ROULETTE_SPIN_DURATION,
  settleRoulette,
  spinWheel,
  validRouletteBets,
  type BetTarget,
  type RouletteBet,
} from "@/lib/roulette";
import { topicsFor } from "@/lib/story";
import { useGame } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChipRack, ChipStack, draggedChip } from "@/components/casino-chips";
import { HostRail, RulesButton, Tutorial, money } from "@/components/widgets";
import { RouletteWheel } from "@/components/roulette-wheel";
import styles from "./roulette-table.module.css";

type Layout = {
  bets: RouletteBet[];
  history: RouletteBet[][];
  note: string | null;
};
type LayoutAction =
  | { type: "add"; target: BetTarget; chip: number; budget: number }
  | { type: "undo" }
  | { type: "clear" }
  | { type: "dealt" }
  | { type: "rebet"; bets: RouletteBet[]; budget: number };
const EMPTY: Layout = { bets: [], history: [], note: null };
function layoutReducer(state: Layout, action: LayoutAction): Layout {
  if (action.type === "dealt") return EMPTY;
  if (action.type === "undo")
    return state.history.length
      ? {
          bets: state.history[state.history.length - 1],
          history: state.history.slice(0, -1),
          note: null,
        }
      : state;
  if (action.type === "clear")
    return {
      bets: [],
      history: [...state.history, state.bets].slice(-60),
      note: null,
    };
  if (action.type === "rebet") {
    if (
      !validRouletteBets(action.bets) ||
      action.bets.reduce((sum, bet) => sum + bet.amount, 0) > action.budget
    )
      return {
        ...state,
        note: "Your rack cannot cover the last layout. Use smaller chips or practice.",
      };
    return {
      bets: action.bets.map((bet) => ({ ...bet })),
      history: [...state.history, state.bets].slice(-60),
      note: null,
    };
  }
  const next = addRouletteChip(
    state.bets,
    action.target,
    action.chip,
    action.budget,
  );
  return next.error
    ? { ...state, note: next.error }
    : {
        bets: next.bets,
        history: [...state.history, state.bets].slice(-60),
        note: null,
      };
}

export function RouletteTable() {
  const { state, dispatch, setScreen, toast } = useGame();
  const [practice, setPractice] = useState(
    state.pendingRouletteSpin?.practice ??
      state.lastRouletteSpin?.practice ??
      false,
  );
  const [chip, setChip] = useState(10);
  const [layout, changeLayout] = useReducer(layoutReducer, EMPTY);
  const pending = state.pendingRouletteSpin ?? null;
  const last = state.lastRouletteSpin ?? null;
  const spinning = !!pending;
  const feltBets = pending?.bets ?? layout.bets;
  const total = layout.bets.reduce((sum, bet) => sum + bet.amount, 0);
  const budget = practice ? Infinity : state.chips;
  const receipt = last ? settleRoulette(last.bets, last.result) : null;
  const previousStake =
    last?.bets.reduce((sum, bet) => sum + bet.amount, 0) ?? 0;
  const topics = topicsFor(state, "celeste", "table");
  const heard = useRef(last?.id);
  useEffect(() => {
    if (!last || last.id === heard.current) return;
    heard.current = last.id;
    playSfx(
      settleRoulette(last.bets, last.result).returned > 0 ? "win" : "lose",
      state.sfx,
    );
  }, [last, state.sfx]);

  function place(target: BetTarget, value = chip) {
    if (spinning) return;
    changeLayout({ type: "add", target, chip: value, budget });
    if (!addRouletteChip(layout.bets, target, value, budget).error)
      playSfx("chip", state.sfx);
  }
  function spin() {
    if (spinning || !validRouletteBets(layout.bets)) return;
    if (!practice && total > state.chips) {
      toast("Your rack cannot cover this layout. Undo a bet or use practice.");
      return;
    }
    const now = Date.now();
    dispatch({
      type: "roulette-spin",
      spin: {
        id: crypto.randomUUID(),
        result: spinWheel(),
        bets: layout.bets.map((bet) => ({ ...bet })),
        practice,
        startedAt: now,
        endsAt: now + ROULETTE_SPIN_DURATION,
      },
    });
    changeLayout({ type: "dealt" });
    playSfx("chip", state.sfx);
  }
  const straight = last?.bets.some(
    (bet) => bet.kind === "straight" && bet.n === last.result,
  );
  const hostLine = last
    ? pickLine(
        "celeste",
        last.practice
          ? "practice"
          : last.result === 0
            ? "zero"
            : straight
              ? "straight"
              : (receipt?.returned ?? 0) > previousStake
                ? "win"
                : "lose",
        last.result + 1,
      )
    : pickLine("celeste", "greet", 1);

  function spot(
    target: BetTarget,
    label: string,
    className = "",
    style?: CSSProperties,
  ) {
    const amount =
      feltBets.find((bet) => bet.kind === target.kind && bet.n === target.n)
        ?.amount ?? 0;
    const landed =
      !spinning &&
      last &&
      target.kind === "straight" &&
      last.result === target.n;
    return (
      <button
        key={`${target.kind}:${target.n ?? "x"}`}
        type="button"
        data-chip-drop
        className={`${styles.spot} ${className} ${landed ? styles.landed : ""}`}
        style={style}
        disabled={spinning}
        aria-label={`Bet on ${label}, currently ${amount} chips`}
        onClick={() => place(target)}
        onDragOver={(event) => {
          if (!spinning) event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          const value = draggedChip(event);
          if (value) place(target, value);
        }}
      >
        <span>{label}</span>
        {amount > 0 && (
          <span className={styles.placedChip}>
            <ChipStack amount={amount} small denominations={ROULETTE_CHIPS} />
          </span>
        )}
      </button>
    );
  }

  return (
    <main className={styles.layout}>
      <Tutorial
        id="roulette"
        title="Roulette with Celeste"
        bullets={[
          "Choose a chip from your rack. Tap a number or an outside bet to place it, or drag the chip onto the felt. Repeat to build a stack.",
          "European roulette has 37 numbered pockets and one zero. A straight number pays 35 to 1; even chances 1 to 1; dozens and columns 2 to 1. Winning stakes are returned too.",
          "Undo removes your last placement. Rebet restores your last layout. Each number allows 50 chips, with 300 chips across the table per spin.",
          "The ball settles into the same numbered pocket that pays your bets. Accepted spins finish even if you leave or reload. Practice spends nothing.",
        ]}
      />
      <div className={styles.host}>
        <HostRail
          host="celeste"
          line={hostLine}
          aside="Polished walnut, brass, and a little theater."
        />
      </div>
      <section className={styles.table} aria-label="European roulette table">
        <div className={styles.toolbar}>
          <div>
            <p className={styles.eyebrow}>The midnight collection · No. 03</p>
            <h2>European Roulette</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <RulesButton
              title="European roulette"
              body={[
                "One zero. Straight bets pay 35 to 1; red, black, odd, even, low and high pay 1 to 1. Dozens and columns pay 2 to 1. Payouts include the returned winning stake.",
                "Zero loses every outside bet. All 37 pockets are equally likely; past results do not predict the next spin.",
                "Place 5, 10, 25 or 50-chip pieces on the layout. The limit is 50 per number and 300 in total. Stakes are reserved at spin acceptance, and each saved outcome is paid once.",
                "Practice uses the same wheel without changing chips, game statistics or relationships.",
              ]}
            />
            {topics.slice(0, 1).map((topic) => (
              <Button
                key={topic.id}
                size="sm"
                variant="outline"
                onClick={() =>
                  setScreen({
                    name: "dialogue",
                    sceneId: topic.id,
                    back: { name: "roulette" },
                  })
                }
              >
                Talk with Celeste
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setScreen({ name: "map" })}
            >
              Leave
            </Button>
          </div>
        </div>
        <div className={styles.hero}>
          <RouletteWheel spin={pending ?? last} spinning={spinning} />
          <div className={styles.ledger}>
            <p className={styles.eyebrow}>
              {spinning ? "No more bets" : "The evening is yours"}
            </p>
            <h3>{spinning ? "The ball is in motion" : "Make your play"}</h3>
            <p className={styles.instructions}>
              Choose a chip, place it on the felt, then spin.
            </p>
            <div className={styles.readouts}>
              <div>
                <span>Rack</span>
                <strong>{money(state.chips)}</strong>
              </div>
              <div>
                <span>{spinning ? "In play" : "On felt"}</span>
                <strong>
                  {money(
                    spinning
                      ? pending.bets.reduce((sum, bet) => sum + bet.amount, 0)
                      : total,
                  )}
                </strong>
              </div>
              <div>
                <span>
                  {last?.practice ? "Practice payout" : "Last payout"}
                </span>
                <strong>
                  {spinning ? "—" : money(receipt?.returned ?? 0)}
                </strong>
              </div>
            </div>
            <div className={styles.recent}>
              <span>Recent spins</span>
              <div role="list">
                {(state.rouletteHistory ?? []).map((number, index) => (
                  <span
                    key={index}
                    role="listitem"
                    className={
                      number === 0
                        ? styles.greenNumber
                        : isRed(number)
                          ? styles.redNumber
                          : styles.blackNumber
                    }
                  >
                    {number}
                  </span>
                ))}
                {!state.rouletteHistory?.length && (
                  <p>The wheel has a clean slate.</p>
                )}
              </div>
            </div>
            <p className={styles.limitNote}>
              Single number: 50 max · Total layout: 300 max
            </p>
          </div>
        </div>
        <div className={styles.felt}>
          <div className={styles.palette}>
            <div>
              <p className={styles.eyebrow}>Your chip rack</p>
              <ChipRack
                values={ROULETTE_CHIPS}
                selected={chip}
                onSelect={setChip}
                disabled={spinning}
                label="Choose roulette chip"
              />
            </div>
            <div className={styles.betTools}>
              <Button
                size="sm"
                variant="outline"
                disabled={spinning || !layout.history.length}
                onClick={() => changeLayout({ type: "undo" })}
              >
                <Undo2 /> Undo
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={spinning || !last}
                onClick={() =>
                  changeLayout({ type: "rebet", bets: last!.bets, budget })
                }
              >
                Rebet
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={spinning || !layout.bets.length}
                onClick={() => changeLayout({ type: "clear" })}
              >
                Clear
              </Button>
            </div>
          </div>
          <p className={styles.layoutHint}>
            Tap a spot to place your {chip}-chip piece. Dragging works too.
            <span className={styles.mobileHint}>
              {" "}
              Swipe the felt to see all numbers.
            </span>
          </p>
          <div
            className={styles.feltScroll}
            tabIndex={0}
            role="region"
            aria-label="Roulette betting layout"
          >
            <div className={styles.board}>
              {spot({ kind: "straight", n: 0 }, "0", styles.zero)}
              {Array.from({ length: 36 }, (_, index) => index + 1).map(
                (number) =>
                  spot(
                    { kind: "straight", n: number },
                    String(number),
                    isRed(number) ? styles.redSpot : styles.blackSpot,
                    {
                      gridColumn: Math.ceil(number / 3) + 1,
                      gridRow: 4 - (((number - 1) % 3) + 1),
                    },
                  ),
              )}
              {[1, 2, 3].map((column) =>
                spot(
                  { kind: "column", n: column },
                  `Column ${column}`,
                  styles.columnSpot,
                  { gridColumn: 14, gridRow: 4 - column },
                ),
              )}
            </div>
            <div className={styles.dozens}>
              {[1, 2, 3].map((n) =>
                spot(
                  { kind: "dozen", n },
                  n === 1 ? "1–12" : n === 2 ? "13–24" : "25–36",
                ),
              )}
            </div>
            <div className={styles.outside}>
              {(["low", "even", "red", "black", "odd", "high"] as const).map(
                (kind) =>
                  spot(
                    { kind },
                    kind === "low"
                      ? "1–18"
                      : kind === "high"
                        ? "19–36"
                        : kind[0].toUpperCase() + kind.slice(1),
                    kind === "red"
                      ? styles.redOutside
                      : kind === "black"
                        ? styles.blackOutside
                        : "",
                  ),
              )}
            </div>
          </div>
          {layout.note && (
            <p className={styles.betNote} role="alert">
              {layout.note}
            </p>
          )}
          <div className={styles.spinRow}>
            <label>
              <Switch
                aria-label="Roulette practice mode"
                checked={practice}
                onCheckedChange={setPractice}
                disabled={spinning}
              />{" "}
              Practice mode
            </label>
            <span>
              {practice
                ? "Your chips stay in your pocket"
                : `Available after layout: ${money(Math.max(0, state.chips - total))}`}
            </span>
            <button
              type="button"
              className={styles.spinButton}
              disabled={
                spinning ||
                !layout.bets.length ||
                (!practice && total > state.chips)
              }
              onClick={spin}
            >
              <RotateCw size={19} />
              {spinning
                ? "Spinning…"
                : practice
                  ? "Practice spin"
                  : "Spin the wheel"}
            </button>
          </div>
          {feltBets.length > 0 && (
            <div className={styles.betList} aria-label="Placed bets">
              {feltBets.map((bet) => (
                <span key={bet.id}>
                  {betLabel(bet)} · {money(bet.amount)}
                </span>
              ))}
            </div>
          )}
        </div>
        <div
          className={styles.receipt}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {spinning ? (
            <>
              <h3>Les jeux sont faits.</h3>
              <p>All bets are locked. The ball is finding its pocket.</p>
            </>
          ) : last && receipt ? (
            <>
              <h3>
                <span
                  className={`${styles.resultBall} ${last.result === 0 ? styles.greenNumber : isRed(last.result) ? styles.redNumber : styles.blackNumber}`}
                >
                  {last.result}
                </span>{" "}
                {last.result === 0
                  ? "Zero"
                  : isRed(last.result)
                    ? "Red"
                    : "Black"}{" "}
                ·{" "}
                {last.result === 0
                  ? "the house pocket"
                  : last.result % 2
                    ? "odd"
                    : "even"}
              </h3>
              <p>
                {last.practice ? "Practice · " : ""}Payout{" "}
                {money(receipt.returned)} · Stake {money(previousStake)} ·{" "}
                {last.practice ? "Simulated net" : "Net"}{" "}
                {receipt.returned - previousStake > 0 ? "+" : ""}
                {money(receipt.returned - previousStake)} chips
              </p>
              <div>
                {last.bets.map((bet) => (
                  <span
                    key={bet.id}
                    className={
                      betWins(bet, last.result) ? styles.receiptWin : ""
                    }
                  >
                    {betLabel(bet)}{" "}
                    {betWins(bet, last.result)
                      ? `pays ${money(settleRoulette([bet], last.result).returned)}`
                      : "missed"}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <>
              <h3>Place your chips.</h3>
              <p>
                Winning stakes are returned with the payout. Each spin starts
                fresh.
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
