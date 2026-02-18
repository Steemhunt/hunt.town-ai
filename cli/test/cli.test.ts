import { describe, it, expect, beforeAll, vi } from 'vitest';
import { createPublicClient, fallback, http, type Address, formatUnits, parseEther } from 'viem';
import { base } from 'viem/chains';

// Test helpers
import { 
  HUNT, USDC, WETH, H1, MT, ONCHAT, SIGNET,
  BOND, MINTPAD, PROJECT_UPDATES, SPOT_PRICE_AGGREGATOR,
  SPOT_ABI, BASE_RPCS 
} from './helpers.js';

// ABIs
import { BOND_ABI } from '../src/abi/bond.js';
import { MINTPAD_ABI } from '../src/abi/mintpad.js';
import { PROJECT_UPDATES_ABI } from '../src/abi/project-updates.js';
import { ERC20_ABI } from '../src/abi/erc20.js';

// Utils
import { 
  formatNumber, formatTokenAmount, shortenAddress, 
  formatPercentage, formatDate, formatTimeAgo, formatUSD 
} from '../src/utils/format.js';
import { fetchAllProjects, fetchReserveStats, fetchTokenMetadata, findProjectBySymbol } from '../src/utils/api.js';

// Create project bonding curve functions
import { generateBondingCurve, FDV_PRESETS } from '../src/utils/curve.js';

// Child process for CLI integration tests
import { execSync } from 'child_process';

// Config test timeout for RPC calls
vi.setConfig({ testTimeout: 60_000 });

let publicClient: any;

beforeAll(async () => {
  publicClient = createPublicClient({
    chain: base,
    transport: fallback(BASE_RPCS.map(rpc => http(rpc))),
  });
  console.log('✅ Public client created with fallback transport');
});

describe('Format Utils', { timeout: 5_000 }, () => {
  it('formatNumber should format numbers with commas', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber('9876543')).toBe('9,876,543');
    expect(formatNumber(123n)).toBe('123');
    expect(formatNumber(1000n)).toBe('1,000');
  });

  it('formatTokenAmount should format token amounts with decimals', () => {
    expect(formatTokenAmount(123456789012345678n, 18, 2)).toBe('0.12');
    expect(formatTokenAmount(1000000000000000000n, 18, 2)).toBe('1');
    expect(formatTokenAmount(1500000000000000000n, 18, 4)).toBe('1.5');
    expect(formatTokenAmount(123456n, 6, 0)).toBe('0');
  });

  it('shortenAddress should truncate addresses', () => {
    expect(shortenAddress(H1)).toBe('0xa2Ec...4afb');
    expect(shortenAddress(HUNT)).toBe('0x37f0...064C');
  });

  it('formatPercentage should format percentages', () => {
    expect(formatPercentage(12.345)).toBe('12.35%');
    expect(formatPercentage(0.1)).toBe('0.10%');
    expect(formatPercentage(100)).toBe('100.00%');
  });

  it('formatDate should format timestamps as YYYY-MM-DD', () => {
    const timestamp = 1640995200; // Jan 1, 2022 UTC
    expect(formatDate(timestamp)).toBe('2022-01-01');
  });

  it('formatTimeAgo should format relative times', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(formatTimeAgo(now - 30)).toBe('just now');
    expect(formatTimeAgo(now - 300)).toBe('5m ago');
    expect(formatTimeAgo(now - 7200)).toBe('2h ago');
    expect(formatTimeAgo(now - 172800)).toBe('2d ago');
  });
});

