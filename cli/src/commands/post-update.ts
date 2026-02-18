/**
 * Post a builder update for a Hunt Town project (burns HUNT)
 */
import { parseEther } from 'viem';
import type { Address } from 'viem';
import { publicClient, createWalletClientForBase } from '../config/client.js';
import { CONTRACTS } from '../config/contracts.js';
import { PROJECT_UPDATES_ABI } from '../abi/project-updates.js';
import { fetchProjects, type TokenData } from '../utils/api.js';
import { requireKey, getWalletAddress } from '../utils/wallet.js';
import { formatTokenAmount } from '../utils/format.js';
import { ensureApproval, waitForTx, confirmAction } from '../utils/tx.js';
import { getHuntPrice, huntToUSD } from '../utils/price.js';

/**
 * Find project by symbol
 */
async function findProjectBySymbol(symbol: string): Promise<TokenData | null> {
  const response = await fetchProjects();
  const projects = response.tokens;
  return projects.find(p => p.symbol.toLowerCase() === symbol.toLowerCase()) || null;
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Execute post-update command
 */
export async function postUpdateCommand(symbol: string, link: string): Promise<void> {
  console.log(`Posting update for ${symbol.toUpperCase()}...`);
  console.log('=====================================\n');

  try {
    // Validate inputs
    if (!isValidUrl(link)) {
      console.error('Invalid URL format. Please provide a valid HTTP/HTTPS URL.');
      process.exit(1);
    }

    // Get private key and create wallet client
    const privateKey = requireKey();
    const walletClient = createWalletClientForBase(privateKey);
    const walletAddress = walletClient.account?.address;
    
    if (!walletAddress) {
      console.error('Could not get wallet address from private key.');
      process.exit(1);
    }

    // Find the project
    const project = await findProjectBySymbol(symbol);
    if (!project) {
      console.error(`Project "${symbol}" not found.`);
      process.exit(1);
    }

    // Get price per update from contract
    const pricePerUpdate = await publicClient.readContract({
      address: CONTRACTS.PROJECT_UPDATES,
      abi: PROJECT_UPDATES_ABI,
      functionName: 'pricePerUpdate',
    });

    const huntPrice = await getHuntPrice();
    const priceFormatted = formatTokenAmount(pricePerUpdate, 18, 0);
    const priceUSD = huntToUSD(Number(priceFormatted.replace(/,/g, '')), huntPrice);

    console.log(`Project:        ${project.name} (${project.symbol})`);
    console.log(`Update Link:    ${link}`);
    console.log(`Cost:           ${priceFormatted} HUNT (${priceUSD})`);
    console.log(`Your Address:   ${walletAddress}\n`);

    // Confirm the action
    const confirmed = await confirmAction(
      `This will burn ${priceFormatted} HUNT tokens to post your update.`
    );
    
    if (!confirmed) {
      console.log('Operation cancelled.');
      return;
    }

    // Ensure HUNT approval for PROJECT_UPDATES contract
    await ensureApproval(
      walletClient,
      CONTRACTS.HUNT,
      CONTRACTS.PROJECT_UPDATES,
      pricePerUpdate
    );

    // Post the update
    console.log('📝 Posting project update...');
    const hash = await walletClient.writeContract({
      address: CONTRACTS.PROJECT_UPDATES,
      abi: PROJECT_UPDATES_ABI,
      functionName: 'postUpdate',
      args: [project.address as Address, link],
    });

    await waitForTx(hash);
    
    console.log(`\n🎉 Project update posted successfully!`);
    console.log(`   ${priceFormatted} HUNT burned`);
    console.log(`   View on Base: https://basescan.org/tx/${hash}`);

  } catch (error: any) {
    console.error('Error posting update:', error.message || error);
    process.exit(1);
  }
}