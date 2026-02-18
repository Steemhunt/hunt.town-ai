/**
 * Hunt Town Co-op overview statistics
 */
import { publicClient } from '../config/client.js';
import { CONTRACTS } from '../config/contracts.js';
import { MINTPAD_ABI } from '../abi/mintpad.js';
import { fetchReserveStats } from '../utils/api.js';
import { formatNumber, formatTokenAmount } from '../utils/format.js';
import { getHuntPrice, huntToUSD } from '../utils/price.js';

/**
 * Execute `ht stats` command
 */
export async function statsCommand(): Promise<void> {
  const [huntPrice, reserveStats, currentDay, dailyReward] = await Promise.all([
    getHuntPrice(),
    fetchReserveStats(),
    publicClient.readContract({
      address: CONTRACTS.MINTPAD,
      abi: MINTPAD_ABI,
      functionName: 'getCurrentDay',
    }).catch(() => 0n),
    publicClient.readContract({
      address: CONTRACTS.MINTPAD,
      abi: MINTPAD_ABI,
      functionName: 'dailyHuntReward',
    }).catch(() => 0n),
  ]);

  const day = Number(currentDay);

  // Get today's stats
  const todayStats = day > 0
    ? await publicClient.readContract({
        address: CONTRACTS.MINTPAD,
        abi: MINTPAD_ABI,
        functionName: 'dailyStats',
        args: [currentDay as bigint],
      }).catch(() => null)
    : null;

  console.log('Hunt Town Co-op Stats');
  console.log('=====================\n');

  console.log(`HUNT Price:         $${huntPrice.toFixed(6)}`);
  console.log(`Total Projects:     ${formatNumber(reserveStats.projectCount)}`);
  console.log(`HUNT in Co-op:      ${formatNumber(reserveStats.totalHuntLocked.toFixed(0))} (${huntToUSD(reserveStats.totalHuntLocked, huntPrice)})`);

  if (dailyReward > 0n) {
    console.log(`Daily Reward Pool:  ${formatTokenAmount(dailyReward as bigint, 18, 0)} HUNT`);
  }

  if (day > 0) {
    console.log(`Current Day:        ${formatNumber(day)}`);
  }

  if (todayStats) {
    const [vpGiven, vpSpent, votes, claims, huntClaimed] = todayStats as readonly [number, number, number, number, bigint];
    console.log(`\nToday's Activity:`);
    console.log(`  Voting Points:    ${formatNumber(Number(vpGiven))} given / ${formatNumber(Number(vpSpent))} spent`);
    console.log(`  Votes:            ${formatNumber(Number(votes))}`);
    console.log(`  Claims:           ${formatNumber(Number(claims))}`);
    if (huntClaimed > 0n) {
      console.log(`  HUNT Claimed:     ${formatTokenAmount(huntClaimed, 18, 0)}`);
    }
  }
}