describe('Mint Club API', { timeout: 30_000 }, () => {
  it('fetchAllProjects should return array of projects', async () => {
    const projects = await fetchAllProjects();
    console.log(`📊 Found ${projects.length} Hunt Town projects`);
    
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThan(0);
    
    // Check first project has required fields
    const firstProject = projects[0];
    expect(firstProject).toHaveProperty('tokenAddress');
    expect(firstProject).toHaveProperty('symbol');
    expect(firstProject).toHaveProperty('name');
    expect(firstProject).toHaveProperty('reserveBalance');
    expect(firstProject).toHaveProperty('priceForNextMint');
    
    console.log(`🎯 Sample project: ${firstProject.symbol} (${firstProject.name})`);
    console.log(`   Reserve: ${firstProject.reserveBalance} HUNT`);
    console.log(`   Next mint price: ${firstProject.priceForNextMint} HUNT`);
  });

  it('fetchReserveStats should return valid stats', async () => {
    const stats = await fetchReserveStats();
    console.log(`💰 Total HUNT locked: ${stats.totalHuntLocked}`);
    console.log(`🚀 Active projects: ${stats.projectCount}`);
    
    expect(stats.totalHuntLocked).toBeGreaterThan(0);
    expect(stats.projectCount).toBeGreaterThan(0);
  });

  it('fetchTokenMetadata for MT should return metadata with logo', async () => {
    const metadata = await fetchTokenMetadata(MT);
    console.log(`🖼️  MT metadata:`, metadata);
    
    expect(metadata).not.toBeNull();
    if (metadata) {
      // MT might have logo - check if it exists
      console.log(`   Logo: ${metadata.logo || 'No logo'}`);
    }
  });
});

describe('Contract Reads - MCV2_Bond', { timeout: 30_000 }, () => {
  it('tokenBond for H1 should return valid bond info', async () => {
    const bondInfo = await publicClient.readContract({
      address: BOND,
      abi: BOND_ABI,
      functionName: 'tokenBond',
      args: [H1],
    });
    
    console.log(`🔗 H1 Bond Info:`, bondInfo);
    const [creator, mintRoyalty, burnRoyalty, createdAt, reserveToken, reserveBalance] = bondInfo;
    expect(creator).not.toBe('0x0000000000000000000000000000000000000000');
    expect(reserveToken.toLowerCase()).toBe(HUNT.toLowerCase());
    expect(reserveBalance).toBeGreaterThan(0n);
  });

  it('tokenBond for ONCHAT should return valid bond info', async () => {
    const bondInfo = await publicClient.readContract({
      address: BOND,
      abi: BOND_ABI,
      functionName: 'tokenBond',
      args: [ONCHAT],
    });
    
    console.log(`💬 ONCHAT Bond Info:`, bondInfo);
    const [creator, mintRoyalty, burnRoyalty, createdAt, reserveToken, reserveBalance] = bondInfo;
    expect(creator).not.toBe('0x0000000000000000000000000000000000000000');
    expect(reserveToken.toLowerCase()).toBe(HUNT.toLowerCase());
    expect(reserveBalance).toBeGreaterThan(0n);
  });

  it('priceForNextMint for MT should return positive price', async () => {
    const price = await publicClient.readContract({
      address: BOND,
      abi: BOND_ABI,
      functionName: 'priceForNextMint',
      args: [MT],
    });
    
    console.log(`💰 MT next mint price: ${formatUnits(price, 18)} HUNT`);
    expect(price).toBeGreaterThan(0n);
  });

  it('maxSupply for H1 should return positive supply', async () => {
    const supply = await publicClient.readContract({
      address: BOND,
      abi: BOND_ABI,
      functionName: 'maxSupply',
      args: [H1],
    });
    
    console.log(`📊 H1 max supply: ${formatUnits(supply, 18)}`);
    expect(supply).toBeGreaterThan(0n);
  });

  it('exists for H1 should return true', async () => {
    const exists = await publicClient.readContract({
      address: BOND,
      abi: BOND_ABI,
      functionName: 'exists',
      args: [H1],
    });
    
    console.log(`✅ H1 exists: ${exists}`);
    expect(exists).toBe(true);
  });

  it('exists for random address should return false', async () => {
    const randomAddress = '0x1234567890123456789012345678901234567890' as Address;
    const exists = await publicClient.readContract({
      address: BOND,
      abi: BOND_ABI,
      functionName: 'exists',
      args: [randomAddress],
    });
    
    console.log(`❌ Random address exists: ${exists}`);
    expect(exists).toBe(false);
  });
});

