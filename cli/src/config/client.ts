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
  'https://base.drpc.org',
  'https://base.llamarpc.com',
] as const;

/** Build the transport — custom RPC or fallback across public endpoints */
function getTransport() {
  const customRpc = process.env.RPC_URL;
  if (customRpc) return http(customRpc);

  return fallback(
    BASE_RPC_ENDPOINTS.map((url) => http(url)),
    { rank: true }
  );
}

/** Shared public client for read-only operations */
export const publicClient = createPublicClient({
  chain: base,
  transport: getTransport(),
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
