"use client";

import { useEffect, useRef, useState } from "react";
import { WHEEL, isRed, type RouletteSpin } from "@/lib/roulette";
import type { createRouletteScene, WheelView } from "@/lib/roulette-scene";
import styles from "./roulette-table.module.css";

export function RouletteWheel({
  spin,
  spinning,
}: {
  spin: RouletteSpin | null;
  spinning: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<ReturnType<typeof createRouletteScene> | null>(
    null,
  );
  const latest = useRef({ spin, spinning, view: "table" as WheelView });
  const [view, setView] = useState<WheelView>("table");
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    latest.current = { spin, spinning, view };
    controller.current?.update(spin, spinning, view);
  }, [spin, spinning, view]);
  useEffect(() => {
    if (spinning)
      host.current?.scrollIntoView({
        block: "center",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
  }, [spinning, spin?.id]);
  useEffect(() => {
    let mounted = true;
    import("@/lib/roulette-scene")
      .then(({ createRouletteScene }) => {
        if (!mounted || !host.current) return;
        try {
          controller.current = createRouletteScene(host.current, () => {
            if (mounted) setFallback(true);
          });
          controller.current.update(
            latest.current.spin,
            latest.current.spinning,
            latest.current.view,
          );
        } catch {
          if (mounted) setFallback(true);
        }
      })
      .catch(() => {
        if (mounted) setFallback(true);
      });
    return () => {
      mounted = false;
      controller.current?.dispose();
      controller.current = null;
    };
  }, []);
  return (
    <div className={styles.wheelPanel}>
      <div className={styles.wheelViews} role="group" aria-label="Wheel camera">
        <button
          type="button"
          aria-pressed={view === "table"}
          onClick={() => setView("table")}
        >
          Table view
        </button>
        <button
          type="button"
          aria-pressed={view === "overhead"}
          onClick={() => setView("overhead")}
        >
          Overhead
        </button>
      </div>
      <div
        className={styles.wheelStage}
        ref={host}
        role="img"
        aria-label={`European roulette wheel${spinning ? ", ball spinning" : spin ? `, ball rests on ${spin.result}` : ", ready"}`}
        data-wheel-renderer={fallback ? "classic" : "3d"}
      >
        {fallback && (
          <ClassicWheel number={spinning ? null : (spin?.result ?? null)} />
        )}
      </div>
      <p className={styles.wheelPlate}>
        Midnight Mirage <span>European · single zero · 37 pockets</span>
      </p>
    </div>
  );
}

function ClassicWheel({ number }: { number: number | null }) {
  return (
    <svg
      viewBox="0 0 300 300"
      className={styles.classicWheel}
      aria-hidden="true"
    >
      <circle
        cx="150"
        cy="150"
        r="145"
        fill="#80472e"
        stroke="#d8b16b"
        strokeWidth="5"
      />
      {WHEEL.map((n, index) => {
        const angle = ((index + 0.5) * Math.PI * 2) / WHEEL.length;
        return (
          <g
            key={n}
            transform={`rotate(${(index * 360) / WHEEL.length} 150 150)`}
          >
            <path
              d={`M150 150 L150 22 A128 128 0 0 1 ${150 + Math.sin((Math.PI * 2) / 37) * 128} ${150 - Math.cos((Math.PI * 2) / 37) * 128} Z`}
              fill={n === 0 ? "#147c50" : isRed(n) ? "#a32b3f" : "#19161d"}
              stroke="#b9965d"
              strokeWidth=".5"
            />
            <text
              x={150 + Math.sin(angle - (index * Math.PI * 2) / 37) * 113}
              y={150 - Math.cos(angle - (index * Math.PI * 2) / 37) * 113}
              textAnchor="middle"
              fill="#fff1d5"
              fontSize="9"
            >
              {n}
            </text>
          </g>
        );
      })}
      <circle
        cx="150"
        cy="150"
        r="70"
        fill="#8a5637"
        stroke="#d8b16b"
        strokeWidth="3"
      />
      <text x="150" y="160" textAnchor="middle" fill="#fbe3ac" fontSize="30">
        {number ?? "✦"}
      </text>
    </svg>
  );
}