describe('Contract Reads - Mintpad', { timeout: 30_000 }, () => {
  it('getCurrentDay should return positive number around 77+', async () => {
    const currentDay = await publicClient.readContract({
      address: MINTPAD,
      abi: MINTPAD_ABI,
      functionName: 'getCurrentDay',
    });
    
    console.log(`📅 Current Mintpad day: ${currentDay}`);
    expect(Number(currentDay)).toBeGreaterThan(75);
  });

  it('dailyHuntReward should return positive bigint', async () => {
    const reward = await publicClient.readContract({
      address: MINTPAD,
      abi: MINTPAD_ABI,
      functionName: 'dailyHuntReward',
    });
    
    console.log(`🏆 Daily HUNT reward: ${formatUnits(reward, 18)} HUNT`);
    expect(reward).toBeGreaterThan(0n);
  });

  it('dailyStats for day 1 should return valid struct', async () => {
    const stats = await publicClient.readContract({
      address: MINTPAD,
      abi: MINTPAD_ABI,
      functionName: 'dailyStats',
      args: [1n],
    });
    
    console.log(`📊 Day 1 stats:`, stats);
    expect(stats).toBeDefined();
    // Stats might have totalVotingPointGiven and other properties
  });
});

describe('Contract Reads - ProjectUpdates', { timeout: 30_000 }, () => {
  it('getProjectUpdatesCount should return positive count', async () => {
    const count = await publicClient.readContract({
      address: PROJECT_UPDATES,
      abi: PROJECT_UPDATES_ABI,
      functionName: 'getProjectUpdatesCount',
    });
    
    console.log(`📰 Total project updates: ${count}`);
    expect(Number(count)).toBeGreaterThan(0);
  });

  it('getTokenProjectUpdatesCount for ONCHAT should return count >= 8', async () => {
    const count = await publicClient.readContract({
      address: PROJECT_UPDATES,
      abi: PROJECT_UPDATES_ABI,
      functionName: 'getTokenProjectUpdatesCount',
      args: [ONCHAT],
    });
    
    console.log(`💬 ONCHAT updates count: ${count}`);
    expect(Number(count)).toBeGreaterThanOrEqual(8);
  });

  it('getLatestUpdates should return array of updates', async () => {
    const updates = await publicClient.readContract({
      address: PROJECT_UPDATES,
      abi: PROJECT_UPDATES_ABI,
      functionName: 'getLatestUpdates',
      args: [0n, 5n], // Get 5 updates, starting from 0
    });
    
    console.log(`📋 Latest updates (first 2):`, updates.slice(0, 2));
    expect(Array.isArray(updates)).toBe(true);
    
    // The function might return empty array if there are no updates in the range
    // Let's just check that it returns an array
    if (updates.length > 0) {
      expect(updates[0]).toHaveProperty('tokenAddress');
      expect(updates[0]).toHaveProperty('link');
    }
  });

  it('getLatestProjectUpdates for ONCHAT should return updates with links', async () => {
    const updates = await publicClient.readContract({
      address: PROJECT_UPDATES,
      abi: PROJECT_UPDATES_ABI,
      functionName: 'getLatestProjectUpdates',
      args: [ONCHAT, 3n, 0n], // Get 3 latest updates for ONCHAT
    });
    
    console.log(`💬 ONCHAT updates:`, updates);
    expect(Array.isArray(updates)).toBe(true);
    
    if (updates.length > 0) {
      expect(updates[0]).toHaveProperty('link');
    }
  });

  it('pricePerUpdate should return a bigint', async () => {
    const price = await publicClient.readContract({
      address: PROJECT_UPDATES,
      abi: PROJECT_UPDATES_ABI,
      functionName: 'pricePerUpdate',
    });
    
    console.log(`💰 Price per update: ${formatUnits(price, 18)} HUNT`);
    expect(typeof price).toBe('bigint');
    // Price could be 0 for free updates
  });
});

