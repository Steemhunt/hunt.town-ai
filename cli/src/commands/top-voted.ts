/**
 * Top voted Co-op projects — aggregated from on-chain Voted events
 */
import { parseAbiItem } from 'viem';
import { publicClient, logsClient } from '../config/client.js';
import { CONTRACTS } from '../config/contracts.js';
import { MINTPAD_ABI } from '../abi/mintpad.js';
import { fetchAllProjects } from '../utils/api.js';
import { formatNumber } from '../utils/format.js';
import { getHuntPrice, huntToUSD } from '../utils/price.js';

const VOTED_EVENT = parseAbiItem(
  'event Voted(uint256 indexed day, address indexed user, address indexed token, uint32 voteAmount)'
);

/** Blocks per period (Base ~2s block time) */
const BLOCKS_PER_DAY = 43_200n;
const BLOCKS_PER_WEEK = BLOCKS_PER_DAY * 7n;
const BLOCKS_PER_MONTH = BLOCKS_PER_DAY * 30n;

/** Max block range per getLogs call (public RPC safe limit) */
const MAX_BLOCK_RANGE = 10_000n;
/** Max parallel chunk requests */
const MAX_PARALLEL = 5;

type Period = 'today' | 'week' | 'month';

interface VoteAgg {
  tokenAddress: string;
  totalVotes: number;
  uniqueVoters: Set<string>;
}

/**
 * Fetch logs in chunks (parallel) to avoid public RPC range limits
 */
async function fetchLogsChunked(fromBlock: bigint, toBlock: bigint) {
  // Build chunk ranges
  const chunks: Array<{ from: bigint; to: bigint }> = [];
  let cursor = fromBlock;
  while (cursor <= toBlock) {
    const end = cursor + MAX_BLOCK_RANGE - 1n > toBlock ? toBlock : cursor + MAX_BLOCK_RANGE - 1n;
    chunks.push({ from: cursor, to: end });
    cursor = end + 1n;
  }

  // Execute in parallel batches
  const allLogs: any[] = [];
  for (let i = 0; i < chunks.length; i += MAX_PARALLEL) {
    const batch = chunks.slice(i, i + MAX_PARALLEL);
    const results = await Promise.all(
      batch.map((c) =>
        logsClient.getLogs({
          address: CONTRACTS.MINTPAD,
          event: VOTED_EVENT,
          fromBlock: c.from,
          toBlock: c.to,
        })
      )
    );
    for (const logs of results) allLogs.push(...logs);
  }

  return allLogs;
}

/**
 * Aggregate logs into vote data by token
 */
function aggregateLogs(
  logs: any[],
  filterDay?: bigint
): Map<string, VoteAgg> {
  const agg = new Map<string, VoteAgg>();

  for (const log of logs) {
    if (filterDay !== undefined && (log.args.day as bigint) !== filterDay) continue;

    const token = (log.args.token as string).toLowerCase();
    const voter = log.args.user as string;
    const amount = Number(log.args.voteAmount);

    let entry = agg.get(token);
    if (!entry) {
      entry = { tokenAddress: token, totalVotes: 0, uniqueVoters: new Set() };
      agg.set(token, entry);
    }
    entry.totalVotes += amount;
    entry.uniqueVoters.add(voter.toLowerCase());
  }

  return agg;
}

/**
 * Fetch Voted events for a block range and aggregate by token
 */
async function fetchVotedEvents(fromBlock: bigint): Promise<Map<string, VoteAgg>> {
  const toBlock = await publicClient.getBlockNumber();
  const logs = await fetchLogsChunked(fromBlock > 0n ? fromBlock : 0n, toBlock);
  return aggregateLogs(logs);
}

/**
 * For "today" period: use the contract's day number to filter events
 */
async function fetchTodayVotedEvents(): Promise<Map<string, VoteAgg>> {
  const currentDay = await publicClient.readContract({
    address: CONTRACTS.MINTPAD,
    abi: MINTPAD_ABI,
    functionName: 'getCurrentDay',
  }) as bigint;

  const currentBlock = await publicClient.getBlockNumber();
  // ~27h back — enough to ensure we cover the full current day regardless of when it started
  const fromBlock = currentBlock - BLOCKS_PER_DAY - (BLOCKS_PER_DAY / 8n);

  const logs = await fetchLogsChunked(fromBlock > 0n ? fromBlock : 0n, currentBlock);
  return aggregateLogs(logs, currentDay);
}

/**
 * Execute `ht top-voted` command
 */
export async function topVotedCommand(options: {
  period?: string;
  limit?: string;
}): Promise<void> {
  const period = (options.period || 'today') as Period;
  const limit = parseInt(options.limit || '20', 10);

  if (!['today', 'week', 'month'].includes(period)) {
    console.error('Invalid period. Use: today, week, or month');
    process.exit(1);
  }

  const periodLabel =
    period === 'today' ? "Today's" : period === 'week' ? 'This Week\'s' : 'This Month\'s';

  console.log(`${periodLabel} Top Voted Projects`);
  console.log('='.repeat(40) + '\n');

  // Fetch vote data and project list in parallel
  let aggPromise: Promise<Map<string, VoteAgg>>;

  if (period === 'today') {
    aggPromise = fetchTodayVotedEvents();
  } else {
    const currentBlock = await publicClient.getBlockNumber();
    const blocksBack = period === 'week' ? BLOCKS_PER_WEEK : BLOCKS_PER_MONTH;
    const fromBlock = currentBlock - blocksBack;
    aggPromise = fetchVotedEvents(fromBlock > 0n ? fromBlock : 0n);
  }

  const [agg, projects, huntPrice] = await Promise.all([
    aggPromise,
    fetchAllProjects(),
    getHuntPrice(),
  ]);

  if (agg.size === 0) {
    console.log('No votes recorded for this period.');
    return;
  }

  // Build project lookup by lowercase address
  const projectMap = new Map(
    projects.map((p) => [p.tokenAddress.toLowerCase(), p])
  );

  // Sort by total votes descending
  const sorted = [...agg.values()].sort((a, b) => b.totalVotes - a.totalVotes);
  const top = sorted.slice(0, limit);

  const totalVotes = sorted.reduce((sum, e) => sum + e.totalVotes, 0);
  const totalVoters = new Set(sorted.flatMap((e) => [...e.uniqueVoters])).size;

  console.log(
    ' #  Symbol          Votes   Backers   Reserve (HUNT)         USD'
  );
  console.log(
    '--- ----------   --------   -------   ----------------   -----------'
  );

  top.forEach((entry, i) => {
    const project = projectMap.get(entry.tokenAddress);
    const num = String(i + 1).padStart(2);
    const sym = (project?.symbol || '???').padEnd(10);
    const votes = formatNumber(entry.totalVotes).padStart(8);
    const backers = formatNumber(entry.uniqueVoters.size).padStart(7);
    const reserve = project
      ? formatNumber(project.reserveBalance.toFixed(0)).padStart(16)
      : ''.padStart(16, '-');
    const usd = project
      ? huntToUSD(project.reserveBalance, huntPrice).padStart(11)
      : ''.padStart(11, '-');

    console.log(`${num}  ${sym}   ${votes}   ${backers}   ${reserve}   ${usd}`);
  });

  console.log('');
  console.log(
    `Period: ${periodLabel.replace("'s", '')} | Total votes: ${formatNumber(totalVotes)} | Unique backers: ${formatNumber(totalVoters)}`
  );
  console.log(`Showing ${Math.min(top.length, limit)} of ${sorted.length} voted projects`);
}
