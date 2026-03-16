/**
 * Top voted Co-op projects — aggregated from on-chain Voted events
 */
import { parseAbiItem } from "viem";
import { publicClient } from "../config/client.js";
import { CONTRACTS } from "../config/contracts.js";
import { MINTPAD_ABI } from "../abi/mintpad.js";
import { fetchAllProjects, type TokenData } from "../utils/api.js";
import { formatNumber, shortenAddress } from "../utils/format.js";
import { getHuntPrice, huntToUSD } from "../utils/price.js";
import type { Address } from "viem";

const VOTED_EVENT = parseAbiItem(
  "event Voted(uint256 indexed day, address indexed user, address indexed token, uint32 voteAmount)",
);

/** Blocks per period (Base ~2s block time) */
const BLOCKS_PER_DAY = 43_200n;
const BLOCKS_PER_WEEK = BLOCKS_PER_DAY * 7n;
const BLOCKS_PER_MONTH = BLOCKS_PER_DAY * 30n;

/** Max block range per getLogs call (public RPC safe limit) */
const MAX_BLOCK_RANGE = 10_000n;
/** Max parallel chunk requests */
const MAX_PARALLEL = 10;

type Period = "today" | "week" | "month";

interface VoteAgg {
  tokenAddress: string;
  totalVotes: number;
  uniqueVoters: Set<string>;
}

type OnLogsBatch = (logs: any[], chunkIndex: number, totalChunks: number) => void;

/**
 * Fetch logs in chunks (parallel) to avoid public RPC range limits.
 * When `onBatch` is provided, streams each batch of logs as they arrive.
 */
async function fetchLogsChunked(
  fromBlock: bigint,
  toBlock: bigint,
  onBatch?: OnLogsBatch,
) {
  const chunks: Array<{ from: bigint; to: bigint }> = [];
  let cursor = fromBlock;
  while (cursor <= toBlock) {
    const end =
      cursor + MAX_BLOCK_RANGE - 1n > toBlock
        ? toBlock
        : cursor + MAX_BLOCK_RANGE - 1n;
    chunks.push({ from: cursor, to: end });
    cursor = end + 1n;
  }

  const allLogs: any[] = [];
  let completedChunks = 0;

  for (let i = 0; i < chunks.length; i += MAX_PARALLEL) {
    const batch = chunks.slice(i, i + MAX_PARALLEL);
    const results = await Promise.all(
      batch.map((c) =>
        publicClient.getLogs({
          address: CONTRACTS.MINTPAD,
          event: VOTED_EVENT,
          fromBlock: c.from,
          toBlock: c.to,
        }),
      ),
    );
    for (const logs of results) {
      allLogs.push(...logs);
      completedChunks++;
      if (onBatch && logs.length > 0) {
        onBatch(logs, completedChunks, chunks.length);
      }
    }
  }

  return allLogs;
}

/**
 * Aggregate logs into vote data by token
 */