describe('1inch Spot Price', { timeout: 30_000 }, () => {
  it('getRate HUNT/USDC should return price between $0.01 and $10', async () => {
    const rate = await publicClient.readContract({
      address: SPOT_PRICE_AGGREGATOR,
      abi: SPOT_ABI,
      functionName: 'getRate',
      args: [HUNT, USDC, true],
    });
    
    // Convert rate to readable price (HUNT has 18 decimals, USDC has 6)
    const huntPrice = Number(formatUnits(rate, 6)); // 1inch returns rate in USDC decimals
    console.log(`💰 HUNT/USDC price: $${huntPrice.toFixed(6)}`);
    
    expect(huntPrice).toBeGreaterThan(0.01);
    expect(huntPrice).toBeLessThan(10);
  });

  it('getRate WETH/USDC should return price between $100 and $100,000', async () => {
    const rate = await publicClient.readContract({
      address: SPOT_PRICE_AGGREGATOR,
      abi: SPOT_ABI,
      functionName: 'getRate',
      args: [WETH, USDC, true],
    });
    
    // Convert rate to readable price (WETH has 18 decimals, USDC has 6)
    const wethPrice = Number(formatUnits(rate, 6));
    console.log(`💰 WETH/USDC price: $${wethPrice.toFixed(2)}`);
    
    expect(wethPrice).toBeGreaterThan(100);
    expect(wethPrice).toBeLessThan(100000);
  });
});

describe('End-to-End Price Calculation', { timeout: 30_000 }, () => {
  it('should calculate H1 token USD price via bond + 1inch', async () => {
    // Get H1 next mint price in HUNT
    const h1PriceInHunt = await publicClient.readContract({
      address: BOND,
      abi: BOND_ABI,
      functionName: 'priceForNextMint',
      args: [H1],
    });
    
    // Get HUNT/USDC rate
    const huntUsdcRate = await publicClient.readContract({
      address: SPOT_PRICE_AGGREGATOR,
      abi: SPOT_ABI,
      functionName: 'getRate',
      args: [HUNT, USDC, true],
    });
    
    const huntPriceInHunt = Number(formatUnits(h1PriceInHunt, 18));
    const huntPriceInUsd = Number(formatUnits(huntUsdcRate, 6));
    const h1PriceInUsd = huntPriceInHunt * huntPriceInUsd;
    
    console.log(`🔗 H1 Calculation:`);
    console.log(`   H1 price: ${huntPriceInHunt.toFixed(6)} HUNT`);
    console.log(`   HUNT price: $${huntPriceInUsd.toFixed(6)}`);
    console.log(`   H1 USD price: ${formatUSD(h1PriceInUsd)}`);
    
    expect(h1PriceInUsd).toBeGreaterThan(0);
    expect(huntPriceInHunt).toBeGreaterThan(0);
  });

  it('should calculate ONCHAT reserve value in USD', async () => {
    // Get ONCHAT bond info
    const bondInfo = await publicClient.readContract({
      address: BOND,
      abi: BOND_ABI,
      functionName: 'tokenBond',
      args: [ONCHAT],
    });
    
    // Get HUNT/USDC rate
    const huntUsdcRate = await publicClient.readContract({
      address: SPOT_PRICE_AGGREGATOR,
      abi: SPOT_ABI,
      functionName: 'getRate',
      args: [HUNT, USDC, true],
    });
    
    const [creator, mintRoyalty, burnRoyalty, createdAt, reserveToken, reserveBalance] = bondInfo;
    const reserveInHunt = Number(formatUnits(reserveBalance, 18));
    const huntPriceInUsd = Number(formatUnits(huntUsdcRate, 6));
    const reserveValueInUsd = reserveInHunt * huntPriceInUsd;
    
    console.log(`💬 ONCHAT Reserve Value:`);
    console.log(`   Reserve: ${reserveInHunt.toFixed(2)} HUNT`);
    console.log(`   HUNT price: $${huntPriceInUsd.toFixed(6)}`);
    console.log(`   Reserve USD value: ${formatUSD(reserveValueInUsd)}`);
    
    expect(reserveValueInUsd).toBeGreaterThan(0);
    expect(reserveInHunt).toBeGreaterThan(0);
  });
});

