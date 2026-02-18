/**
 * HUNT token price utilities
 *
 * Uses 1inch Spot Price Aggregator on Base to get HUNT/USDC rate.
 * The aggregator returns weightedRate in USDC units (6 decimals) per 1 HUNT (18 decimals).
 * Price in USD = weightedRate / 1e6
 */
import { publicClient } from '../config/client.js';
import { CONTRACTS } from '../config/contracts.js';
import { SPOT_PRICE_ABI } from '../abi/spot-price.js';
import { formatNumber } from './format.js';

let cachedPrice: { value: number; timestamp: number } | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute

/**
 * Fetch HUNT price in USD from 1inch spot price aggregator
 */
export async function getHuntPrice(): Promise<number> {
  if (cachedPrice && Date.now() - cachedPrice.timestamp < CACHE_TTL_MS) {
    return cachedPrice.value;
  }

  try {
    const weightedRate = await publicClient.readContract({
      address: CONTRACTS.SPOT_PRICE_AGGREGATOR,
      abi: SPOT_PRICE_ABI,
      functionName: 'getRate',
      args: [CONTRACTS.HUNT, CONTRACTS.USDC, false],
    });

    // weightedRate is USDC (6 decimals) per HUNT (18 decimals) -> divide by 1e6
    const price = Number(weightedRate) / 1_000_000;
    cachedPrice = { value: price, timestamp: Date.now() };
    return price;
  } catch {
    return cachedPrice?.value ?? 0;
  }
}

/**
 * Convert HUNT amount to USD string
 */
export function huntToUSD(huntAmount: number, huntPrice: number): string {
  const usd = huntAmount * huntPrice;
  if (usd < 0.01) return '$0.00';
  return `$${formatNumber(usd.toFixed(2))}`;
}

/**
 * Format HUNT amount with USD equivalent inline
 */
export function formatHuntWithUSD(huntAmount: number, huntPrice: number): string {
  return `${formatNumber(huntAmount.toFixed(2))} HUNT (${huntToUSD(huntAmount, huntPrice)})`;
}
