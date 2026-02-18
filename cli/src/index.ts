#!/usr/bin/env node

/**
 * Hunt Town CLI — AI-friendly tools for the first onchain cooperative
 */
import { Command } from 'commander';
import { config } from 'dotenv';
import { resolve } from 'path';
import { homedir } from 'os';
import { projectsCommand } from './commands/projects.js';
import { projectCommand } from './commands/project.js';
import { updatesCommand } from './commands/updates.js';
import { statsCommand } from './commands/stats.js';
import { leaderboardCommand } from './commands/leaderboard.js';
import { walletCommand } from './commands/wallet.js';
import { postUpdateCommand } from './commands/post-update.js';
import { voteCommand } from './commands/vote.js';
import { claimableCommand } from './commands/claimable.js';
import { claimCommand } from './commands/claim.js';
import { royaltyCommand } from './commands/royalty.js';
import { claimRoyaltyCommand } from './commands/claim-royalty.js';
import { createProjectCommand } from './commands/create-project.js';
import { zapMintCommand } from './commands/zap-mint.js';

// Load env from ~/.hunttown/.env and local .env
config({ path: resolve(homedir(), '.hunttown', '.env'), quiet: true });
config({ quiet: true });

/** Clean error messages for user-facing output */
function cleanError(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  const msg = e.message;
  const details = msg.match(/Details:\s*(.+?)(?:\n|$)/);
  if (details) return details[1].trim();
  const revert = msg.match(/execution reverted[:\s]*(.+?)(?:\n|$)/);
  if (revert) return `Transaction reverted: ${revert[1].trim()}`;
  return msg.split('\n').find(l => l.trim().length > 0)?.trim() ?? msg;
}

/** Wrap async command handlers with error handling */
function run(fn: () => Promise<void>) {
  return async () => {
    try {
      await fn();
    } catch (e) {
      console.error('❌', cleanError(e));
      process.exit(1);
    }
  };
}

const cli = new Command()
  .name('ht')
  .description('Hunt Town CLI — tools for the first onchain cooperative on Base')
  .version('0.1.0');

cli
  .command('projects')
  .description('List all Co-op projects')
  .action(run(projectsCommand));

cli
  .command('project')
  .description('Show detailed project information')
  .argument('<symbol>', 'Project token symbol (e.g. ONCHAT, H1)')
  .action((symbol) => run(() => projectCommand(symbol))());

cli
  .command('updates')
  .description('Show recent project updates')
  .option('-p, --project <symbol>', 'Filter by project symbol')
  .action((opts) => run(() => updatesCommand(opts))());

cli
  .command('stats')
  .description('Show Co-op overview statistics')
  .action(run(statsCommand));

cli
  .command('leaderboard')
  .description('Top projects by HUNT reserve (TVL)')
  .option('-n, --limit <n>', 'Number of projects to show', '20')
  .action((opts) => run(() => leaderboardCommand(opts))());

cli
  .command('wallet')
  .description('Show wallet address and balances')
  .action(run(walletCommand));

cli
  .command('post-update')
  .description('Post a project update (burns HUNT)')
  .argument('<symbol>', 'Project token symbol')
  .argument('<link>', 'URL link for the update')
  .action((symbol, link) => run(() => postUpdateCommand(symbol, link))());

cli
  .command('vote')
  .description('Vote on a Co-op project')
  .argument('<symbol>', 'Project token symbol (e.g. ONCHAT, H1)')
  .argument('<amount>', 'Number of voting points to cast')
  .action((symbol, amount) => run(() => voteCommand(symbol, amount))());

cli
  .command('claimable')
  .description('Check claimable HUNT from voting rewards')
  .option('-p, --project <symbol>', 'Check specific project only')
  .action((opts) => run(() => claimableCommand(opts))());

cli
  .command('claim')
  .description('Claim HUNT tokens from voting rewards')
  .argument('<symbol>', 'Project token symbol')
  .option('--tokens <amount>', 'Amount of project tokens to mint (optional)')
  .option('--donation <bp>', 'Donation percentage in basis points (optional, 0-10000)')
  .action((symbol, opts) => run(() => claimCommand(symbol, opts))());

cli
  .command('royalty')
  .description('Check accumulated HUNT royalties')
  .action(run(royaltyCommand));

cli
  .command('claim-royalty')
  .description('Claim accumulated HUNT royalties')
  .action(run(claimRoyaltyCommand));

cli
  .command('create-project')
  .description('Create a new Co-op project')
  .requiredOption('--name <name>', 'Project name')
  .requiredOption('--symbol <symbol>', 'Token symbol (max 11 chars)')
  .requiredOption('--max-supply <amount>', 'Maximum token supply')
  .requiredOption('--mint-royalty <bp>', 'Mint royalty in basis points (0-10000)')
  .requiredOption('--burn-royalty <bp>', 'Burn royalty in basis points (0-10000)')
  .requiredOption('--steps <json>', 'Price steps JSON: {"ranges":["1000","5000"],"prices":["0.01","0.02"]}')
  .action((opts) => run(() => createProjectCommand(opts))());

cli
  .command('zap-mint')
  .description('Buy project tokens with ETH or USDC')
  .argument('<symbol>', 'Project token symbol')
  .argument('<amount>', 'Amount of project tokens to mint')
  .option('--from <token>', 'Source token: eth or usdc (default: eth)')
  .option('--slippage <pct>', 'Slippage tolerance percentage (default: 1.0)')
  .action((symbol, amount, opts) => run(() => zapMintCommand(symbol, amount, opts))());

cli.parse();