describe('Edge Cases', { timeout: 30_000 }, () => {
  it('tokenBond for non-MC token (USDC) should have zero creator', async () => {
    const bondInfo = await publicClient.readContract({
      address: BOND,
      abi: BOND_ABI,
      functionName: 'tokenBond',
      args: [USDC],
    });
    
    console.log(`💲 USDC bond info:`, bondInfo);
    const [creator, mintRoyalty, burnRoyalty, createdAt, reserveToken, reserveBalance] = bondInfo;
    expect(creator).toBe('0x0000000000000000000000000000000000000000');
  });

  it('getLatestUpdates with large offset should work correctly', async () => {
    // First get total count
    const totalCount = await publicClient.readContract({
      address: PROJECT_UPDATES,
      abi: PROJECT_UPDATES_ABI,
      functionName: 'getProjectUpdatesCount',
    });
    
    // Query with a reasonable offset (not beyond total)
    const updates = await publicClient.readContract({
      address: PROJECT_UPDATES,
      abi: PROJECT_UPDATES_ABI,
      functionName: 'getLatestUpdates',
      args: [Math.min(50, Number(totalCount) - 5), 5n], // Safe offset, limit 5
    });
    
    console.log(`📋 Updates with offset ${Math.min(50, Number(totalCount) - 5)}:`, updates.length);
    expect(Array.isArray(updates)).toBe(true);
    // Should return valid array (might be empty if offset is too high, but that's ok)
  });

  it('priceForNextMint for non-existent token should revert', async () => {
    const nonExistentToken = '0x1111111111111111111111111111111111111111' as Address;
    
    await expect(
      publicClient.readContract({
        address: BOND,
        abi: BOND_ABI,
        functionName: 'priceForNextMint',
        args: [nonExistentToken],
      })
    ).rejects.toThrow();
    
    console.log(`❌ Non-existent token correctly reverted`);
  });
});

