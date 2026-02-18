/**
 * Hunt Town smart contract addresses and configuration
 */
import type { Address } from 'viem';

/**
 * Smart contract addresses on Base
 */
export const CONTRACTS = {
  // Hunt Town contracts
  MCV2_BOND: '0xc5a076cad94176c2996B32d8466Be1cE757FAa27' as Address,
  MINTPAD: '0xfb51D2120c27bB56D91221042cb2dd2866a647fE' as Address,
  PROJECT_UPDATES: '0xdD066121E4488edB73c4Ff7f461592c084e4303A' as Address,
  ZAP_UNIV4_MCV2: '0xa2e7BcA51A84Ed635909a8E845d5f66602742A75' as Address,
  
  // Tokens
  HUNT: '0x37f0c2915CeCC7e977183B8543Fc0864d03E064C' as Address,
  USDC: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' as Address,
  
  // Price oracles
  SPOT_PRICE_AGGREGATOR: '0x00000000000D6FFc74A8feb35aF5827bf57f6786' as Address,
} as const;

/**
 * Chain ID for Base
 */
export const CHAIN_ID = 8453;

/**
 * Known token symbol mapping for better UX
 */
export const TOKEN_SYMBOLS: Record<string, string> = {
  [CONTRACTS.HUNT.toLowerCase()]: 'HUNT',
  [CONTRACTS.USDC.toLowerCase()]: 'USDC',
};

/**
 * Mint Club API endpoints
 */
export const API_ENDPOINTS = {
  TOKENS_CHILDREN: 'https://mint.club/api/tokens/children',
  RESERVE_STATS: 'https://mint.club/api/reserve-tokens/stats',
  METADATA: 'https://mint.club/api/metadata',
} as const;