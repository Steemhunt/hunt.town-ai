/**
 * Show detailed information for a single Hunt Town project
 */
import type { Address } from 'viem';
import { formatEther } from 'viem';
import { publicClient } from '../config/client.js';
import { CONTRACTS } from '../config/contracts.js';
import { BOND_ABI } from '../abi/bond.js';
import { ERC20_ABI } from '../abi/erc20.js';
import { PROJECT_UPDATES_ABI } from '../abi/project-updates.js';
import { fetchAllProjects, fetchTokenMetadata } from '../utils/api.js';
import { formatNumber, shortenAddress, formatPercentage, formatDate } from '../utils/format.js';
import { getHuntPrice, formatHuntWithUSD } from '../utils/price.js';

/**
 * Execute `ht project <symbol>` command
 */
export async function projectCommand(symbol: string): Promise<void> {
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
}
