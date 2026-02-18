/**
 * Claim HUNT tokens from voting rewards
 */
import { parseEther, formatEther } from 'viem';
import type { Address } from 'viem';
import { publicClient, createWalletClientForBase } from '../config/client.js';
import { CONTRACTS } from '../config/contracts.js';
import { MINTPAD_ABI } from '../abi/mintpad.js';
import { findProjectBySymbol } from '../utils/api.js';
import { requireKey } from '../utils/wallet.js';
import { formatTokenAmount, formatNumber } from '../utils/format.js';
import { getHuntPrice, huntToUSD } from '../utils/price.js';
import { ensureApproval, waitForTx, confirmAction } from '../utils/tx.js';

interface ClaimOptions {
  tokens?: string;
  donation?: string;
}

/**
 * Execute claim command
 */
export async function claimCommand(symbol: string, options: ClaimOptions): Promise<void> {
  console.log(`Claiming rewards from ${symbol.toUpperCase()}...`);
  console.log('=========================================\n');

  try {
    // Parse options
    const tokensToMint = options.tokens ? parseEther(options.tokens) : 0n;
    const donationBp = options.donation ? BigInt(parseInt(options.donation)) : 0n;

    if (donationBp > 10000n) {
      console.error('Donation basis points cannot exceed 10000 (100%)');
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

    // Check claimable amount first
    const claimableResult = await publicClient.readContract({
      address: CONTRACTS.MINTPAD,
      abi: MINTPAD_ABI,
      functionName: 'getClaimableHunt',
      args: [walletAddress, project.tokenAddress as Address],
    });

    const [totalHuntToClaim, endDay] = claimableResult as readonly [bigint, bigint];
    
    if (totalHuntToClaim === 0n) {
      console.log(`❌ No claimable HUNT rewards for ${project.symbol}`);
      console.log('   Vote on this project to earn rewards!');
      return;
    }

    const huntPrice = await getHuntPrice();
    const huntFormatted = formatTokenAmount(totalHuntToClaim, 18, 6);
    const huntUSD = huntToUSD(Number(formatEther(totalHuntToClaim)), huntPrice);

    console.log(`Project:         ${project.name} (${project.symbol})`);
    console.log(`Claimable:       ${huntFormatted} HUNT (${huntUSD})`);
    console.log(`Tokens to mint:  ${tokensToMint > 0n ? formatTokenAmount(tokensToMint, 18, 4) : '0'}`);
    console.log(`Donation:        ${formatNumber(Number(donationBp) / 100)}% (${Number(donationBp)} bp)`);
    console.log(`Claim up to:     Day ${formatNumber(Number(endDay))}`);
    console.log(`Your Address:    ${walletAddress}\n`);

    // Confirm the action
    const confirmed = await confirmAction(
      `This will claim ${huntFormatted} HUNT from ${project.symbol} voting rewards.`
    );
    
    if (!confirmed) {
      console.log('Operation cancelled.');
      return;
    }

    // Ensure HUNT approval for Mintpad contract (needed for the claim operation)
    // The claim function might need to spend HUNT for minting tokens
    await ensureApproval(
      walletClient,
      CONTRACTS.HUNT,
      CONTRACTS.MINTPAD,
      totalHuntToClaim
    );

    // Execute the claim
    console.log('💰 Claiming HUNT rewards...');
    const hash = await walletClient.writeContract({
      address: CONTRACTS.MINTPAD,
      abi: MINTPAD_ABI,
      functionName: 'claim',
      args: [project.tokenAddress as Address, tokensToMint, donationBp],
    });

    await waitForTx(hash);
    
    console.log(`\n🎉 HUNT rewards claimed successfully!`);
    console.log(`   ${huntFormatted} HUNT claimed from ${project.symbol}`);
    if (tokensToMint > 0n) {
      console.log(`   ${formatTokenAmount(tokensToMint, 18, 4)} ${project.symbol} tokens minted`);
    }
    if (donationBp > 0n) {
      console.log(`   ${formatNumber(Number(donationBp) / 100)}% donated to the project`);
    }
    console.log(`   View on Base: https://basescan.org/tx/${hash}`);

  } catch (error: any) {
    if (error.message?.includes('Mintpad__NothingToClaim')) {
      console.error('❌ Nothing to claim for this project.');
    } else if (error.message?.includes('Mintpad__ExcessiveLeftover')) {
      console.error('❌ Excessive leftover amount in claim calculation.');
    } else {
      console.error('Error claiming rewards:', error.message || error);
    }
    process.exit(1);
  }
}