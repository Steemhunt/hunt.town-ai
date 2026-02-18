/**
 * Check claimable HUNT from voting rewards
 */
import { formatEther } from 'viem';
import type { Address } from 'viem';
import { publicClient } from '../config/client.js';
import { CONTRACTS } from '../config/contracts.js';
import { MINTPAD_ABI } from '../abi/mintpad.js';
import { fetchProjects, type TokenData } from '../utils/api.js';
import { getWalletAddress, loadEnvConfig } from '../utils/wallet.js';
import { getHuntPrice, huntToUSD } from '../utils/price.js';
import { formatTokenAmount, formatNumber } from '../utils/format.js';

/**
 * Find project by symbol
 */
async function findProjectBySymbol(symbol: string): Promise<TokenData | null> {
  const response = await fetchProjects();
  const projects = response.tokens;
  return projects.find(p => p.symbol.toLowerCase() === symbol.toLowerCase()) || null;
}

interface ClaimableOptions {
  project?: string;
}

/**
 * Execute claimable command
 */
export async function claimableCommand(options: ClaimableOptions): Promise<void> {
  loadEnvConfig();
  
  console.log('Claimable HUNT Rewards');
  console.log('======================\n');

  try {
    const walletAddress = getWalletAddress();
    
    if (!walletAddress) {
      console.log('No wallet configured.');
      console.log('Set PRIVATE_KEY in ~/.hunttown/.env or local .env file to check claimable rewards.');
      return;
    }

    console.log(`Address:        ${walletAddress}`);
    
    const huntPrice = await getHuntPrice();

    if (options.project) {
      // Check single project
      const project = await findProjectBySymbol(options.project);
      if (!project) {
        console.error(`Project "${options.project}" not found.`);
        process.exit(1);
      }

      const result = await publicClient.readContract({
        address: CONTRACTS.MINTPAD,
        abi: MINTPAD_ABI,
        functionName: 'getClaimableHunt',
        args: [walletAddress, project.address as Address],
      });

      const [totalHuntToClaim, endDay] = result as readonly [bigint, bigint];

      console.log(`\nProject:        ${project.name} (${project.symbol})`);
      
      if (totalHuntToClaim > 0n) {
        const huntFormatted = formatTokenAmount(totalHuntToClaim, 18, 6);
        const huntUSD = huntToUSD(Number(formatEther(totalHuntToClaim)), huntPrice);
        console.log(`Claimable:      ${huntFormatted} HUNT (${huntUSD})`);
        console.log(`Claim up to:    Day ${formatNumber(Number(endDay))}`);
      } else {
        console.log(`Claimable:      0 HUNT`);
      }

    } else {
      // Check all projects
      const projectsResponse = await fetchProjects();
      const projects = projectsResponse.tokens;
      const tokenAddresses = projects.map(p => p.address as Address);

      const results = await publicClient.readContract({
        address: CONTRACTS.MINTPAD,
        abi: MINTPAD_ABI,
        functionName: 'getClaimableHuntMultiple',
        args: [walletAddress, tokenAddresses],
      });

      const [huntAmounts, endDays] = results as readonly [readonly bigint[], readonly bigint[]];

      console.log('\nClaimable Rewards by Project:');
      console.log('=============================');

      let totalClaimable = 0n;
      let hasClaimable = false;

      for (let i = 0; i < projects.length; i++) {
        const project = projects[i];
        const huntAmount = huntAmounts[i];
        const endDay = endDays[i];

        if (huntAmount > 0n) {
          hasClaimable = true;
          totalClaimable += huntAmount;
          
          const huntFormatted = formatTokenAmount(huntAmount, 18, 6);
          const huntUSD = huntToUSD(Number(formatEther(huntAmount)), huntPrice);
          
          console.log(`  ${project.symbol.padEnd(8)} ${huntFormatted.padStart(15)} HUNT (${huntUSD}) - Day ${formatNumber(Number(endDay))}`);
        }
      }

      if (!hasClaimable) {
        console.log('  No claimable rewards found');
      } else {
        const totalFormatted = formatTokenAmount(totalClaimable, 18, 6);
        const totalUSD = huntToUSD(Number(formatEther(totalClaimable)), huntPrice);
        
        console.log('\n=============================');
        console.log(`Total:       ${totalFormatted.padStart(15)} HUNT (${totalUSD})`);
      }
    }

  } catch (error: any) {
    console.error('Error fetching claimable rewards:', error.message || error);
    process.exit(1);
  }
}