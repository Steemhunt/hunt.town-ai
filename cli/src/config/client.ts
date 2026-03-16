/**
 * Viem client configuration for Base chain
 *
 * Uses viem's fallback transport with multiple public RPCs for reliability.
 * Custom RPC can be set via RPC_URL environment variable (takes priority).
 */
import { createPublicClient, createWalletClient, http, fallback } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

/** Public Base RPC endpoints for fallback transport */
const BASE_RPC_ENDPOINTS = [
  'https://base-rpc.publicnode.com',
  'https://mainnet.base.org',
  'https://developer-access-mainnet.base.org',
  'https://base-mainnet.public.blastapi.io',
  'https://base-public.nodies.app',
  'https://base.meowrpc.com',
  'https://1rpc.io/base',
  'https://base.llamarpc.com',
] as const;

/**
 * Endpoints that support getLogs with up to 10k block ranges.
 * Ordered by preference. No rank:true to avoid quota-burning benchmarks.
 */
const LOGS_RPC_ENDPOINTS = [
  'https://base.drpc.org',
  'https://base.llamarpc.com',
  'https://base-rpc.publicnode.com',
] as const;

/** Build the transport — custom RPC or fallback across public endpoints */
function getTransport() {
  const customRpc = process.env.RPC_URL;
  if (customRpc) return http(customRpc);
  return fallback(BASE_RPC_ENDPOINTS.map((url) => http(url)), { rank: true });
}

/** Build a sequential-fallback transport for getLogs calls (no rank benchmarking) */
function getLogsTransport() {
  const customRpc = process.env.RPC_URL;
  if (customRpc) return http(customRpc);
  return fallback(LOGS_RPC_ENDPOINTS.map((url) => http(url)), { rank: false });
}

/** Shared public client for read-only contract calls */
export const publicClient = createPublicClient({
  chain: base,
  transport: getTransport(),
});

/** Dedicated client for getLogs — uses sequential fallback, no quota-burning rank benchmarks */
export const logsClient = createPublicClient({
  chain: base,
  transport: getLogsTransport(),
});

/** Create a wallet client for write operations */
export function createWalletClientForBase(privateKey: string) {
  const account = privateKeyToAccount(
    (privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`) as `0x${string}`
  );
  return createWalletClient({
    chain: base,
    transport: getTransport(),
    account,
  });
}
