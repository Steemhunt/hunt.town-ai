/**
 * Wallet and private key utilities
 */
import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { config } from 'dotenv';
import { privateKeyToAccount } from 'viem/accounts';
import type { Address } from 'viem';

/**
 * Load environment variables from multiple sources
 */
export function loadEnvConfig(): void {
  // Load from local .env first
  config({ quiet: true });
  
  // Load from ~/.hunttown/.env if it exists
  const huntTownConfigPath = join(homedir(), '.hunttown', '.env');
  if (existsSync(huntTownConfigPath)) {
    config({ path: huntTownConfigPath, quiet: true });
  }
}

/**
 * Get private key from environment
 */
export function getPrivateKey(): string | null {
  loadEnvConfig();
  const key = process.env.PRIVATE_KEY;
  return key || null;
}

/**
 * Require private key or throw error with helpful message
 */
export function requireKey(): string {
  const key = getPrivateKey();
  if (!key) {
    throw new Error(
      'Private key required for this operation.\n' +
      'Set PRIVATE_KEY in ~/.hunttown/.env or local .env file.\n' +
      'Example: PRIVATE_KEY=your_wallet_private_key_here'
    );
  }
  return key;
}

/**
 * Get wallet address from private key
 */
export function getWalletAddress(privateKey?: string): Address | null {
  try {
    const key = privateKey || getPrivateKey();
    if (!key) return null;
    
    const account = privateKeyToAccount(`0x${key.replace(/^0x/, '')}`);
    return account.address;
  } catch (error) {
    console.error('Invalid private key:', error);
    return null;
  }
}

/**
 * Validate private key format
 */
export function isValidPrivateKey(key: string): boolean {
  try {
    const cleanKey = key.replace(/^0x/, '');
    if (cleanKey.length !== 64) return false;
    
    // Try to create account to validate
    privateKeyToAccount(`0x${cleanKey}`);
    return true;
  } catch {
    return false;
  }
}