/**
 * Top Co-op projects ranked by HUNT reserve (TVL)
 */
import { fetchAllProjects } from '../utils/api.js';
import { formatNumber } from '../utils/format.js';
import { getHuntPrice, huntToUSD } from '../utils/price.js';

/**
 * Execute `ht leaderboard` command
 */
export async function leaderboardCommand(options: { limit?: string }): Promise<void> {
  const limit = parseInt(options.limit || '20', 10);

  const [projects, huntPrice] = await Promise.all([
    fetchAllProjects(),
    getHuntPrice(),
  ]);

  projects.sort((a, b) => b.reserveBalance - a.reserveBalance);
  const top = projects.slice(0, limit);
  const totalReserve = projects.reduce((sum, p) => sum + p.reserveBalance, 0);

  console.log('Hunt Town Co-op Leaderboard');
  console.log('===========================\n');

  console.log(' #  Symbol          Reserve (HUNT)        USD Value     Share');
  console.log('--- ----------   -----------------   ---------------   ------');

  top.forEach((p, i) => {
    const num = String(i + 1).padStart(2);
    const sym = p.symbol.padEnd(10);
    const reserve = formatNumber(p.reserveBalance.toFixed(2)).padStart(17);
    const usd = huntToUSD(p.reserveBalance, huntPrice).padStart(15);
    const share = totalReserve > 0
      ? ((p.reserveBalance / totalReserve) * 100).toFixed(2) + '%'
      : '0.00%';
    console.log(`${num}  ${sym}   ${reserve}   ${usd}   ${share.padStart(6)}`);
  });

  console.log('');
  console.log(`Showing top ${top.length} of ${projects.length} projects`);
  console.log(`Total HUNT locked: ${formatNumber(totalReserve.toFixed(0))} (${huntToUSD(totalReserve, huntPrice)})`);
}
