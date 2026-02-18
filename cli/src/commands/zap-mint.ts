/**
 * Buy project tokens with ETH or USDC via ZapUniV4MCV2
 */
import { parseEther, formatEther, parseUnits, formatUnits, zeroAddress } from 'viem';
import type { Address } from 'viem';
import { publicClient, createWalletClientForBase } from '../config/client.js';
import { CONTRACTS } from '../config/contracts.js';
import { ZAP_ABI } from '../abi/zap.js';
import { findProjectBySymbol } from '../utils/api.js';
import { requireKey } from '../utils/wallet.js';
import { formatTokenAmount, formatNumber } from '../utils/format.js';
import { ensureApproval, waitForTx, confirmAction } from '../utils/tx.js';

interface ZapMintOptions {
  from?: string;
  slippage?: string;
}

/**
 * Get token address and decimals for from token
 */
function getFromTokenInfo(fromToken: string): { address: Address; decimals: number; name: string } {
  const token = fromToken.toLowerCase();
  
  switch (token) {
    case 'eth':
      return { address: zeroAddress, decimals: 18, name: 'ETH' };
    case 'usdc':
      return { address: CONTRACTS.USDC, decimals: 6, name: 'USDC' };
    default:
      throw new Error(`Unsupported from token: ${fromToken}. Use 'eth' or 'usdc'`);
  }
}

/**
 * Execute zap-mint command
 */
export async function zapMintCommand(
  symbol: string, 
  amount: string, 
  options: ZapMintOptions
): Promise<void> {
  console.log(`Zap Minting ${symbol.toUpperCase()}...`);
  console.log('===============================\n');

  try {
    const fromToken = options.from || 'eth';
    const slippage = parseFloat(options.slippage || '1.0'); // Default 1%
    
    if (slippage <= 0 || slippage >= 100) {
      console.error('Slippage must be between 0 and 100 percent');
      process.exit(1);
    }

    const fromTokenInfo = getFromTokenInfo(fromToken);
    const projectTokenAmount = parseEther(amount); // Project tokens are 18 decimals

    if (projectTokenAmount <= 0n) {
      console.error('Amount must be greater than 0');
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

    // Estimate the required from token amount
    const estimation = await publicClient.readContract({
      address: CONTRACTS.ZAP_UNIV4_MCV2,
      abi: ZAP_ABI,
      functionName: 'estimateMint',
      args: [
        fromTokenInfo.address,
        project.tokenAddress as Address,
        projectTokenAmount,
      ],
    });

    const [fromTokenAmount, totalHuntRequired] = estimation as readonly [bigint, bigint];
    
    // Apply slippage protection
    const slippageMultiplier = BigInt(Math.floor((100 + slippage) * 100));
    const maxFromTokenAmount = (fromTokenAmount * slippageMultiplier) / 10000n;

    const fromTokenFormatted = formatUnits(fromTokenAmount, fromTokenInfo.decimals);
    const maxFromTokenFormatted = formatUnits(maxFromTokenAmount, fromTokenInfo.decimals);
    const projectTokenFormatted = formatTokenAmount(projectTokenAmount, 18, 4);
    const huntFormatted = formatTokenAmount(totalHuntRequired, 18, 6);

    console.log(`Project:         ${project.name} (${project.symbol})`);
    console.log(`Tokens to mint:  ${projectTokenFormatted} ${project.symbol}`);
    console.log(`Estimated cost:  ${fromTokenFormatted} ${fromTokenInfo.name}`);
    console.log(`Max cost:        ${maxFromTokenFormatted} ${fromTokenInfo.name} (${formatNumber(slippage)}% slippage)`);
    console.log(`HUNT required:   ${huntFormatted} HUNT`);
    console.log(`Your Address:    ${walletAddress}\n`);

    // Check balance
    if (fromTokenInfo.address === zeroAddress) {
      // ETH balance check
      const ethBalance = await publicClient.getBalance({ address: walletAddress });
      if (ethBalance < maxFromTokenAmount) {
        console.error(`❌ Insufficient ETH balance`);
        console.error(`   Required: ${maxFromTokenFormatted} ETH`);
        console.error(`   Available: ${formatEther(ethBalance)} ETH`);
        process.exit(1);
      }
    } else {
      // ERC20 token balance check
      const tokenBalance = await publicClient.readContract({
        address: fromTokenInfo.address,
        abi: [
          {
            name: 'balanceOf',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }],
          },
        ],
        functionName: 'balanceOf',
        args: [walletAddress],
      });

      if (tokenBalance < maxFromTokenAmount) {
        console.error(`❌ Insufficient ${fromTokenInfo.name} balance`);
        console.error(`   Required: ${maxFromTokenFormatted} ${fromTokenInfo.name}`);
        console.error(`   Available: ${formatUnits(tokenBalance, fromTokenInfo.decimals)} ${fromTokenInfo.name}`);
        process.exit(1);
      }
    }

    // Confirm the action
    const confirmed = await confirmAction(
      `This will mint ${projectTokenFormatted} ${project.symbol} for up to ${maxFromTokenFormatted} ${fromTokenInfo.name}.`
    );
    
    if (!confirmed) {
      console.log('Operation cancelled.');
      return;
    }

    // Approve token spending if not ETH
    if (fromTokenInfo.address !== zeroAddress) {
      await ensureApproval(
        walletClient,
        fromTokenInfo.address,
        CONTRACTS.ZAP_UNIV4_MCV2,
        maxFromTokenAmount
      );
    }

    // Execute the zap mint
    console.log('⚡ Zap minting project tokens...');
    const hash = await walletClient.writeContract({
      address: CONTRACTS.ZAP_UNIV4_MCV2,
      abi: ZAP_ABI,
      functionName: 'mint',
      args: [
        fromTokenInfo.address,
        project.tokenAddress as Address,
        projectTokenAmount,
        maxFromTokenAmount,
      ],
      value: fromTokenInfo.address === zeroAddress ? maxFromTokenAmount : 0n,
    });

    await waitForTx(hash);
    
    console.log(`\n🎉 Zap mint successful!`);
    console.log(`   ${projectTokenFormatted} ${project.symbol} tokens minted`);
    console.log(`   Paid with ${fromTokenInfo.name}`);
    console.log(`   View on Base: https://basescan.org/tx/${hash}`);

  } catch (error: any) {
    if (error.message?.includes('ZapUniV4MCV2__SlippageExceeded')) {
      console.error('❌ Slippage exceeded. Try increasing --slippage percentage.');
    } else if (error.message?.includes('ZapUniV4MCV2__UnsupportedToken')) {
      console.error('❌ Unsupported token for zapping.');
    } else if (error.message?.includes('ZapUniV4MCV2__InvalidAmount')) {
      console.error('❌ Invalid amount specified.');
    } else {
      console.error('Error during zap mint:', error.message || error);
    }
    process.exit(1);
  }
}