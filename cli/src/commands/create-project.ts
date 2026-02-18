/**
 * Create a new Hunt Town Co-op project
 *
 * Supports FDV-based presets (small/medium/large) that auto-generate
 * a hyperbolic bonding curve — same algorithm as the Hunt Town web app.
 */
import { parseEther, formatEther } from 'viem';
import { publicClient, createWalletClientForBase } from '../config/client.js';
import { CONTRACTS } from '../config/contracts.js';
import { BOND_ABI } from '../abi/bond.js';
import { requireKey } from '../utils/wallet.js';
import { formatTokenAmount, formatNumber } from '../utils/format.js';
import { getHuntPrice, huntToUSD } from '../utils/price.js';
import { waitForTx, confirmAction } from '../utils/tx.js';

// ── Bonding Curve Generator ─────────────────────────────────────────────
// Ported from mintpad LaunchModal.tsx generateBondingCurveParams

const CURVE_CONFIG = {
  STEP_COUNT: 500,
  CURVE_STEEPNESS: 0.85,   // gap between initial and later increases
  CURVE_EXPONENT: 4,        // power-4 hyperbolic J-curve
  DEFAULT_ROYALTY_BPS: 100,  // 1.0%
} as const;

/** FDV presets in USD — same as mintpad web app */
export const FDV_PRESETS: Record<string, number> = {
  small: 1_000,    // $1K initial FDV
  medium: 5_000,   // $5K initial FDV
  large: 30_000,   // $30K initial FDV
};

interface CurveResult {
  stepRanges: bigint[];
  stepPrices: bigint[];
  initialPrice: number;
  finalPrice: number;
  multiplier: number;
  tvlHunt: number;
}

/**
 * Generate a hyperbolic bonding curve from initial FDV target.
 *
 * Algorithm: multiplier = (1 / (1 - progress * steepness))^exponent
 * This creates a J-curve where early buyers get cheaper prices.
 */
export function generateBondingCurve(
  maxSupplyWei: bigint,
  initialFdvUsd: number,
  huntPriceUsd: number,
): CurveResult {
  const maxSupplyNum = Number(formatEther(maxSupplyWei));
  const initialPriceInHunt = initialFdvUsd / (maxSupplyNum * huntPriceUsd);

  if (initialPriceInHunt <= 0) {
    throw new Error('Calculated initial price is zero — check FDV and max supply');
  }

  const stepSize = maxSupplyWei / BigInt(CURVE_CONFIG.STEP_COUNT);
  const stepRanges: bigint[] = [];
  const stepPrices: bigint[] = [];
  let cumulativeSupply = 0n;

  const multipliers: number[] = [];
  for (let i = 0; i < CURVE_CONFIG.STEP_COUNT; i++) {
    const progress = i / CURVE_CONFIG.STEP_COUNT;
    const scarcity = 1 - progress * CURVE_CONFIG.CURVE_STEEPNESS;
    multipliers.push(Math.pow(1 / scarcity, CURVE_CONFIG.CURVE_EXPONENT));
  }

  for (let i = 0; i < CURVE_CONFIG.STEP_COUNT; i++) {
    const price = initialPriceInHunt * multipliers[i];
    stepPrices.push(price > 0 ? parseEther(price.toFixed(20)) : 0n);

    cumulativeSupply += stepSize;
    const isLast = i === CURVE_CONFIG.STEP_COUNT - 1;
    stepRanges.push(isLast ? maxSupplyWei : cumulativeSupply);
  }

  // Calculate TVL (total HUNT locked if fully minted)
  const WEI = 10n ** 18n;
  const tvlWei = stepPrices.reduce(
    (sum, price) => sum + (price * stepSize) / WEI,
    0n,
  );

  const finalMultiplier = multipliers[CURVE_CONFIG.STEP_COUNT - 1];
  const finalPrice = initialPriceInHunt * finalMultiplier;

  return {
    stepRanges,
    stepPrices,
    initialPrice: initialPriceInHunt,
    finalPrice,
    multiplier: finalMultiplier,
    tvlHunt: Number(formatEther(tvlWei)),
  };
}

