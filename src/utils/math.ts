/**
 * Utility functions for safe arithmetic and statistical calculations.
 * Prevents NaN / Infinity from division by zero.
 */

/**
 * Safely divides two numbers. Returns fallback if denominator is 0, NaN, or non-finite.
 */
export function safeDivide(numerator: number, denominator: number, fallback: number = 0): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return fallback;
  }
  return numerator / denominator;
}

/**
 * Rounds a number to a specified number of decimal places (default 2).
 */
export function round(value: number, decimals: number = 2): number {
  if (!Number.isFinite(value)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Calculates a percentage safely with rounding.
 * e.g., safePercentage(2, 4) => 50
 */
export function safePercentage(
  numerator: number,
  denominator: number,
  decimals: number = 2
): number {
  const result = safeDivide(numerator, denominator, 0) * 100;
  return round(result, decimals);
}
