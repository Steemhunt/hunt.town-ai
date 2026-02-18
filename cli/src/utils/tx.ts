/**
 * Transaction utilities for write operations
 */
import { parseEther } from 'viem';
import type { Address, Hash, WalletClient } from 'viem';
import { publicClient } from '../config/client.js';
import { ERC20_ABI } from '../abi/erc20.js';

/**
 * Ensure token approval for a spender
 */
export async function ensureApproval(
  walletClient: WalletClient,
  tokenAddress: Address,
  spenderAddress: Address,
  amount: bigint
): Promise<void> {
  const userAddress = walletClient.account?.address;
  if (!userAddress) throw new Error('No wallet account found');

  // Check current allowance
  const allowance = await publicClient.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress, spenderAddress],
  });

  // Skip if already approved
  if (allowance >= amount) {
    console.log('✅ Token approval sufficient');
    return;
  }

  console.log('📝 Approving token spending...');
  
  const hash = await walletClient.writeContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [spenderAddress, amount],
  });

  await waitForTx(hash);
  console.log('✅ Token approval confirmed');
}

/**
 * Wait for transaction confirmation and show result
 */
export async function waitForTx(hash: Hash): Promise<void> {
  console.log(`⏳ Waiting for transaction: ${hash.slice(0, 10)}...`);
  
  const receipt = await publicClient.waitForTransactionReceipt({ 
    hash,
    confirmations: 1
  });

  if (receipt.status === 'success') {
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`   Gas used: ${receipt.gasUsed.toLocaleString()}`);
  } else {
    throw new Error('Transaction failed');
  }
}

/**
 * Prompt user to confirm an action
 */
export async function confirmAction(message: string): Promise<boolean> {
  console.log(`\n⚠️  ${message}`);
  console.log('This will submit a transaction to the blockchain.');
  
  // In a real CLI, you'd use readline or similar for user input
  // For now, we'll assume confirmation (CLI tools usually do unless --yes flag)
  // TODO: Add proper user confirmation with readline
  return true;
}

/**
 * Check ETH balance and ensure sufficient for transaction
 */
export async function checkETHBalance(address: Address, requiredAmount: bigint): Promise<void> {
  const balance = await publicClient.getBalance({ address });
  
  if (balance < requiredAmount) {
    const required = parseEther(requiredAmount.toString());
    const available = parseEther(balance.toString());
    throw new Error(
      `Insufficient ETH balance. Required: ${required} ETH, Available: ${available} ETH`
    );
  }
}