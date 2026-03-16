/**
 * Mint Club API helpers for Hunt Town Co-op data
 */
import { API_ENDPOINTS, CHAIN_ID, CONTRACTS } from '../config/contracts.js';

/** Project token data from Mint Club API */
export interface TokenData {
  id: number;
  tokenAddress: string;
  symbol: string;
  name: string;
  logo: string | null;
  reserveBalance: number;       // HUNT amount (not wei)
  tokenType: string;
  priceForNextMint: number;     // Price in HUNT per token
  deployer: string | null;
  deployerFcUsername: string | null;
}

interface TokenListResponse {
  count: number;
  tokens: TokenData[];
}

/** Token metadata from Mint Club API */
export interface TokenMetadata {
  logo: string | null;
  backgroundImage: string | null;
  externalDexUrl: string | null;
  website: string | null;
  distributionPlan: string | null;
  creatorComment: string | null;
  onChatSlug: string | null;
}

/** Reserve stats response shape */
interface ReserveStatsResponse {
  tokens: Array<{
    _count: number;
    _sum: { reserveBalance: number };
    reserveToken: {
      id: number;
      chainId: number;
      name: string;
      decimals: number;
      symbol: string;
      tokenAddress: string;
      logo: string | null;
    };
  }>;
  total: number;
}

const ITEMS_PER_PAGE = 21;

/**
 * Fetch projects from Mint Club API with pagination
 */
async function fetchTokenPage(page: number = 1): Promise<TokenListResponse> {
  const params = new URLSearchParams({
    chainId: CHAIN_ID.toString(),
    reserveToken: CONTRACTS.HUNT,
    tokenType: 'ERC20',
    page: page.toString(),
  });

  const response = await fetch(`${API_ENDPOINTS.TOKENS_CHILDREN}?${params}`);
  if (!response.ok) throw new Error(`Mint Club API error: ${response.status}`);
  return response.json() as Promise<TokenListResponse>;
}

/**
 * Fetch all Hunt Town Co-op projects (handles pagination)
 */
export async function fetchAllProjects(): Promise<TokenData[]> {
  const first = await fetchTokenPage(1);
  if (first.tokens.length >= first.count || first.tokens.length < ITEMS_PER_PAGE) {
    return first.tokens;
  }

  const totalPages = Math.ceil(first.count / ITEMS_PER_PAGE);
  const remaining = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) => fetchTokenPage(i + 2)),
  );

  return [first.tokens, ...remaining.map((r) => r.tokens)].flat();
}

/**
 * Fetch first page of projects (sorted by reserve balance desc by default)
 */
export async function fetchProjects(page: number = 1): Promise<{ tokens: TokenData[]; count: number }> {
  return fetchTokenPage(page);
}

/**
 * Fetch Co-op reserve token stats (total HUNT locked, project count)
 */
export async function fetchReserveStats(): Promise<{ totalHuntLocked: number; projectCount: number }> {
  const params = new URLSearchParams({
    chainId: CHAIN_ID.toString(),
    reserveToken: CONTRACTS.HUNT,
    tokenType: 'ERC20',
  });

  const response = await fetch(`${API_ENDPOINTS.RESERVE_STATS}?${params}`);
  if (!response.ok) throw new Error(`Mint Club API error: ${response.status}`);

  const data = await response.json() as ReserveStatsResponse;
  const entry = data.tokens[0];

  return {
    totalHuntLocked: entry?._sum.reserveBalance ?? 0,
    projectCount: entry?._count ?? 0,
  };
}

/**
 * Fetch token metadata (website, logo, description, etc.)
 */
export async function fetchTokenMetadata(tokenAddress: string): Promise<TokenMetadata | null> {
  try {
    const params = new URLSearchParams({
      chainId: CHAIN_ID.toString(),
      tokenAddress,
    });

    const response = await fetch(`${API_ENDPOINTS.METADATA}?${params}`);
    if (!response.ok) return null;
    return response.json() as Promise<TokenMetadata>;
  } catch {
    return null;
  }
}

/**
 * Find a project by symbol (case-insensitive)
 */
export async function findProjectBySymbol(symbol: string): Promise<TokenData | null> {
  const { tokens } = await fetchAllProjects().then(tokens => ({ tokens }));
  return tokens.find(t => t.symbol.toLowerCase() === symbol.toLowerCase()) || null;
}
