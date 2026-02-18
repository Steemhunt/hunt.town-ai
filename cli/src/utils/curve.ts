/**
 * Bonding curve generator for Hunt Town Co-op projects
 *
 * Ported from mintpad LaunchModal.tsx generateBondingCurveParams.
 * Generates a hyperbolic J-curve: multiplier = (1 / (1 - progress * steepness))^exponent
 */
import { parseEther, formatEther } from 'viem';

export const CURVE_CONFIG = {
  STEP_COUNT: 500,
  CURVE_STEEPNESS: 0.85,   // gap between initial and later increases
  CURVE_EXPONENT: 4,        // power-4 hyperbolic J-curve
  DEFAULT_ROYALTY_BPS: 100,  // 1.0%
} as const;

/** FDV presets in USD — same as mintpad web app */
export const FDV_PRESETS: Record<string, number> = {
  small: 1_000,    // $1K initial FDV
  medium: 5_000,   // $5K initial FDV
  large: 30_000,   // $30K initial FDV
};

export interface CurveResult {
  stepRanges: bigint[];
  stepPrices: bigint[];
  initialPrice: number;
  finalPrice: number;
  multiplier: number;
  tvlHunt: number;
}

/**
 * Generate a hyperbolic bonding curve from initial FDV target.
 *
 * @param maxSupplyWei - Max token supply in wei (18 decimals)
 * @param initialFdvUsd - Target initial fully diluted valuation in USD
 * @param huntPriceUsd - Current HUNT price in USD
 */
export function generateBondingCurve(
  maxSupplyWei: bigint,
  initialFdvUsd: number,
  huntPriceUsd: number,
): CurveResult {
  const maxSupplyNum = Number(formatEther(maxSupplyWei));
  const initialPriceInHunt = initialFdvUsd / (maxSupplyNum * huntPriceUsd);

  if (initialPriceInHunt <= 0) {
    throw new Error('Calculated initial price is zero — check FDV and max supply');
  }

  const stepSize = maxSupplyWei / BigInt(CURVE_CONFIG.STEP_COUNT);
  const stepRanges: bigint[] = [];
  const stepPrices: bigint[] = [];
  let cumulativeSupply = 0n;

  const multipliers: number[] = [];
  for (let i = 0; i < CURVE_CONFIG.STEP_COUNT; i++) {
    const progress = i / CURVE_CONFIG.STEP_COUNT;
    const scarcity = 1 - progress * CURVE_CONFIG.CURVE_STEEPNESS;
    multipliers.push(Math.pow(1 / scarcity, CURVE_CONFIG.CURVE_EXPONENT));
  }

  for (let i = 0; i < CURVE_CONFIG.STEP_COUNT; i++) {
    const price = initialPriceInHunt * multipliers[i];
    stepPrices.push(price > 0 ? parseEther(price.toFixed(20)) : 0n);

    cumulativeSupply += stepSize;
    const isLast = i === CURVE_CONFIG.STEP_COUNT - 1;
    stepRanges.push(isLast ? maxSupplyWei : cumulativeSupply);
  }

  // Calculate TVL (total HUNT locked if fully minted)
  const WEI = 10n ** 18n;
  const tvlWei = stepPrices.reduce(
    (sum, price) => sum + (price * stepSize) / WEI,
    0n,
  );

  const finalMultiplier = multipliers[CURVE_CONFIG.STEP_COUNT - 1];
  const finalPrice = initialPriceInHunt * finalMultiplier;

  return {
    stepRanges,
    stepPrices,
    initialPrice: initialPriceInHunt,
    finalPrice,
    multiplier: finalMultiplier,
    tvlHunt: Number(formatEther(tvlWei)),
  };
}
