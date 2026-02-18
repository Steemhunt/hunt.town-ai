/**
 * Show wallet information and token balances
 */
import { formatEther } from 'viem';
import { publicClient } from '../config/client.js';
import { CONTRACTS } from '../config/contracts.js';
import { getWalletAddress, loadEnvConfig } from '../utils/wallet.js';
import { fetchAllProjects } from '../utils/api.js';
import { getHuntPrice, huntToUSD } from '../utils/price.js';
import { formatTokenAmount } from '../utils/format.js';
import { ERC20_ABI } from '../abi/erc20.js';
import type { Address } from 'viem';

/**
 * Execute wallet command
 */
export async function walletCommand(): Promise<void> {
  loadEnvConfig();
  
  console.log('Hunt Town Wallet');
  console.log('================\n');

  try {
    // Get wallet address from private key
    const walletAddress = getWalletAddress();
    
    if (!walletAddress) {
      console.log('No wallet configured.');
      console.log('Set PRIVATE_KEY in ~/.hunttown/.env or local .env file to view wallet information.');
      console.log('\nExample ~/.hunttown/.env:');
      console.log('PRIVATE_KEY=your_wallet_private_key_here');
      return;
    }

    console.log(`Address:        ${walletAddress}`);
    
    // Get ETH balance
    const ethBalance = await publicClient.getBalance({ 
      address: walletAddress 
    });
    console.log(`ETH Balance:    ${formatEther(ethBalance)} ETH`);

    // Get HUNT balance
    const huntBalance = await publicClient.readContract({
      address: CONTRACTS.HUNT,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [walletAddress],
    });

    const huntPrice = await getHuntPrice();
    const huntFormatted = formatTokenAmount(huntBalance, 18, 2);
    const huntUSD = huntToUSD(Number(formatEther(huntBalance)), huntPrice);
    
    console.log(`HUNT Balance:   ${huntFormatted} HUNT (${huntUSD})`);

    // Get project token balances
    const projects = await fetchAllProjects();
    
    console.log('\nProject Tokens:');
    console.log('===============');
    
    let hasProjectTokens = false;
    
    for (const project of projects) {
      try {
        const balance = await publicClient.readContract({
          address: project.tokenAddress as Address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [walletAddress],
        });

        if (balance > 0n) {
          hasProjectTokens = true;
          const formatted = formatTokenAmount(balance, 18, 4);
          console.log(`  ${project.symbol.padEnd(8)} ${formatted.padStart(15)}`);
        }
      } catch (error) {
        // Skip projects where we can't read balance
        continue;
      }
    }

    if (!hasProjectTokens) {
      console.log('  No project tokens found');
    }
    
    console.log('\n✅ Wallet information loaded successfully.');

  } catch (error: any) {
    console.error('Error fetching wallet information:', error.message || error);
    process.exit(1);
  }
}