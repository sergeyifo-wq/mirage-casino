"use client";

import {
  Bell,
  Cherry,
  Gem,
  RotateCw,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { playSfx } from "@/lib/audio";
import { pickLine } from "@/lib/banter";
import { LIMITS } from "@/lib/presence";
import {
  PAYLINES,
  PAYLINE_NAMES,
  SYMBOLS,
  SPIN_DURATION,
  isJackpot,
  linePayout,
  scoreGrid,
  spinReels,
  type SymbolId,
} from "@/lib/slots";
import { topicsFor } from "@/lib/story";
import { useGame } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { HostRail, RulesButton, Tutorial, money } from "@/components/widgets";
import styles from "./slots-table.module.css";

const INITIAL_GRID: SymbolId[][] = [
  ["cherry", "gem", "bell"],
  ["bell", "seven", "wild"],
  ["star", "cherry", "star"],
];
const LINE_COLORS = ["#f4d28c", "#ffa2bd", "#9ee7dd", "#c9b0ff", "#98caff"];

function SlotSymbol({
  symbol,
  small = false,
}: {
  symbol: SymbolId;
  small?: boolean;
}) {
  const Icon = {
    cherry: Cherry,
    bell: Bell,
    star: Star,
    gem: Gem,
    wild: Sparkles,
  }[symbol === "seven" ? "wild" : symbol];
  return (
    <span
      className={`${styles.symbol} ${styles[symbol]} ${small ? styles.smallSymbol : ""}`}
      aria-hidden="true"
    >
      {symbol === "seven" ? (
        <span className={styles.sevenGlyph}>7</span>
      ) : (
        <Icon strokeWidth={1.6} />
      )}
      {!small && (
        <span className={styles.symbolLabel}>
          {symbol === "wild" ? "WILD" : symbol.toUpperCase()}
        </span>
      )}
    </span>
  );
}

function Reel({
  previous,
  next,
  index,
  spinning,
  hotRows,
}: {
  previous: SymbolId[];
  next: SymbolId[];
  index: number;
  spinning: boolean;
  hotRows: number[];
}) {
  // Cosmetic strips never participate in scoring; only the saved final grid does.
  const filler = Array.from(
    { length: 30 + index * 6 },
    (_, i) => SYMBOLS[(i + index * 2) % SYMBOLS.length].id,
  );
  const strip = spinning ? [...previous, ...filler, ...next] : next;
  return (
    <div
      className={styles.reel}
      aria-label={`Reel ${index + 1}: ${spinning ? "spinning" : next.map((id) => SYMBOLS.find((s) => s.id === id)!.label).join(", ")}`}
    >
      <div
        className={`${styles.strip} ${spinning ? styles.rolling : ""}`}
        style={
          {
            "--steps": previous.length + filler.length,
            "--duration": `${1400 + index * 350}ms`,
          } as CSSProperties
        }
        aria-hidden="true"
      >
        {strip.map((symbol, row) => (
          <div
            key={row}
            className={`${styles.cell} ${!spinning && hotRows.includes(row) ? styles.winningCell : ""}`}
          >
            <SlotSymbol symbol={symbol} />
          </div>
        ))}
      </div>
      <div className={styles.reelShade} />
    </div>
  );
}

export function SlotsTable() {
  const { state, dispatch, setScreen } = useGame();
  const [practice, setPractice] = useState(
    state.pendingSlotSpin?.practice ?? state.lastSlotSpin?.practice ?? false,
  );
  const [bet, setBet] = useState<number>(
    state.pendingSlotSpin?.bet ?? state.lastSlotSpin?.bet ?? 10,
  );
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const pending = state.pendingSlotSpin;
  const last = state.lastSlotSpin;
  const spinning = !!pending;
  const offDuty = state.time === "after";
  const practiceMode = offDuty || practice;
  const grid = pending?.grid ?? last?.grid ?? INITIAL_GRID;
  const previous = last?.grid ?? INITIAL_GRID;
  const result = last ? scoreGrid(last.grid, last.bet) : null;
  const hot = spinning ? [] : (result?.lines.map((line) => line.index) ?? []);
  const visibleLines = spinning
    ? []
    : selectedLine !== null
      ? [selectedLine]
      : hot;
  const insufficient = !practiceMode && state.chips < bet;
  const topics = topicsFor(state, "mika", "table");
  const heard = useRef(last?.id);
  useEffect(() => {
    if (!last || heard.current === last.id) return;
    heard.current = last.id;
    const scored = scoreGrid(last.grid, last.bet);
    playSfx(
      isJackpot(scored.lines) ? "jackpot" : scored.total > 0 ? "win" : "lose",
      state.sfx,
    );
  }, [last, state.sfx]);
  const line = offDuty
    ? "Mika left the cabinet humming and a note that says: clap for the cherries anyway. Practice is on the house."
    : last && result
      ? pickLine(
          "mika",
          last.practice
            ? "practice"
            : isJackpot(result.lines)
              ? "jackpot"
              : result.total > 0
                ? "win"
                : "lose",
          result.total + last.bet,
        )
      : pickLine("mika", "greet", 2);

  function spin() {
    if (spinning || insufficient) return;
    setSelectedLine(null);
    dispatch({
      type: "slots-spin",
      spin: {
        id: crypto.randomUUID(),
        grid: spinReels(),
        bet,
        practice: practiceMode,
        hosted: !offDuty,
        endsAt: Date.now() + SPIN_DURATION,
      },
    });
    playSfx("chip", state.sfx);
  }
  const status = spinning
    ? "The reels are turning…"
    : !result
      ? "Your evening starts with a spin."
      : isJackpot(result.lines)
        ? "Mirage moment!"
        : result.total > 0
          ? `${result.lines.length} winning ${result.lines.length === 1 ? "line" : "lines"}`
          : "No winning line this time.";
  const net = result && last ? result.total - last.bet : 0;
  return (
    <main className={styles.layout}>
      <Tutorial
        id="slots"
        title="Mirage Reels with Mika"
        bullets={[
          "One stake covers all five lines: middle, top, bottom, and both diagonals.",
          "Match three symbols on a line. Mirage is wild; three wilds pay the highest amount.",
          "The paytable shows the actual chips paid per line at your selected stake. Winning lines add together; your stake is charged once.",
          "Practice uses the same odds without spending chips or changing relationships. After hours, the cabinet is practice only.",
        ]}
      />
      <div className={styles.host}>
        <HostRail
          host="mika"
          line={line}
          aside="A little light, a little luck, a whole lot of cheering."
        />
      </div>
      <section className={styles.table} aria-label="Mirage slot machine">
        <div className={styles.toolbar}>
          <span className={styles.eyebrow}>
            The midnight collection · No. 03
          </span>
          <div className="flex flex-wrap gap-2">
            <RulesButton
              title="Mirage Reels"
              body={[
                "Your total stake covers all five lines. Matching symbols pay across all three reels. A Mirage wild substitutes for any symbol; three wilds pay as Mirage.",
                "Each winning line pays floor(stake × symbol multiplier ÷ 4): Cherry 5, Bell 8, Star 12, Gem 20, Seven 40, Mirage 50. Multiple line wins add together. Net change is payout minus stake.",
                "Every spin is independent. Practice uses the same symbol weights and payouts, with no chip or relationship changes. After hours is always practice.",
                "A chip spin charges its stake when it starts and pays once when it finishes. It will finish even if you leave the table or reload.",
              ]}
            />
            {!offDuty &&
              topics.slice(0, 1).map((topic) => (
                <Button
                  key={topic.id}
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setScreen({
                      name: "dialogue",
                      sceneId: topic.id,
                      back: { name: "slots" },
                    })
                  }
                >
                  Talk with Mika
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
        <div className={styles.cabinet}>
          <div className={styles.marquee}>
            <span className={styles.marqueeOrnament} aria-hidden="true">
              ✦
            </span>
            <div>
              <p className={styles.eyebrow}>Midnight Mirage presents</p>
              <h2>Mirage Reels</h2>
              <p className={styles.subtitle}>
                Three reels. Five lines. A little midnight magic.
              </p>
            </div>
            <span className={styles.marqueeOrnament} aria-hidden="true">
              ✦
            </span>
          </div>
          <div className={styles.featureStrip}>
            <span>
              <Sparkles size={14} aria-hidden="true" /> Mirage wild ×3
            </span>
            <span>
              <strong>{money(linePayout("wild", bet))}</strong> chips per line
            </span>
          </div>
          <div className={styles.reelFrame}>
            <span className={styles.edgeMark} aria-hidden="true">
              ▸
            </span>
            <div className={styles.reels} aria-busy={spinning}>
              {grid.map((reel, index) => (
                <Reel
                  key={`${pending?.id ?? "idle"}-${index}`}
                  previous={previous[index]}
                  next={reel}
                  index={index}
                  spinning={spinning}
                  hotRows={hot.map((lineIndex) => PAYLINES[lineIndex][index])}
                />
              ))}
              <svg
                className={styles.paylineOverlay}
                viewBox="0 0 300 300"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {visibleLines.map((index) => (
                  <polyline
                    key={index}
                    points={PAYLINES[index]
                      .map(
                        (row, reel) => `${50 + reel * 100},${50 + row * 100}`,
                      )
                      .join(" ")}
                    fill="none"
                    stroke={LINE_COLORS[index]}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </svg>
            </div>
            <span className={styles.edgeMark} aria-hidden="true">
              ◂
            </span>
          </div>
          <div
            className={styles.lines}
            role="group"
            aria-label="Preview paylines"
          >
            {PAYLINE_NAMES.map((name, index) => (
              <button
                key={name}
                type="button"
                disabled={spinning}
                aria-pressed={selectedLine === index}
                aria-label={`${name} payline${hot.includes(index) ? ", winning" : ""}`}
                className={`${styles.lineButton} ${hot.includes(index) ? styles.lineWon : ""}`}
                style={{ "--line-color": LINE_COLORS[index] } as CSSProperties}
                onClick={() =>
                  setSelectedLine(selectedLine === index ? null : index)
                }
              >
                <span>{index + 1}</span>
                <span>{name}</span>
              </button>
            ))}
          </div>
          <div className={styles.readouts}>
            <div>
              <span>Balance</span>
              <strong>{money(state.chips)}</strong>
            </div>
            <div>
              <span>Total stake</span>
              <strong>{money(pending?.bet ?? bet)}</strong>
            </div>
            <div className={styles.payoutReadout}>
              <span>
                {last?.practice && !spinning
                  ? "Practice payout"
                  : "Last payout"}
              </span>
              <strong>{spinning ? "—" : money(result?.total ?? 0)}</strong>
            </div>
          </div>
          <div className={styles.controls}>
            <div>
              <p className={styles.controlLabel}>
                Stake · all 5 lines included
              </p>
              <div
                className={styles.stakes}
                role="group"
                aria-label="Select total stake"
              >
                {LIMITS.slots.map((value) => (
                  <button
                    type="button"
                    key={value}
                    aria-pressed={bet === value}
                    disabled={
                      spinning || (!practiceMode && state.chips < value)
                    }
                    onClick={() => setBet(value)}
                  >
                    {money(value)}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              className={styles.spinButton}
              disabled={spinning || insufficient}
              onClick={spin}
            >
              <RotateCw size={22} aria-hidden="true" />
              <span>
                {spinning
                  ? "Spinning…"
                  : practiceMode
                    ? "Practice spin"
                    : "Spin reels"}
              </span>
            </button>
          </div>
          <div className={styles.modeRow}>
            <label className={styles.practiceLabel}>
              <Switch
                checked={practiceMode}
                onCheckedChange={setPractice}
                disabled={spinning || offDuty}
                aria-label="Practice mode"
              />{" "}
              Practice mode
            </label>
            <span>
              {offDuty
                ? "After hours · practice only"
                : practiceMode
                  ? "Your chips stay in your pocket"
                  : "Fictional house chips"}
            </span>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={
                state.sfx ? "Mute sound effects" : "Enable sound effects"
              }
              onClick={() => dispatch({ type: "toggle-sfx" })}
            >
              {state.sfx ? <Volume2 /> : <VolumeX />}
            </Button>
          </div>
          {insufficient && !spinning && (
            <p className={styles.fundsNote}>
              You need {money(bet)} chips for this stake. Choose a smaller stake
              or switch to practice.
            </p>
          )}
          <div
            className={`${styles.result} ${!spinning && result && result.total > 0 ? styles.resultWin : ""}`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <strong>{status}</strong>
            {!spinning && result && last ? (
              <p>
                {last.practice ? "Practice · " : ""}Payout {money(result.total)}{" "}
                · Stake {money(last.bet)} ·{" "}
                {last.practice ? "Simulated net" : "Net"} {net > 0 ? "+" : ""}
                {money(net)} chips
              </p>
            ) : (
              <p>
                {spinning
                  ? pending.practice
                    ? "A free spin, with the same odds."
                    : "Stake placed. All five lines are in play."
                  : "Select a stake, then spin. Tap a line above to see its path."}
              </p>
            )}
            {!spinning && result && result.lines.length > 0 && (
              <div className={styles.winBreakdown}>
                {result.lines.map((win) => (
                  <span
                    key={win.index}
                    style={{ color: LINE_COLORS[win.index] }}
                  >
                    {PAYLINE_NAMES[win.index]} ·{" "}
                    {SYMBOLS.find((s) => s.id === win.symbol)!.label} +
                    {money(win.amount)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <section className={styles.paytable} aria-label="Slot paytable">
          <div className={styles.paytableHeading}>
            <h3>Every symbol has its moment</h3>
            <p>
              Three of a kind · chips per winning line at a {money(bet)} stake
            </p>
          </div>
          <ul>
            {SYMBOLS.map((symbol) => (
              <li key={symbol.id}>
                <SlotSymbol symbol={symbol.id} small />
                <span>
                  {symbol.label}
                  {symbol.id === "wild" && (
                    <small>Substitutes for any symbol</small>
                  )}
                </span>
                <strong>{money(linePayout(symbol.id, bet))}</strong>
              </li>
            ))}
          </ul>
          <p className={styles.paytableNote}>
            Line wins add together. Payouts are rounded down to whole chips.
            Each spin is independent.
          </p>
        </section>
      </section>
    </main>
  );
}
