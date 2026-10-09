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
