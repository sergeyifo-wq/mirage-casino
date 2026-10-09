export type SymbolId = "cherry" | "bell" | "star" | "gem" | "seven" | "wild";

export const SYMBOLS: { id: SymbolId; label: string; weight: number; pay: number }[] = [
  { id: "cherry", label: "Cherry", weight: 26, pay: 5 },
  { id: "bell", label: "Bell", weight: 18, pay: 8 },
  { id: "star", label: "Star", weight: 14, pay: 12 },
  { id: "gem", label: "Gem", weight: 9, pay: 20 },
  { id: "seven", label: "Seven", weight: 5, pay: 40 },
  { id: "wild", label: "Mirage", weight: 4, pay: 50 },
];

export const PAY_DIVISOR = 4;

export const PAYLINES: number[][] = [
  [1, 1, 1],
  [0, 0, 0],
  [2, 2, 2],
  [0, 1, 2],
  [2, 1, 0],
];

const WEIGHT_TOTAL = SYMBOLS.reduce((sum, symbol) => sum + symbol.weight, 0);

export function randomSymbol(rng: () => number): SymbolId {
  let roll = rng() * WEIGHT_TOTAL;
  for (const symbol of SYMBOLS) {
    roll -= symbol.weight;
    if (roll <= 0) return symbol.id;
  }
  return "cherry";
}

export function spinReels(rng: () => number = Math.random): SymbolId[][] {
  return [0, 1, 2].map(() => [0, 1, 2].map(() => randomSymbol(rng)));
}

export type LineWin = { index: number; symbol: SymbolId; pay: number; amount: number };

export function scoreGrid(grid: SymbolId[][], bet: number): { total: number; lines: LineWin[] } {
  const lines: LineWin[] = [];
  PAYLINES.forEach((rows, index) => {
    const symbols = rows.map((row, reel) => grid[reel][row]);
    const named = symbols.find((symbol) => symbol !== "wild");
    const symbol = named ?? "wild";
    const matched = symbols.every((entry) => entry === symbol || entry === "wild");
    if (!matched) return;
    const pay = SYMBOLS.find((entry) => entry.id === symbol)?.pay ?? 0;
    const amount = Math.floor((bet * pay) / PAY_DIVISOR);
    if (amount > 0) lines.push({ index, symbol, pay, amount });
  });
  return { total: lines.reduce((sum, line) => sum + line.amount, 0), lines };
}

export function isJackpot(lines: readonly LineWin[]): boolean {
  return lines.some((line) => line.symbol === "seven" || line.symbol === "wild");
}
