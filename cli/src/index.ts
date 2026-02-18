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

// Load env from ~/.hunttown/.env and local .env
config({ path: resolve(homedir(), '.hunttown', '.env') });
config();

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

cli.parse();
