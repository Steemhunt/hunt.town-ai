/**
 * Claim accumulated HUNT royalties
 */
import { formatEther } from 'viem';
import { publicClient, createWalletClientForBase } from '../config/client.js';
import { CONTRACTS } from '../config/contracts.js';
import { BOND_ABI } from '../abi/bond.js';
import { requireKey } from '../utils/wallet.js';
import { formatTokenAmount } from '../utils/format.js';
import { getHuntPrice, huntToUSD } from '../utils/price.js';
import { waitForTx, confirmAction } from '../utils/tx.js';

/**
 * Execute claim-royalty command
 */
export async function claimRoyaltyCommand(): Promise<void> {
  console.log('Claiming HUNT Royalties...');
  console.log('==========================\n');

  try {
    // Get private key and create wallet client
    const privateKey = requireKey();
    const walletClient = createWalletClientForBase(privateKey);
    const walletAddress = walletClient.account?.address;
    
    if (!walletAddress) {
      console.error('Could not get wallet address from private key.');
      process.exit(1);
    }

    // Check royalty info first
    const royaltyInfo = await publicClient.readContract({
      address: CONTRACTS.MCV2_BOND,
      abi: BOND_ABI,
      functionName: 'getRoyaltyInfo',
      args: [walletAddress, CONTRACTS.HUNT],
    });

    const [accumulated, claimed] = royaltyInfo as readonly [bigint, bigint];
    const unclaimed = accumulated - claimed;

    if (unclaimed === 0n) {
      console.log(`❌ No unclaimed HUNT royalties available.`);
      console.log('   Create projects or wait for trading activity to earn royalties.');
      return;
    }

    const huntPrice = await getHuntPrice();
    const unclaimedFormatted = formatTokenAmount(unclaimed, 18, 6);
    const unclaimedUSD = huntToUSD(Number(formatEther(unclaimed)), huntPrice);

    console.log(`Your Address:    ${walletAddress}`);
    console.log(`Available:       ${unclaimedFormatted} HUNT (${unclaimedUSD})\n`);

    // Confirm the action
    const confirmed = await confirmAction(
      `This will claim ${unclaimedFormatted} HUNT in royalty rewards.`
    );
    
    if (!confirmed) {
      console.log('Operation cancelled.');
      return;
    }

    // Claim the royalties
    console.log('💰 Claiming HUNT royalties...');
    const hash = await walletClient.writeContract({
      address: CONTRACTS.MCV2_BOND,
      abi: BOND_ABI,
      functionName: 'claimRoyalties',
      args: [CONTRACTS.HUNT],
    });

    await waitForTx(hash);
    
    console.log(`\n🎉 HUNT royalties claimed successfully!`);
    console.log(`   ${unclaimedFormatted} HUNT transferred to your wallet`);
    console.log(`   Value: ${unclaimedUSD}`);
    console.log(`   View on Base: https://basescan.org/tx/${hash}`);

  } catch (error: any) {
    console.error('Error claiming royalties:', error.message || error);
    process.exit(1);
  }
}