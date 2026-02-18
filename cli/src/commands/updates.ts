/**
 * Show recent project updates from Hunt Town Co-op
 */
import type { Address } from 'viem';
import { publicClient } from '../config/client.js';
import { CONTRACTS } from '../config/contracts.js';
import { PROJECT_UPDATES_ABI } from '../abi/project-updates.js';
import { ERC20_ABI } from '../abi/erc20.js';
import { fetchAllProjects } from '../utils/api.js';

/**
 * Execute `ht updates` command
 */
export async function updatesCommand(options: { project?: string }): Promise<void> {
  const projectSymbol = options.project;

  if (projectSymbol) {
    console.log(`Recent Updates — ${projectSymbol.toUpperCase()}`);
  } else {
    console.log('Recent Updates — All Projects');
  }
  console.log('===============================\n');

  let updates: Array<{ tokenAddress: string; link: string }>;

  if (projectSymbol) {
    const projects = await fetchAllProjects();
    const project = projects.find(p => p.symbol.toLowerCase() === projectSymbol.toLowerCase());
    if (!project) {
      console.error(`❌ Project "${projectSymbol}" not found.`);
      process.exit(1);
    }

    const raw = await publicClient.readContract({
      address: CONTRACTS.PROJECT_UPDATES,
      abi: PROJECT_UPDATES_ABI,
      functionName: 'getLatestProjectUpdates',
      args: [project.tokenAddress as `0x${string}`, 0n, 20n],
    });
    updates = (raw as any[]).map(u => ({ tokenAddress: u.tokenAddress, link: u.link }));
  } else {
    const raw = await publicClient.readContract({
      address: CONTRACTS.PROJECT_UPDATES,
      abi: PROJECT_UPDATES_ABI,
      functionName: 'getLatestUpdates',
      args: [0n, 20n],
    });
    updates = (raw as any[]).map(u => ({ tokenAddress: u.tokenAddress, link: u.link }));
  }

  if (updates.length === 0) {
    console.log('No updates found.');
    return;
  }

  // Resolve symbols
  const symbolCache = new Map<string, string>();
  for (const u of updates) {
    if (!symbolCache.has(u.tokenAddress)) {
      try {
        const sym = await publicClient.readContract({
          address: u.tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'symbol',
        });
        symbolCache.set(u.tokenAddress, sym as string);
      } catch {
        symbolCache.set(u.tokenAddress, '???');
      }
    }
  }

  updates.forEach((u, i) => {
    const num = String(i + 1).padStart(2);
    const sym = (symbolCache.get(u.tokenAddress) || '???').padEnd(8);
    if (projectSymbol) {
      console.log(`${num}. ${u.link}`);
    } else {
      console.log(`${num}. [${sym}] ${u.link}`);
    }
  });

  console.log(`\nShowing ${updates.length} most recent updates.`);
}
