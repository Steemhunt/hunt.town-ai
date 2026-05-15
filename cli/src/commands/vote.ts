/**
 * Vote on a Hunt Town Co-op project
 */
import type { Address } from 'viem';
import { publicClient, createWalletClientForBase } from '../config/client.js';
import { CONTRACTS } from '../config/contracts.js';
import { MINTPAD_ABI } from '../abi/mintpad.js';
import { findProjectBySymbol } from '../utils/api.js';
import { requireKey } from '../utils/wallet.js';
import { formatNumber } from '../utils/format.js';
import { waitForTx, confirmAction } from '../utils/tx.js';

/**
 * Execute vote command
 */
export async function voteCommand(symbol: string, amount: string): Promise<void> {
  console.log(`Voting on ${symbol.toUpperCase()}...`);
  console.log('=============================\n');

  try {
    const voteAmount = parseInt(amount);
    if (isNaN(voteAmount) || voteAmount <= 0) {
      console.error('Invalid vote amount. Please provide a positive integer.');
      process.exit(1);
    }

    if (voteAmount > 2147483647) { // uint32 max
      console.error('Vote amount too large. Maximum is 2,147,483,647.');
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

    // Get current day and check user's voting points
    const currentDay = await publicClient.readContract({
      address: CONTRACTS.MINTPAD,
      abi: MINTPAD_ABI,
      functionName: 'getCurrentDay',
    });

    const votingPoints = await publicClient.readContract({
      address: CONTRACTS.MINTPAD,
      abi: MINTPAD_ABI,
      functionName: 'dailyUserVotingPoint',
      args: [currentDay, walletAddress],
    });

    const [activated, left] = votingPoints as readonly [number, number];

    console.log(`Project:         ${project.name} (${project.symbol})`);
    console.log(`Vote Amount:     ${formatNumber(voteAmount)} points`);
    console.log(`Your Address:    ${walletAddress}`);
    console.log(`Day:             ${formatNumber(Number(currentDay))}`);
    console.log(`Voting Points:   ${formatNumber(activated)} activated / ${formatNumber(left)} remaining`);
    
    if (left < voteAmount) {
      console.error(`\n❌ Insufficient voting points. You have ${left} remaining but need ${voteAmount}.`);
      console.log('\n💡 Note: You need to activate voting points first via server signature.');
      console.log('   This requires calling activateVotingPoint() with a signed message.');
      console.log('   The CLI currently doesn\'t support this - use the web interface.');
      process.exit(1);
    }

    console.log('');

    // Confirm the action
    const confirmed = await confirmAction(
      `This will cast ${formatNumber(voteAmount)} voting points on ${project.symbol}.`
    );
    
    if (!confirmed) {
      console.log('Operation cancelled.');
      return;
    }

    // Cast the vote
    console.log('🗳️  Casting vote...');
    const hash = await walletClient.writeContract({
      address: CONTRACTS.MINTPAD,
      abi: MINTPAD_ABI,
      functionName: 'vote',
      args: [project.tokenAddress as Address, voteAmount],
    });

    await waitForTx(hash);
    
    console.log(`\n🎉 Vote cast successfully!`);
    console.log(`   ${formatNumber(voteAmount)} points voted on ${project.symbol}`);
    console.log(`   View on Base: https://basescan.org/tx/${hash}`);

  } catch (error: any) {
    if (error.message?.includes('Mintpad__InsufficientVotingPoints')) {
      console.error('❌ Insufficient voting points for this vote.');
      console.log('\n💡 You need to activate voting points first via the web interface.');
    } else {
      console.error('Error casting vote:', error.message || error);
    }
    process.exit(1);
  }
}