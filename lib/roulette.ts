import { LIMITS } from "./presence";

export const ROULETTE_SPIN_DURATION = 7400;
export const ROULETTE_CHIPS = [5, 10, 25, 50] as const;

export const WHEEL = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9,
  22, 18, 29, 7, 28, 12, 35, 3, 26,
] as const;

export const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export type BetKind = "straight" | "red" | "black" | "odd" | "even" | "low" | "high" | "dozen" | "column";

export type RouletteBet = {
  id: string;
  kind: BetKind;
  amount: number;
  n?: number;
};

export type RouletteSpin = { id: string; result: number; bets: RouletteBet[]; practice: boolean; startedAt: number; endsAt: number };
export type BetTarget = Omit<RouletteBet, "id" | "amount">;

export function validTarget(target: BetTarget): boolean {
  if (target.kind === "straight") return Number.isInteger(target.n) && target.n! >= 0 && target.n! <= 36;
  if (target.kind === "dozen" || target.kind === "column") return Number.isInteger(target.n) && target.n! >= 1 && target.n! <= 3;
  return ["red", "black", "odd", "even", "low", "high"].includes(target.kind) && target.n === undefined;
}

export function validRouletteBets(bets: unknown): bets is RouletteBet[] {
  if (!Array.isArray(bets) || !bets.length) return false;
  const targets = new Set<string>();
  let total = 0;
  for (const bet of bets) {
    if (!bet || typeof bet.id !== "string" || !validTarget(bet) || !Number.isSafeInteger(bet.amount) || bet.amount < 5 || bet.amount % 5 !== 0) return false;
    if (bet.kind === "straight" && bet.amount > LIMITS.roulette.maxSpot) return false;
    const key = `${bet.kind}:${bet.n ?? "x"}`;
    if (targets.has(key)) return false;
    targets.add(key); total += bet.amount;
  }
  return total <= LIMITS.roulette.maxTotal;
}

export function addRouletteChip(bets: readonly RouletteBet[], target: BetTarget, chip: number, bankroll = Infinity): { bets: RouletteBet[]; error: string | null } {
  const unchanged = () => [...bets];
  if (!validTarget(target) || !ROULETTE_CHIPS.some((value) => value === chip)) return { bets: unchanged(), error: "Choose a valid chip and betting spot." };
  const total = bets.reduce((sum, bet) => sum + bet.amount, 0);
  if (total + chip > LIMITS.roulette.maxTotal) return { bets: unchanged(), error: "The table limit is 300 chips per spin." };
  if (total + chip > bankroll) return { bets: unchanged(), error: "Your rack cannot cover another chip. Undo a bet or use practice." };
  const existing = bets.find((bet) => bet.kind === target.kind && bet.n === target.n);
  if (target.kind === "straight" && (existing?.amount ?? 0) + chip > LIMITS.roulette.maxSpot) return { bets: unchanged(), error: "The limit on one number is 50 chips." };
  return { bets: existing ? bets.map((bet) => bet === existing ? { ...bet, amount: bet.amount + chip } : bet) : [...bets, { ...target, id: `${target.kind}:${target.n ?? "x"}`, amount: chip }], error: null };
}

export function validRouletteSpin(spin: RouletteSpin | null | undefined): spin is RouletteSpin {
  return !!spin && typeof spin.id === "string" && spin.id.length > 0 && Number.isInteger(spin.result) && spin.result >= 0 && spin.result <= 36
    && typeof spin.practice === "boolean" && Number.isFinite(spin.startedAt) && Number.isFinite(spin.endsAt)
    && spin.endsAt > spin.startedAt && spin.endsAt - spin.startedAt <= ROULETTE_SPIN_DURATION && validRouletteBets(spin.bets);
}

/** Geometry uses +Z as the front pocket. Both wheel and ball finish there. */
export function roulettePose(result: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  const tau = Math.PI * 2;
  const center = (WHEEL.indexOf(result as (typeof WHEEL)[number]) + .5) * tau / WHEEL.length;
  const end = 6 * tau - center;
  const easeWheel = (t: number) => 1 - (1 - t) ** 3;
  const easeBall = (t: number) => 1 - (1 - t) ** 2;
  const smooth = (t: number) => { const n = Math.max(0, Math.min(1, t)); return n * n * (3 - 2 * n); };
  const wheel = end * easeWheel(p);
  const gate = .78;
  const gateBall = -8 * tau * easeBall(gate);
  const cycles = Math.round((end * easeWheel(gate) + center - gateBall) / tau);
  const ball = p < gate ? -8 * tau * easeBall(p) : gateBall + (wheel + center - cycles * tau - gateBall) * smooth((p - gate) / (1 - gate));
  const drop = smooth((p - .62) / .32);
  return { wheel, ball, radius: 1.98 - .69 * drop, height: .60 - .27 * drop + (p > .62 ? Math.abs(Math.sin(p * 90)) * .10 * (1 - drop) : 0) };
}

export function isRed(n: number): boolean {
  return REDS.has(n);
}

export function columnOf(n: number): number | null {
  if (n < 1 || n > 36) return null;
  return ((n - 1) % 3) + 1;
}

export function dozenOf(n: number): number | null {
  if (n < 1 || n > 36) return null;
  return Math.floor((n - 1) / 12) + 1;
}

export function betWins(bet: RouletteBet, result: number): boolean {
  switch (bet.kind) {
    case "straight":
      return bet.n === result;
    case "red":
      return result !== 0 && isRed(result);
    case "black":
      return result !== 0 && !isRed(result);
    case "odd":
      return result !== 0 && result % 2 === 1;
    case "even":
      return result !== 0 && result % 2 === 0;
    case "low":
      return result >= 1 && result <= 18;
    case "high":
      return result >= 19 && result <= 36;
    case "dozen":
      return dozenOf(result) === bet.n;
    case "column":
      return columnOf(result) === bet.n;
    default:
      return false;
  }
}

export function returnedStake(bet: RouletteBet, result: number): number {
  if (!betWins(bet, result)) return 0;
  const multiple = bet.kind === "straight" ? 36 : bet.kind === "dozen" || bet.kind === "column" ? 3 : 2;
  return bet.amount * multiple;
}

export function spinWheel(rng: () => number = Math.random): number {
  return WHEEL[Math.floor(rng() * WHEEL.length)];
}

export function settleRoulette(bets: readonly RouletteBet[], result: number): { returned: number; winning: RouletteBet[] } {
  const winning = bets.filter((bet) => betWins(bet, result));
  return { returned: winning.reduce((sum, bet) => sum + returnedStake(bet, result), 0), winning };
}

export function wheelRotationFor(result: number, turns = 6): number {
  const index = WHEEL.indexOf(result as (typeof WHEEL)[number]);
  const slice = 360 / WHEEL.length;
  const center = (index + 0.5) * slice;
  return turns * 360 - center;
}

export function betLabel(bet: RouletteBet): string {
  switch (bet.kind) {
    case "straight":
      return `${bet.n}`;
    case "dozen":
      return bet.n === 1 ? "1–12" : bet.n === 2 ? "13–24" : "25–36";
    case "column":
      return `Column ${bet.n}`;
    default:
      return bet.kind;
  }
}
