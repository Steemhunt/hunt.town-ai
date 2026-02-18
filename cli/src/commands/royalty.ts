/**
 * Check accumulated HUNT royalties from project creation and trading
 */
import { formatEther } from 'viem';
import { publicClient } from '../config/client.js';
import { CONTRACTS } from '../config/contracts.js';
import { BOND_ABI } from '../abi/bond.js';
import { getWalletAddress, loadEnvConfig } from '../utils/wallet.js';
import { getHuntPrice, huntToUSD } from '../utils/price.js';
import { formatTokenAmount } from '../utils/format.js';

/**
 * Execute royalty command
 */
export async function royaltyCommand(): Promise<void> {
  loadEnvConfig();
  
  console.log('HUNT Royalty Status');
  console.log('===================\n');

  try {
    const walletAddress = getWalletAddress();
    
    if (!walletAddress) {
      console.log('No wallet configured.');
      console.log('Set PRIVATE_KEY in ~/.hunttown/.env or local .env file to check royalties.');
      return;
    }

    console.log(`Address:        ${walletAddress}`);
    
    // Get royalty info for HUNT token
    const royaltyInfo = await publicClient.readContract({
      address: CONTRACTS.MCV2_BOND,
      abi: BOND_ABI,
      functionName: 'getRoyaltyInfo',
      args: [walletAddress, CONTRACTS.HUNT],
    });

    const [accumulated, claimed] = royaltyInfo as readonly [bigint, bigint];
    const unclaimed = accumulated - claimed;

    const huntPrice = await getHuntPrice();

    console.log('\nRoyalty Summary:');
    console.log('================');
    
    if (accumulated > 0n) {
      const accumulatedFormatted = formatTokenAmount(accumulated, 18, 6);
      const accumulatedUSD = huntToUSD(Number(formatEther(accumulated)), huntPrice);
      console.log(`Total Earned:   ${accumulatedFormatted} HUNT (${accumulatedUSD})`);
    } else {
      console.log(`Total Earned:   0 HUNT`);
    }

    if (claimed > 0n) {
      const claimedFormatted = formatTokenAmount(claimed, 18, 6);
      const claimedUSD = huntToUSD(Number(formatEther(claimed)), huntPrice);
      console.log(`Already Claimed: ${claimedFormatted} HUNT (${claimedUSD})`);
    } else {
      console.log(`Already Claimed: 0 HUNT`);
    }

    if (unclaimed > 0n) {
      const unclaimedFormatted = formatTokenAmount(unclaimed, 18, 6);
      const unclaimedUSD = huntToUSD(Number(formatEther(unclaimed)), huntPrice);
      console.log(`Available:      ${unclaimedFormatted} HUNT (${unclaimedUSD})`);
      console.log('\n💡 Use "ht claim-royalty" to claim your available royalties.');
    } else {
      console.log(`Available:      0 HUNT`);
    }

    console.log('\n📖 Royalties are earned from:');
    console.log('   • Creating new Co-op projects (one-time fee)');
    console.log('   • Mint/burn trading fees on projects you created');
    console.log('   • Based on the royalty rates you set when creating projects');

  } catch (error: any) {
    console.error('Error fetching royalty information:', error.message || error);
    process.exit(1);
  }
}