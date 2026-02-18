/**
 * List all Hunt Town Co-op projects
 */
import { publicClient } from '../config/client.js';
import { CONTRACTS } from '../config/contracts.js';
import { PROJECT_UPDATES_ABI } from '../abi/project-updates.js';
import { fetchAllProjects } from '../utils/api.js';
import { formatNumber } from '../utils/format.js';
import { getHuntPrice, huntToUSD } from '../utils/price.js';

/**
 * Execute `ht projects` command
 */
export async function projectsCommand(): Promise<void> {
  const [projects, huntPrice] = await Promise.all([
    fetchAllProjects(),
    getHuntPrice(),
  ]);

  if (projects.length === 0) {
    console.log('No projects found.');
    return;
  }

  // Sort by reserve balance descending
  projects.sort((a, b) => b.reserveBalance - a.reserveBalance);

  console.log('Hunt Town Co-op Projects');
  console.log('========================\n');

  console.log(
    ' #  Symbol          Reserve (HUNT)     Price (HUNT)      Updates'
  );
  console.log(
    '--- ----------   -----------------   ---------------   ---------'
  );

  // Fetch update counts in parallel
  const updateCounts = await Promise.all(
    projects.map(async (p) => {
      try {
        const count = await publicClient.readContract({
          address: CONTRACTS.PROJECT_UPDATES,
          abi: PROJECT_UPDATES_ABI,
          functionName: 'getTokenProjectUpdatesCount',
          args: [p.tokenAddress as `0x${string}`],
        });
        return Number(count);
      } catch {
        return 0;
      }
    })
  );

  let totalReserve = 0;
  projects.forEach((p, i) => {
    totalReserve += p.reserveBalance;
    const num = String(i + 1).padStart(2);
    const sym = p.symbol.padEnd(10);
    const reserve = formatNumber(p.reserveBalance.toFixed(2)).padStart(17);
    const price = p.priceForNextMint.toFixed(8).padStart(15);
    const updates = String(updateCounts[i]).padStart(5);
    console.log(`${num}  ${sym}   ${reserve}   ${price}       ${updates}`);
  });

  console.log('');
  console.log(
    `Total: ${projects.length} projects | ${formatNumber(totalReserve.toFixed(0))} HUNT locked (${huntToUSD(totalReserve, huntPrice)})`
  );
}
