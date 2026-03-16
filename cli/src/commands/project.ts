/**
 * Show detailed information for a single Hunt Town project
 */
import type { Address } from 'viem';
import { formatEther, parseAbiItem } from 'viem';
import { publicClient, logsClient } from '../config/client.js';
import { CONTRACTS } from '../config/contracts.js';
import { BOND_ABI } from '../abi/bond.js';
import { ERC20_ABI } from '../abi/erc20.js';
import { MINTPAD_ABI } from '../abi/mintpad.js';
import { PROJECT_UPDATES_ABI } from '../abi/project-updates.js';
import { fetchAllProjects, fetchTokenMetadata } from '../utils/api.js';
import { formatNumber, shortenAddress, formatPercentage, formatDate } from '../utils/format.js';
import { getHuntPrice, formatHuntWithUSD } from '../utils/price.js';

const VOTED_EVENT = parseAbiItem(
  'event Voted(uint256 indexed day, address indexed user, address indexed token, uint32 voteAmount)'
);

const BLOCKS_PER_DAY = 43_200n;
const MAX_BLOCK_RANGE = 10_000n;
const MAX_PARALLEL = 5;

/**
 * Fetch logs in chunks (parallel) to avoid public RPC range limits
 */
async function fetchLogsChunked(fromBlock: bigint, toBlock: bigint, tokenAddress?: Address) {
  const chunks: Array<{ from: bigint; to: bigint }> = [];
  let cursor = fromBlock;
  while (cursor <= toBlock) {
    const end = cursor + MAX_BLOCK_RANGE - 1n > toBlock ? toBlock : cursor + MAX_BLOCK_RANGE - 1n;
    chunks.push({ from: cursor, to: end });
    cursor = end + 1n;
  }

  const allLogs: any[] = [];
  for (let i = 0; i < chunks.length; i += MAX_PARALLEL) {
    const batch = chunks.slice(i, i + MAX_PARALLEL);
    const results = await Promise.all(
      batch.map((c) =>
        logsClient.getLogs({
          address: CONTRACTS.MINTPAD,
          event: VOTED_EVENT,
          ...(tokenAddress ? { args: { token: tokenAddress } } : {}),
          fromBlock: c.from,
          toBlock: c.to,
        })
      )
    );
    for (const logs of results) allLogs.push(...logs);
  }

  return allLogs;
}

/** Mintpad API 30-day backer stats for a token */
async function fetchApiVoteStats(tokenAddress: string): Promise<{
  totalVotingAmount: number;
  uniqueBackers: number;
}> {
  try {
    const url = `https://hunt.town/api/votes/backers?tokenAddress=${tokenAddress}&limit=0`;
    const res = await fetch(url);
    if (!res.ok) return { totalVotingAmount: 0, uniqueBackers: 0 };
    const data = await res.json() as { totalVotingAmount: number; count: number };
    return { totalVotingAmount: data.totalVotingAmount ?? 0, uniqueBackers: data.count ?? 0 };
  } catch {
    return { totalVotingAmount: 0, uniqueBackers: 0 };
  }
}

/**
 * Fetch voting stats for a specific token.
 * - Today: on-chain events (fast ~6 chunks)
 * - 30-day: mintpad API (instant)
 * Returns today logs for all tokens so caller can compute rank without a second scan.
 */
async function fetchVotingStats(tokenAddress: Address): Promise<{
  todayVotes: number;
  todayBackers: number;
  monthVotes: number;
  monthBackers: number;
  todayRankLogs: Map<string, number>; // token -> today vote total (for rank calc)
}> {
  const [currentDay, currentBlock] = await Promise.all([
    publicClient.readContract({
      address: CONTRACTS.MINTPAD,
      abi: MINTPAD_ABI,
      functionName: 'getCurrentDay',
    }) as Promise<bigint>,
    publicClient.getBlockNumber(),
  ]);

  // On-chain: only today's range (~27h = ~6 chunks, fast)
  const fromBlock = currentBlock - BLOCKS_PER_DAY - (BLOCKS_PER_DAY / 8n);

  // Fetch today logs for ALL tokens (for rank) + 30-day API stats in parallel
  const [allTodayLogs, apiStats] = await Promise.all([
    fetchLogsChunked(fromBlock > 0n ? fromBlock : 0n, currentBlock),
    fetchApiVoteStats(tokenAddress),
  ]);

  let todayVotes = 0;
  const todayVoters = new Set<string>();
  const todayRankLogs = new Map<string, number>();

  for (const log of allTodayLogs) {
    if ((log.args.day as bigint) !== currentDay) continue;
    const token = (log.args.token as string).toLowerCase();
    const voter = (log.args.user as string).toLowerCase();
    const amount = Number(log.args.voteAmount);

    todayRankLogs.set(token, (todayRankLogs.get(token) ?? 0) + amount);

    if (token === tokenAddress.toLowerCase()) {
      todayVotes += amount;
      todayVoters.add(voter);
    }
  }

  return {
    todayVotes,
    todayBackers: todayVoters.size,
    monthVotes: apiStats.totalVotingAmount,
    monthBackers: apiStats.uniqueBackers,
    todayRankLogs,
  };
}