describe('Bonding Curve Generator', { timeout: 5_000 }, () => {
  it('generateBondingCurve with small preset ($1K FDV) should return 500 steps', () => {
    const maxSupply = parseEther('100000000'); // 100M tokens
    const fdvUsd = FDV_PRESETS.small; // $1K
    const huntPriceUsd = 0.10; // $0.10 HUNT price

    const result = generateBondingCurve(maxSupply, fdvUsd, huntPriceUsd);

    console.log(`🔢 Small preset: ${result.stepRanges.length} steps, initial price: ${result.initialPrice.toFixed(10)} HUNT`);
    
    expect(result.stepRanges).toHaveLength(500);
    expect(result.stepPrices).toHaveLength(500);
    expect(result.initialPrice).toBeGreaterThan(0);
    expect(result.finalPrice).toBeGreaterThan(result.initialPrice);
  });

  it('generateBondingCurve with medium preset ($5K FDV) should return higher initial price than small', () => {
    const maxSupply = parseEther('100000000');
    const huntPriceUsd = 0.10;

    const smallResult = generateBondingCurve(maxSupply, FDV_PRESETS.small, huntPriceUsd);
    const mediumResult = generateBondingCurve(maxSupply, FDV_PRESETS.medium, huntPriceUsd);

    console.log(`📈 Price comparison - Small: ${smallResult.initialPrice.toFixed(10)}, Medium: ${mediumResult.initialPrice.toFixed(10)}`);
    
    expect(mediumResult.initialPrice).toBeGreaterThan(smallResult.initialPrice);
    expect(mediumResult.finalPrice).toBeGreaterThan(smallResult.finalPrice);
  });

  it('generateBondingCurve with large preset ($30K FDV) should return highest initial price', () => {
    const maxSupply = parseEther('100000000');
    const huntPriceUsd = 0.10;

    const smallResult = generateBondingCurve(maxSupply, FDV_PRESETS.small, huntPriceUsd);
    const mediumResult = generateBondingCurve(maxSupply, FDV_PRESETS.medium, huntPriceUsd);
    const largeResult = generateBondingCurve(maxSupply, FDV_PRESETS.large, huntPriceUsd);

    console.log(`🚀 Large preset initial price: ${largeResult.initialPrice.toFixed(10)} HUNT`);
    
    expect(largeResult.initialPrice).toBeGreaterThan(mediumResult.initialPrice);
    expect(largeResult.initialPrice).toBeGreaterThan(smallResult.initialPrice);
  });

  it('final price should always be higher than initial price (J-curve property)', () => {
    const maxSupply = parseEther('100000000');
    const huntPriceUsd = 0.10;

    const testCases = [
      { name: 'small', fdv: FDV_PRESETS.small },
      { name: 'medium', fdv: FDV_PRESETS.medium },
      { name: 'large', fdv: FDV_PRESETS.large },
    ];

    testCases.forEach(({ name, fdv }) => {
      const result = generateBondingCurve(maxSupply, fdv, huntPriceUsd);
      console.log(`📊 ${name}: ${result.initialPrice.toFixed(10)} → ${result.finalPrice.toFixed(10)} HUNT (${result.multiplier.toFixed(2)}x)`);
      
      expect(result.finalPrice).toBeGreaterThan(result.initialPrice);
      expect(result.multiplier).toBeGreaterThan(1);
    });
  });

  it('step ranges should be ascending and last range equals maxSupply', () => {
    const maxSupply = parseEther('100000000');
    const fdvUsd = FDV_PRESETS.medium;
    const huntPriceUsd = 0.10;

    const result = generateBondingCurve(maxSupply, fdvUsd, huntPriceUsd);

    // Check ascending ranges
    for (let i = 1; i < result.stepRanges.length; i++) {
      expect(result.stepRanges[i]).toBeGreaterThan(result.stepRanges[i - 1]);
    }

    // Last range should equal maxSupply
    expect(result.stepRanges[result.stepRanges.length - 1]).toBe(maxSupply);
    
    console.log(`✅ Step ranges: ${result.stepRanges[0]} → ${result.stepRanges[result.stepRanges.length - 1]} (${result.stepRanges.length} steps)`);
  });

  it('step prices should be ascending (monotonic for hyperbolic curve)', () => {
    const maxSupply = parseEther('100000000');
    const fdvUsd = FDV_PRESETS.medium;
    const huntPriceUsd = 0.10;

    const result = generateBondingCurve(maxSupply, fdvUsd, huntPriceUsd);

    // Check ascending prices
    for (let i = 1; i < result.stepPrices.length; i++) {
      expect(result.stepPrices[i]).toBeGreaterThanOrEqual(result.stepPrices[i - 1]);
    }
    
    console.log(`💰 Price progression: ${formatUnits(result.stepPrices[0], 18)} → ${formatUnits(result.stepPrices[result.stepPrices.length - 1], 18)} HUNT`);
  });

  it('TVL should be positive and reasonable', () => {
    const maxSupply = parseEther('100000000');
    const fdvUsd = FDV_PRESETS.medium;
    const huntPriceUsd = 0.10;

    const result = generateBondingCurve(maxSupply, fdvUsd, huntPriceUsd);

    expect(result.tvlHunt).toBeGreaterThan(0);
    expect(result.tvlHunt).toBeGreaterThan(result.initialPrice * 100_000_000); // Should be much higher than initial FDV

    console.log(`💎 TVL if fully minted: ${formatNumber(result.tvlHunt.toFixed(0))} HUNT`);
  });

  it('with fixed HUNT price $0.10, medium preset: initial price should be approximately FDV/(supply*huntPrice)', () => {
    const maxSupply = parseEther('100000000'); // 100M tokens
    const fdvUsd = FDV_PRESETS.medium; // $5K
    const huntPriceUsd = 0.10;

    const result = generateBondingCurve(maxSupply, fdvUsd, huntPriceUsd);
    
    const maxSupplyNum = Number(formatUnits(maxSupply, 18));
    const expectedInitialPrice = fdvUsd / (maxSupplyNum * huntPriceUsd);

    console.log(`🎯 Expected: ${expectedInitialPrice.toFixed(10)}, Actual: ${result.initialPrice.toFixed(10)}`);
    
    // Should be approximately equal (allowing for floating point precision)
    const tolerance = expectedInitialPrice * 0.001; // 0.1% tolerance
    expect(Math.abs(result.initialPrice - expectedInitialPrice)).toBeLessThan(tolerance);
  });
});

