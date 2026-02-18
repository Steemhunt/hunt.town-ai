/**
 * Create a new Hunt Town Co-op project
 */
import { parseEther, formatEther } from 'viem';
import { publicClient, createWalletClientForBase } from '../config/client.js';
import { CONTRACTS } from '../config/contracts.js';
import { BOND_ABI } from '../abi/bond.js';
import { requireKey } from '../utils/wallet.js';
import { formatTokenAmount, formatNumber } from '../utils/format.js';
import { getHuntPrice, huntToUSD } from '../utils/price.js';
import { waitForTx, confirmAction } from '../utils/tx.js';

interface CreateProjectOptions {
  name: string;
  symbol: string;
  maxSupply: string;
  mintRoyalty: string;
  burnRoyalty: string;
  steps: string;
}

interface StepConfig {
  ranges: string[];
  prices: string[];
}

/**
 * Parse and validate step configuration from JSON
 */
function parseSteps(stepsJson: string): { stepRanges: bigint[]; stepPrices: bigint[] } {
  try {
    const steps: StepConfig = JSON.parse(stepsJson);
    
    if (!steps.ranges || !steps.prices) {
      throw new Error('Steps JSON must contain "ranges" and "prices" arrays');
    }

    if (steps.ranges.length !== steps.prices.length) {
      throw new Error('Ranges and prices arrays must have the same length');
    }

    const stepRanges = steps.ranges.map(r => parseEther(r));
    const stepPrices = steps.prices.map(p => parseEther(p));

    return { stepRanges, stepPrices };
  } catch (error: any) {
    throw new Error(`Invalid steps JSON: ${error.message}`);
  }
}

/**
 * Execute create-project command
 */
export async function createProjectCommand(options: CreateProjectOptions): Promise<void> {
  console.log('Creating Hunt Town Co-op Project...');
  console.log('===================================\n');

  try {
    // Validate inputs
    if (!options.name || options.name.trim().length === 0) {
      console.error('Project name is required');
      process.exit(1);
    }

    if (!options.symbol || options.symbol.trim().length === 0) {
      console.error('Project symbol is required');
      process.exit(1);
    }

    if (options.symbol.length > 11) {
      console.error('Project symbol cannot exceed 11 characters');
      process.exit(1);
    }

    const maxSupply = parseEther(options.maxSupply);
    const mintRoyalty = parseInt(options.mintRoyalty);
    const burnRoyalty = parseInt(options.burnRoyalty);

    if (maxSupply <= 0n) {
      console.error('Max supply must be greater than 0');
      process.exit(1);
    }

    if (mintRoyalty < 0 || mintRoyalty > 10000) {
      console.error('Mint royalty must be between 0 and 10000 basis points (0-100%)');
      process.exit(1);
    }

    if (burnRoyalty < 0 || burnRoyalty > 10000) {
      console.error('Burn royalty must be between 0 and 10000 basis points (0-100%)');
      process.exit(1);
    }

    const { stepRanges, stepPrices } = parseSteps(options.steps);

    // Get private key and create wallet client
    const privateKey = requireKey();
    const walletClient = createWalletClientForBase(privateKey);
    const walletAddress = walletClient.account?.address;
    
    if (!walletAddress) {
      console.error('Could not get wallet address from private key.');
      process.exit(1);
    }

    // Get creation fee from contract
    const creationFee = await publicClient.readContract({
      address: CONTRACTS.MCV2_BOND,
      abi: BOND_ABI,
      functionName: 'creationFee',
    });

    const huntPrice = await getHuntPrice();
    const feeFormatted = formatTokenAmount(creationFee, 18, 0);
    const feeUSD = huntToUSD(Number(formatEther(creationFee)), huntPrice);

    console.log(`Project Name:     ${options.name}`);
    console.log(`Symbol:           ${options.symbol.toUpperCase()}`);
    console.log(`Max Supply:       ${formatTokenAmount(maxSupply, 18, 0)} tokens`);
    console.log(`Mint Royalty:     ${formatNumber(mintRoyalty / 100)}% (${mintRoyalty} bp)`);
    console.log(`Burn Royalty:     ${formatNumber(burnRoyalty / 100)}% (${burnRoyalty} bp)`);
    console.log(`Reserve Token:    HUNT`);
    console.log(`Creation Fee:     ${feeFormatted} HUNT (${feeUSD})`);
    console.log(`Your Address:     ${walletAddress}`);
    console.log(`Steps:            ${stepRanges.length} price tiers configured\n`);

    // Show step breakdown
    console.log('Price Steps:');
    for (let i = 0; i < stepRanges.length; i++) {
      const rangeFormatted = formatTokenAmount(stepRanges[i], 18, 0);
      const priceFormatted = formatTokenAmount(stepPrices[i], 18, 6);
      console.log(`  Step ${i + 1}: ${rangeFormatted} tokens @ ${priceFormatted} HUNT each`);
    }

    console.log('');

    // Confirm the action
    const confirmed = await confirmAction(
      `This will create a new Co-op project and pay ${feeFormatted} HUNT creation fee.`
    );
    
    if (!confirmed) {
      console.log('Operation cancelled.');
      return;
    }

    // Prepare parameters
    const tokenParams = {
      name: options.name.trim(),
      symbol: options.symbol.trim().toUpperCase(),
    };

    const bondParams = {
      mintRoyalty: mintRoyalty,
      burnRoyalty: burnRoyalty,
      reserveToken: CONTRACTS.HUNT,
      maxSupply: maxSupply,
      stepRanges: stepRanges,
      stepPrices: stepPrices,
    };

    // Create the project
    console.log('🏗️  Creating Co-op project...');
    const hash = await walletClient.writeContract({
      address: CONTRACTS.MCV2_BOND,
      abi: BOND_ABI,
      functionName: 'createToken',
      args: [tokenParams, bondParams],
      value: creationFee,
    });

    await waitForTx(hash);
    
    console.log(`\n🎉 Co-op project created successfully!`);
    console.log(`   Project: ${options.name} (${options.symbol.toUpperCase()})`);
    console.log(`   Creation fee: ${feeFormatted} HUNT paid`);
    console.log(`   View on Base: https://basescan.org/tx/${hash}`);
    console.log('\n💡 Your project will appear in the Co-op listings shortly.');
    console.log('   You\'ll earn royalties from all future mint/burn activity!');

  } catch (error: any) {
    console.error('Error creating project:', error.message || error);
    console.log('\n💡 Common issues:');
    console.log('   • Insufficient ETH for gas fees');
    console.log('   • Symbol already taken');
    console.log('   • Invalid step configuration');
    console.log('   • Insufficient HUNT for creation fee');
    process.exit(1);
  }
}