/**
 * Execute `ht project <symbol>` command
 */
export async function projectCommand(
  symbol: string,
  options: { votes?: boolean } = {}
): Promise<void> {
  const projects = await fetchAllProjects();
  const project = projects.find(p => p.symbol.toLowerCase() === symbol.toLowerCase());

  if (!project) {
    console.error(`❌ Project "${symbol}" not found.`);
    console.error('Run `ht projects` to see all available projects.');
    process.exit(1);
  }

  const tokenAddress = project.tokenAddress as Address;

  const [bondInfo, totalSupply, maxSupply, metadata, updateCount, recentUpdates, huntPrice] =
    await Promise.all([
      publicClient.readContract({
        address: CONTRACTS.MCV2_BOND,
        abi: BOND_ABI,
        functionName: 'tokenBond',
        args: [tokenAddress],
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'totalSupply',
      }),
      publicClient.readContract({
        address: CONTRACTS.MCV2_BOND,
        abi: BOND_ABI,
        functionName: 'maxSupply',
        args: [tokenAddress],
      }),
      fetchTokenMetadata(project.tokenAddress),
      publicClient.readContract({
        address: CONTRACTS.PROJECT_UPDATES,
        abi: PROJECT_UPDATES_ABI,
        functionName: 'getTokenProjectUpdatesCount',
        args: [tokenAddress],
      }).catch(() => 0n),
      publicClient.readContract({
        address: CONTRACTS.PROJECT_UPDATES,
        abi: PROJECT_UPDATES_ABI,
        functionName: 'getLatestProjectUpdates',
        args: [tokenAddress, 0n, 5n],
      }).catch(() => []),
      getHuntPrice(),
    ]);

  const [creator, mintRoyalty, burnRoyalty, createdAt] = bondInfo as readonly [string, number, number, number, string, bigint];

  console.log(`${project.symbol} — Hunt Town Co-op`);
  console.log('========================\n');

  console.log(`Token Address:  ${project.tokenAddress}`);
  console.log(`Creator:        ${shortenAddress(creator as Address)}`);
  console.log(`Reserve:        ${formatHuntWithUSD(project.reserveBalance, huntPrice)}`);

  const priceUSD = project.priceForNextMint * huntPrice;
  console.log(`Price:          ${project.priceForNextMint.toFixed(8)} HUNT ($${priceUSD.toFixed(8)})`);

  if ((maxSupply as bigint) > 0n) {
    const maxF = Number(formatEther(maxSupply as bigint));
    const supplyF = Number(formatEther(totalSupply as bigint));
    const pct = maxF > 0 ? (supplyF / maxF) * 100 : 0;
    console.log(`Max Supply:     ${formatNumber(maxF.toFixed(0))}`);
    console.log(`Circulating:    ${formatNumber(supplyF.toFixed(0))} (${formatPercentage(pct)})`);
  }

  console.log(`Mint Royalty:   ${formatPercentage(Number(mintRoyalty) / 100)}`);
  console.log(`Burn Royalty:   ${formatPercentage(Number(burnRoyalty) / 100)}`);
  console.log(`Created:        ${formatDate(Number(createdAt))}`);

  if (metadata?.website) console.log(`Website:        ${metadata.website}`);
  if (metadata?.creatorComment) console.log(`Description:    ${metadata.creatorComment}`);

  console.log(`Updates:        ${Number(updateCount)} total`);

  if ((recentUpdates as any[]).length > 0) {
    console.log('\nRecent Updates:');
    (recentUpdates as any[]).forEach((u: { link: string }, i: number) => {
      console.log(`  ${i + 1}. ${u.link}`);
    });
  }

  // Voting stats (optional)
  if (options.votes) {
    console.log('\nVoting Stats:');
    console.log('─'.repeat(40));

    const stats = await fetchVotingStats(tokenAddress);

    console.log(`  Today:    ${formatNumber(stats.todayVotes)} votes from ${formatNumber(stats.todayBackers)} backers`);
    console.log(`  30 Days:  ${formatNumber(stats.monthVotes)} votes from ${formatNumber(stats.monthBackers)} backers (API)`);

    // Rank from the pre-fetched today logs (no extra RPC call)
    if (stats.todayVotes > 0) {
      const sorted = [...stats.todayRankLogs.entries()].sort((a, b) => b[1] - a[1]);
      const rank = sorted.findIndex(([addr]) => addr === tokenAddress.toLowerCase()) + 1;
      if (rank > 0) {
        console.log(`  Today Rank: #${rank} of ${sorted.length} voted projects`);
      }
    }
  }
}
