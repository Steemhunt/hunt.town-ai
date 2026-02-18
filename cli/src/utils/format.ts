/**
 * Formatting utilities for numbers, addresses, and display
 */
import type { Address } from 'viem';

/**
 * Format a large number with commas for readability
 */
export function formatNumber(num: number | bigint | string): string {
  const numStr = typeof num === 'bigint' ? num.toString() : num.toString();
  const parts = numStr.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

/**
 * Format a token amount with decimals
 */
export function formatTokenAmount(
  amount: bigint,
  decimals: number,
  displayDecimals: number = 2
): string {
  const divisor = BigInt(10 ** decimals);
  const quotient = amount / divisor;
  const remainder = amount % divisor;
  
  const remainderStr = remainder.toString().padStart(decimals, '0');
  const decimalPart = remainderStr.slice(0, displayDecimals);
  
  if (displayDecimals === 0) {
    return formatNumber(quotient.toString());
  }
  
  const trimmed = decimalPart.replace(/0+$/, '');
  if (trimmed === '') {
    return formatNumber(quotient.toString());
  }
  
  return formatNumber(`${quotient}.${trimmed}`);
}

/**
 * Shorten an Ethereum address for display
 */
export function shortenAddress(address: Address): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format USD amount with proper decimals
 */
export function formatUSD(amount: number): string {
  if (amount < 0.01) {
    return `$${amount.toFixed(8)}`;
  }
  if (amount < 1) {
    return `$${amount.toFixed(5)}`;
  }
  return `$${formatNumber(amount.toFixed(2))}`;
}

/**
 * Format percentage with proper decimals
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Format a timestamp as a relative time string
 */
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
}

/**
 * Format a date as YYYY-MM-DD
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().split('T')[0];
}