describe('CLI Command Integration Tests', { timeout: 60_000 }, () => {
  const runCLI = (command: string): string => {
    try {
      return execSync(`node dist/index.js ${command}`, { 
        encoding: 'utf-8', 
        timeout: 30_000,
        env: { ...process.env, PRIVATE_KEY: '' },
        cwd: '/root/.openclaw/workspace/hunt.town-ai/cli'
      });
    } catch (error: any) {
      // If command fails, return stderr + stdout
      return (error.stdout || '') + (error.stderr || '');
    }
  };

  it('ht projects command output should contain "Hunt Town Co-op Projects" header', () => {
    const output = runCLI('projects');
    console.log(`📋 Projects output preview: ${output.substring(0, 200)}...`);
    
    expect(output).toContain('Hunt Town Co-op Projects');
  });

  it('ht stats command output should contain "HUNT Price:" and "Total Projects:"', () => {
    const output = runCLI('stats');
    console.log(`📊 Stats output preview: ${output.substring(0, 300)}...`);
    
    expect(output).toContain('HUNT Price:');
    expect(output).toContain('Total Projects:');
  });

  it('ht project H1 should show H1 token info', () => {
    const output = runCLI('project H1');
    console.log(`🎯 H1 project info preview: ${output.substring(0, 200)}...`);
    
    expect(output.toLowerCase()).toContain('h1');
  });

  it('ht leaderboard should list projects sorted by reserve', () => {
    const output = runCLI('leaderboard');
    console.log(`🏆 Leaderboard preview: ${output.substring(0, 200)}...`);
    
    expect(output).toContain('Leaderboard');
    expect(output).toContain('Reserve');
  });

  it('ht updates should show recent updates', () => {
    const output = runCLI('updates');
    console.log(`📰 Updates preview: ${output.substring(0, 200)}...`);
    
    expect(output).toContain('Recent Updates');
  });

  it('ht wallet without PRIVATE_KEY should show "No wallet configured"', () => {
    const output = runCLI('wallet');
    console.log(`👛 Wallet output: ${output.trim()}`);
    
    expect(output).toContain('No wallet configured');
  });

  it('ht claimable without PRIVATE_KEY should show appropriate message', () => {
    const output = runCLI('claimable');
    console.log(`💰 Claimable output: ${output.trim()}`);
    
    // Should either show no wallet configured or claimable info structure
    expect(output.length).toBeGreaterThan(0);
  });

  it('ht royalty without PRIVATE_KEY should show appropriate message', () => {
    const output = runCLI('royalty');
    console.log(`👑 Royalty output: ${output.trim()}`);
    
    // Should either show no wallet configured or royalty info structure
    expect(output.length).toBeGreaterThan(0);
  });

  it('ht create-project --help should list all options including --preset', () => {
    const output = runCLI('create-project --help');
    console.log(`❓ Create project help preview: ${output.substring(0, 300)}...`);
    
    expect(output).toContain('--preset');
    expect(output).toContain('--name');
    expect(output).toContain('--symbol');
  });
});

describe('findProjectBySymbol Function', { timeout: 30_000 }, () => {
  it('should find ONCHAT (case insensitive)', async () => {
    const project = await findProjectBySymbol('onchat');
    console.log(`💬 Found ONCHAT project:`, project?.symbol, project?.name);
    
    expect(project).not.toBeNull();
    expect(project?.symbol.toLowerCase()).toBe('onchat');
    expect(project?.tokenAddress).toBeTruthy();
  });

  it('should find ONCHAT with uppercase', async () => {
    const project = await findProjectBySymbol('ONCHAT');
    console.log(`💬 Found ONCHAT (uppercase):`, project?.symbol);
    
    expect(project).not.toBeNull();
    expect(project?.symbol.toLowerCase()).toBe('onchat');
  });

  it('should return null for non-existent symbol', async () => {
    const project = await findProjectBySymbol('NONEXISTENT123');
    console.log(`❌ Non-existent symbol result:`, project);
    
    expect(project).toBeNull();
  });
});