function aggregateLogs(logs: any[], filterDay?: bigint): Map<string, VoteAgg> {
  const agg = new Map<string, VoteAgg>();

  for (const log of logs) {
    if (filterDay !== undefined && (log.args.day as bigint) !== filterDay)
      continue;

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
 * Build a function that prints each vote log line in real-time
 */
function makeVerboseLogger(
  symbolMap: Map<string, string>,
): OnLogsBatch {
  let count = 0;
  return (logs, chunkIdx, totalChunks) => {
    for (const log of logs) {
      count++;
      const day = Number(log.args.day as bigint);
      const voter = log.args.user as string;
      const tokenAddr = (log.args.token as string).toLowerCase();
      const sym = symbolMap.get(tokenAddr) ?? shortenAddress(tokenAddr as Address);
      const amount = Number(log.args.voteAmount);
      const block = log.blockNumber != null ? Number(log.blockNumber) : "?";
      const txShort = log.transactionHash
        ? (log.transactionHash as string).slice(0, 10)
        : "";
      const dim = "\x1b[2m";
      const reset = "\x1b[0m";
      const cyan = "\x1b[36m";
      const yellow = "\x1b[33m";
      const green = "\x1b[32m";
      console.log(
        `${dim}${String(count).padStart(5)}${reset}  ` +
          `${dim}block ${block}${reset}  ` +
          `${cyan}${voter}${reset} → ${yellow}${sym.padEnd(10)}${reset} ` +
          `${green}+${amount}${reset} votes  ` +
          `${dim}day=${day}${reset}` +
          (txShort ? `  ${dim}tx:${txShort}…${reset}` : ""),
      );
    }
    process.stdout.write(
      `\x1b[2m  [${chunkIdx}/${totalChunks} chunks scanned]\x1b[0m\r`,
    );
  };
}

async function fetchVotedEvents(
  fromBlock: bigint,
  toBlock: bigint,
  onBatch?: OnLogsBatch,
): Promise<Map<string, VoteAgg>> {
  const logs = await fetchLogsChunked(
    fromBlock > 0n ? fromBlock : 0n,
    toBlock,
    onBatch,
  );
  return aggregateLogs(logs);
}

async function fetchTodayVotedEvents(
  onBatch?: OnLogsBatch,
): Promise<Map<string, VoteAgg>> {
  const [currentDay, currentBlock] = await Promise.all([
    publicClient.readContract({
      address: CONTRACTS.MINTPAD,
      abi: MINTPAD_ABI,
      functionName: "getCurrentDay",
    }) as Promise<bigint>,
    publicClient.getBlockNumber(),
  ]);

  const fromBlock = currentBlock - BLOCKS_PER_DAY - BLOCKS_PER_DAY / 8n;

  const logs = await fetchLogsChunked(
    fromBlock > 0n ? fromBlock : 0n,
    currentBlock,
    onBatch,
  );
  return aggregateLogs(logs, currentDay);
}

/**
 * Execute `ht top-voted` command
 */
export async function topVotedCommand(options: {
  period?: string;
  limit?: string;
  verbose?: boolean;
}): Promise<void> {
  const period = (options.period || "today") as Period;
  const limit = parseInt(options.limit || "20", 10);
  const verbose = options.verbose ?? false;

  if (!["today", "week", "month"].includes(period)) {
    console.error("Invalid period. Use: today, week, or month");
    process.exit(1);
  }

  const periodLabel =
    period === "today"
      ? "Today's"
      : period === "week"
        ? "This Week's"
        : "This Month's";

  // When verbose, fetch projects first so we can resolve symbols in the log stream
  let projects: TokenData[];
  let symbolMap: Map<string, string>;

  if (verbose) {
    projects = await fetchAllProjects();
    symbolMap = new Map(
      projects.map((p) => [p.tokenAddress.toLowerCase(), p.symbol]),
    );

    console.log(`${periodLabel} Voting Logs (verbose)`);
    console.log("=".repeat(50));
    console.log(
      "  \x1b[2m  idx  block          voter        → token        votes  day    tx\x1b[0m",
    );
    console.log("");
  } else {
    projects = [];
    symbolMap = new Map();

    console.log(`${periodLabel} Top Voted Projects`);
    console.log("=".repeat(40) + "\n");
  }

  const onBatch = verbose ? makeVerboseLogger(symbolMap) : undefined;
  let aggPromise: Promise<Map<string, VoteAgg>>;

  if (period === "today") {
    aggPromise = fetchTodayVotedEvents(onBatch);
  } else {
    aggPromise = publicClient.getBlockNumber().then((currentBlock) => {
      const blocksBack = period === "week" ? BLOCKS_PER_WEEK : BLOCKS_PER_MONTH;
      const fromBlock = currentBlock - blocksBack;
      return fetchVotedEvents(
        fromBlock > 0n ? fromBlock : 0n,
        currentBlock,
        onBatch,
      );
    });
  }

  const fetchDeps = verbose
    ? Promise.all([getHuntPrice()]).then(([hp]) => ({
        projects,
        huntPrice: hp,
      }))
    : Promise.all([fetchAllProjects(), getHuntPrice()]).then(([p, hp]) => ({
        projects: p,
        huntPrice: hp,
      }));

  const [agg, deps] = await Promise.all([aggPromise, fetchDeps]);
  projects = deps.projects;
  const huntPrice = deps.huntPrice;

  if (verbose) {
    process.stdout.write("\x1b[2K");
    console.log("\n" + "=".repeat(50));
    console.log("Aggregated Summary\n");
  }

  if (agg.size === 0) {
    console.log("No votes recorded for this period.");
    return;
  }

  // Build project lookup by lowercase address
  const projectMap = new Map(
    projects.map((p) => [p.tokenAddress.toLowerCase(), p]),
  );

  // Sort by total votes descending
  const sorted = [...agg.values()].sort((a, b) => b.totalVotes - a.totalVotes);
  const top = sorted.slice(0, limit);

  const totalVotes = sorted.reduce((sum, e) => sum + e.totalVotes, 0);
  const totalVoters = new Set(sorted.flatMap((e) => [...e.uniqueVoters])).size;

  console.log(
    " #  Symbol          Votes   Backers   Reserve (HUNT)         USD",
  );
  console.log(
    "--- ----------   --------   -------   ----------------   -----------",
  );

  top.forEach((entry, i) => {
    const project = projectMap.get(entry.tokenAddress);
    const num = String(i + 1).padStart(2);
    const sym = (project?.symbol || "???").padEnd(10);
    const votes = formatNumber(entry.totalVotes).padStart(8);
    const backers = formatNumber(entry.uniqueVoters.size).padStart(7);
    const reserve = project
      ? formatNumber(project.reserveBalance.toFixed(0)).padStart(16)
      : "".padStart(16, "-");
    const usd = project
      ? huntToUSD(project.reserveBalance, huntPrice).padStart(11)
      : "".padStart(11, "-");

    console.log(`${num}  ${sym}   ${votes}   ${backers}   ${reserve}   ${usd}`);
  });

  console.log("");
  console.log(
    `Period: ${periodLabel.replace("'s", "")} | Total votes: ${formatNumber(totalVotes)} | Unique backers: ${formatNumber(totalVoters)}`,
  );
  console.log(
    `Showing ${Math.min(top.length, limit)} of ${sorted.length} voted projects`,
  );
}
