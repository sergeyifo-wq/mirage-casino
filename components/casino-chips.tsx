"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
} from "react";
import { CHIP_DRAG_TYPE, CHIP_VALUES, splitChips } from "@/lib/chips";
import styles from "./casino-chips.module.css";

const COLORS: Record<number, string> = {
  5: "#a63149",
  10: "#246ca0",
  25: "#2a8a6c",
  50: "#7753a2",
  100: "#282c35",
  200: "#bc8334",
  500: "#bb668a",
};

export function CasinoChip({
  value,
  small = false,
}: {
  value: number;
  small?: boolean;
}) {
  return (
    <span
      className={`${styles.chip} ${small ? styles.small : ""}`}
      style={{ "--chip-color": COLORS[value] ?? "#bc8334" } as CSSProperties}
      aria-hidden="true"
    >
      <span className={styles.face}>
        <small>MIRAGE</small>
        <strong>{value.toLocaleString("en-US")}</strong>
      </span>
    </span>
  );
}

export function ChipStack({
  amount,
  small = false,
  denominations,
}: {
  amount: number;
  small?: boolean;
  denominations?: readonly number[];
}) {
  const chips = splitChips(amount, denominations);
  if (!amount) return null;
  return (
    <span
      className={`${styles.stack} ${small ? styles.smallStack : ""}`}
      aria-label={`${amount} chips`}
    >
      {chips.slice(0, 3).map((value, index) => (
        <span
          key={index}
          style={{ "--stack-offset": `${index * -4}px` } as CSSProperties}
        >
          <CasinoChip value={value} small={small} />
        </span>
      ))}
      <span className={styles.stackTotal}>
        {amount.toLocaleString("en-US")}
      </span>
    </span>
  );
}

export function draggedChip(event: DragEvent): number | null {
  const value = Number(event.dataTransfer.getData(CHIP_DRAG_TYPE));
  return CHIP_VALUES.some((chip) => chip === value) ? value : null;
}

export function ChipRack({
  values,
  selected,
  onSelect,
  disabled = false,
  unavailable = [],
  label = "Choose a chip",
  small = false,
}: {
  values: readonly number[];
  selected: number;
  onSelect: (value: number) => void;
  disabled?: boolean;
  unavailable?: number[];
  label?: string;
  small?: boolean;
}) {
  const gesture = useRef<{
    x: number;
    y: number;
    value: number;
    moved: boolean;
  } | null>(null);
  const [floating, setFloating] = useState<{
    x: number;
    y: number;
    value: number;
  } | null>(null);
  useEffect(() => {
    function move(event: PointerEvent) {
      const drag = gesture.current;
      if (!drag) return;
      if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 8)
        drag.moved = true;
      if (drag.moved)
        setFloating({ x: event.clientX, y: event.clientY, value: drag.value });
    }
    function stop(event: PointerEvent) {
      const drag = gesture.current;
      gesture.current = null;
      setFloating(null);
      if (event.type === "pointerup" && drag?.moved) {
        const target = document
          .elementFromPoint(event.clientX, event.clientY)
          ?.closest<HTMLButtonElement>("button[data-chip-drop]");
        if (target && !target.disabled) target.click();
      }
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, []);
  return (
    <div className={styles.rack} role="group" aria-label={label}>
      {values.map((value) => (
        <button
          key={value}
          type="button"
          aria-label={`Select ${value}-chip`}
          aria-pressed={selected === value}
          disabled={disabled || unavailable.includes(value)}
          draggable={false}
          onPointerDown={(event) => {
            if (event.button !== 0 || disabled || unavailable.includes(value))
              return;
            event.currentTarget.focus({ preventScroll: true });
            gesture.current = {
              x: event.clientX,
              y: event.clientY,
              value,
              moved: false,
            };
            onSelect(value);
          }}
          onClick={() => onSelect(value)}
        >
          <CasinoChip value={value} small={small} />
        </button>
      ))}
      {floating && (
        <span
          className={styles.floatingChip}
          style={{ left: floating.x, top: floating.y }}
          aria-hidden="true"
        >
          <CasinoChip value={floating.value} small={small} />
        </span>
      )}
    </div>
  );
}

export function ChipBetControl({
  value,
  min,
  max,
  step,
  onChange,
  label = "Your wager",
  disabled = false,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  label?: string;
  disabled?: boolean;
}) {
  const denominations = CHIP_VALUES.filter(
    (chip) => chip % step === 0 && chip <= max,
  );
  const [selected, setSelected] = useState(step);
  const [history, setHistory] = useState<number[]>([]);
  const canAdd = !disabled && value + selected <= max;
  function place(chip: number) {
    if (
      disabled ||
      !denominations.includes(chip as (typeof CHIP_VALUES)[number]) ||
      value + chip > max
    )
      return;
    setHistory((current) => [...current, value].slice(-30));
    onChange(value + chip);
  }
  return (
    <div className={styles.betControl}>
      <div>
        <p className={styles.label}>
          Choose a chip · tap or drag it onto the felt
        </p>
        <ChipRack
          values={denominations}
          selected={selected}
          onSelect={setSelected}
          disabled={disabled}
          unavailable={denominations.filter((chip) => value + chip > max)}
        />
      </div>
      <button
        type="button"
        data-chip-drop
        className={styles.betSpot}
        aria-label={`Add ${selected} chips to ${label.toLowerCase()}; current wager ${value}`}
        disabled={!canAdd}
        onClick={() => place(selected)}
        onDragOver={(event) => {
          if (!disabled) event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          const chip = draggedChip(event);
          if (chip) place(chip);
        }}
      >
        <span className={styles.label}>{label}</span>
        {value ? (
          <ChipStack
            amount={value}
            denominations={CHIP_VALUES.filter((chip) => chip % step === 0)}
          />
        ) : (
          <span className={styles.emptySpot}>Place chips</span>
        )}
        <strong>{value.toLocaleString("en-US")} chips</strong>
      </button>
      <div className={styles.betTools}>
        <button
          type="button"
          disabled={disabled || !history.length}
          onClick={() => {
            const previous = history[history.length - 1];
            setHistory((current) => current.slice(0, -1));
            onChange(previous);
          }}
        >
          Undo
        </button>
        <button
          type="button"
          disabled={disabled || value === 0}
          onClick={() => {
            setHistory((current) => [...current, value].slice(-30));
            onChange(0);
          }}
        >
          Clear
        </button>
        <span>
          {max < min
            ? `Minimum ${min} chips. Your rack is too low; practice is free.`
            : `${min}–${max} chips${value < min ? ` · place at least ${min}` : ""}`}
        </span>
      </div>
    </div>
  );
}
