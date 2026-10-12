export const CHIP_VALUES = [5, 10, 25, 50, 100, 200, 500] as const;
export const CHIP_DRAG_TYPE = "application/x-mirage-chip";

export function splitChips(
  amount: number,
  denominations: readonly number[] = CHIP_VALUES,
): number[] {
  if (!Number.isSafeInteger(amount) || amount < 0) return [];
  const chips: number[] = [];
  let left = amount;
  for (const value of [...denominations]
    .filter((n) => n > 0)
    .sort((a, b) => b - a)) {
    while (left >= value && chips.length < 100) {
      chips.push(value);
      left -= value;
    }
  }
  return chips;
}

export function validWager(
  amount: number,
  min: number,
  max: number,
  step: number,
): boolean {
  return (
    Number.isSafeInteger(amount) &&
    amount >= min &&
    amount <= max &&
    amount % step === 0
  );
}