// ── CLI Options ─────────────────────────────────────────────────────────

interface CreateProjectOptions {
  name: string;
  symbol: string;
  maxSupply?: string;
  mintRoyalty?: string;
  burnRoyalty?: string;
  preset?: string;
  fdv?: string;
  steps?: string;
}

/**
 * Parse manual step configuration from JSON
 * Format: [{"range":"500000","price":"0.001"},{"range":"1000000","price":"0.01"}]
 */
function parseSteps(stepsJson: string, maxSupply: bigint): { stepRanges: bigint[]; stepPrices: bigint[] } {
  try {
    const steps = JSON.parse(stepsJson);

    if (!Array.isArray(steps) || steps.length === 0) {
      throw new Error('Steps must be a non-empty JSON array');
    }

    const stepRanges = steps.map((s: any) => parseEther(String(s.range)));
    const stepPrices = steps.map((s: any) => parseEther(String(s.price)));

    // Validate ranges are ascending
    for (let i = 1; i < stepRanges.length; i++) {
      if (stepRanges[i] <= stepRanges[i - 1]) {
        throw new Error('Step ranges must be ascending');
      }
    }

    // Last range must equal max supply
    if (stepRanges[stepRanges.length - 1] !== maxSupply) {
      console.log(`⚠️  Last step range adjusted to match max supply (${formatEther(maxSupply)})`);
      stepRanges[stepRanges.length - 1] = maxSupply;
    }

    return { stepRanges, stepPrices };
  } catch (error: any) {
    if (error.message.includes('JSON')) {
      throw new Error(`Invalid steps JSON: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Execute create-project command
 */
export async function createProjectCommand(options: CreateProjectOptions): Promise<void> {
  console.log('Creating Hunt Town Co-op Project...');
  console.log('===================================\n');

  try {
    // Validate required inputs
    if (!options.name?.trim()) {
      console.error('Project name is required (--name)');
      process.exit(1);
    }
    if (!options.symbol?.trim()) {
      console.error('Project symbol is required (--symbol)');
      process.exit(1);
    }
    if (options.symbol.length > 11) {
      console.error('Symbol cannot exceed 11 characters');
      process.exit(1);
    }

    const maxSupply = parseEther(options.maxSupply || '100000000'); // default 100M
    const mintRoyalty = parseInt(options.mintRoyalty || '100');      // default 1%
    const burnRoyalty = parseInt(options.burnRoyalty || '100');      // default 1%

    if (maxSupply <= 0n) {
      console.error('Max supply must be greater than 0');
      process.exit(1);
    }
    if (mintRoyalty < 0 || mintRoyalty > 5000) {
      console.error('Mint royalty must be 0-5000 basis points (0-50%)');
      process.exit(1);
    }
    if (burnRoyalty < 0 || burnRoyalty > 5000) {
      console.error('Burn royalty must be 0-5000 basis points (0-50%)');
      process.exit(1);
    }

    // Determine bonding curve: preset/fdv or manual steps
    let stepRanges: bigint[];
    let stepPrices: bigint[];
    let curveInfo: CurveResult | null = null;

    if (options.steps) {
      // Manual steps
      const parsed = parseSteps(options.steps, maxSupply);
      stepRanges = parsed.stepRanges;
      stepPrices = parsed.stepPrices;
    } else {
      // Use preset or custom FDV
      const huntPrice = await getHuntPrice();
      if (huntPrice <= 0) {
        console.error('Could not fetch HUNT price — needed for curve generation');
        process.exit(1);
      }

      let fdvUsd: number;
      if (options.fdv) {
        fdvUsd = parseFloat(options.fdv);
        if (isNaN(fdvUsd) || fdvUsd <= 0) {
          console.error('Invalid FDV value. Provide a positive number in USD.');
          process.exit(1);
        }
      } else {
        const preset = (options.preset || 'medium').toLowerCase();
        fdvUsd = FDV_PRESETS[preset];
        if (!fdvUsd) {
          console.error(`Unknown preset "${preset}". Use: small ($1K), medium ($5K), or large ($30K)`);
          process.exit(1);
        }
        console.log(`Using "${preset}" preset — initial FDV target: $${formatNumber(fdvUsd)}\n`);
      }

      curveInfo = generateBondingCurve(maxSupply, fdvUsd, huntPrice);
      stepRanges = curveInfo.stepRanges;
      stepPrices = curveInfo.stepPrices;
    }

    // Get wallet
    const privateKey = requireKey();
    const walletClient = createWalletClientForBase(privateKey);
    const walletAddress = walletClient.account?.address;
    if (!walletAddress) {
      console.error('Could not get wallet address from private key.');
      process.exit(1);
    }

    // Get creation fee
    const creationFee = await publicClient.readContract({
      address: CONTRACTS.MCV2_BOND,
      abi: BOND_ABI,
      functionName: 'creationFee',
    });

    const huntPrice = await getHuntPrice();
    const feeFormatted = formatTokenAmount(creationFee as bigint, 18, 4);
    const feeUSD = huntToUSD(Number(formatEther(creationFee as bigint)), huntPrice);

    // Display summary
    console.log(`Project Name:     ${options.name}`);
    console.log(`Symbol:           ${options.symbol.toUpperCase()}`);
    console.log(`Max Supply:       ${formatNumber(Number(formatEther(maxSupply)).toFixed(0))} tokens`);
    console.log(`Mint Royalty:     ${(mintRoyalty / 100).toFixed(2)}% (${mintRoyalty} bp)`);
    console.log(`Burn Royalty:     ${(burnRoyalty / 100).toFixed(2)}% (${burnRoyalty} bp)`);
    console.log(`Reserve Token:    HUNT`);
    console.log(`Creation Fee:     ${feeFormatted} ETH (${feeUSD})`);
    console.log(`Your Address:     ${walletAddress}`);

    if (curveInfo) {
      console.log(`\nBonding Curve (Hyperbolic J-Curve):`);
      console.log(`  Steps:          ${CURVE_CONFIG.STEP_COUNT}`);
      console.log(`  Initial Price:  ${curveInfo.initialPrice.toFixed(10)} HUNT`);
      console.log(`  Final Price:    ${curveInfo.finalPrice.toFixed(10)} HUNT`);
      console.log(`  Multiplier:     ${curveInfo.multiplier.toFixed(2)}x`);
      console.log(`  Full-mint TVL:  ${formatNumber(curveInfo.tvlHunt.toFixed(0))} HUNT (${huntToUSD(curveInfo.tvlHunt, huntPrice)})`);
    } else {
      console.log(`  Steps:          ${stepRanges.length} custom price tiers`);
    }

    console.log('');

    const confirmed = await confirmAction(
      `This will create "${options.symbol.toUpperCase()}" and pay ${feeFormatted} ETH creation fee.`
    );
    if (!confirmed) {
      console.log('Operation cancelled.');
      return;
    }

    // Submit transaction
    console.log('🏗️  Creating Co-op project...');
    const hash = await walletClient.writeContract({
      address: CONTRACTS.MCV2_BOND,
      abi: BOND_ABI,
      functionName: 'createToken',
      args: [
        { name: options.name.trim(), symbol: options.symbol.trim().toUpperCase() },
        {
          mintRoyalty,
          burnRoyalty,
          reserveToken: CONTRACTS.HUNT,
          maxSupply: maxSupply as unknown as bigint,
          stepRanges,
          stepPrices,
        },
      ],
      value: creationFee as bigint,
    });

    await waitForTx(hash);

    console.log(`\n🎉 Co-op project created successfully!`);
    console.log(`   Project: ${options.name} (${options.symbol.toUpperCase()})`);
    console.log(`   View on Base: https://basescan.org/tx/${hash}`);
    console.log(`\n💡 Your project will appear on hunt.town shortly.`);
    console.log(`   You'll earn ${(mintRoyalty / 100).toFixed(2)}% mint / ${(burnRoyalty / 100).toFixed(2)}% burn royalties!`);

  } catch (error: any) {
    console.error('Error creating project:', error.message || error);
    process.exit(1);
  }
}
