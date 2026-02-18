#!/usr/bin/env node
/**
 * Hunt Town Co-op MCP Server
 *
 * Exposes Hunt Town Co-op operations as MCP tools for AI assistants.
 * Delegates to the `ht` CLI for all operations (DRY — single source of truth).
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { execSync } from 'child_process';

// ── Helpers ─────────────────────────────────────────────────────────────

function runCli(args: string): string {
  try {
    return execSync(`ht ${args}`, { encoding: 'utf-8', timeout: 60000 }).trim();
  } catch (e: any) {
    return `Error: ${e.stderr?.trim() || e.message}`;
  }
}

// ── Tool definitions ────────────────────────────────────────────────────

const TOOLS = [
  // Read operations
  {
    name: 'projects',
    description: 'List all Hunt Town Co-op projects with reserve balance, price, and update count',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'project_info',
    description: 'Get detailed info for a Co-op project: price, supply, royalties, creator, recent updates',
    inputSchema: {
      type: 'object' as const,
      properties: { symbol: { type: 'string', description: 'Project token symbol (e.g. ONCHAT, H1, MT)' } },
      required: ['symbol'],
    },
  },
  {
    name: 'stats',
    description: 'Get Co-op overview: HUNT price, total projects, TVL, daily reward pool, voting activity',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'leaderboard',
    description: 'Top Co-op projects ranked by HUNT reserve (TVL)',
    inputSchema: {
      type: 'object' as const,
      properties: { limit: { type: 'string', description: 'Number of projects to show (default: 20)' } },
    },
  },
  {
    name: 'updates',
    description: 'Show recent builder updates across all projects or for a specific project',
    inputSchema: {
      type: 'object' as const,
      properties: { project: { type: 'string', description: 'Filter by project symbol (optional)' } },
    },
  },
  {
    name: 'wallet',
    description: 'Show wallet address and balances (ETH, HUNT, project tokens with USD values)',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'claimable',
    description: 'Check claimable HUNT from voting rewards for all projects or a specific one',
    inputSchema: {
      type: 'object' as const,
      properties: { project: { type: 'string', description: 'Filter by project symbol (optional)' } },
    },
  },
  {
    name: 'royalty',
    description: 'Check accumulated HUNT royalties from bonding curve trading fees',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  // Write operations
  {
    name: 'vote',
    description: 'Vote on a Co-op project using voting points',
    inputSchema: {
      type: 'object' as const,
      properties: {
        symbol: { type: 'string', description: 'Project token symbol' },
        amount: { type: 'string', description: 'Number of voting points to spend' },
      },
      required: ['symbol', 'amount'],
    },
  },
  {
    name: 'claim',
    description: 'Claim HUNT tokens from voting rewards',
    inputSchema: {
      type: 'object' as const,
      properties: {
        symbol: { type: 'string', description: 'Project token symbol' },
        tokens: { type: 'string', description: 'Amount of tokens to mint (optional)' },
        donation: { type: 'string', description: 'Donation in basis points, e.g. 500 = 5% (optional)' },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'claim_royalty',
    description: 'Claim accumulated HUNT royalties from the Bond contract',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'post_update',
    description: 'Post a project update on-chain (burns HUNT)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        symbol: { type: 'string', description: 'Project token symbol' },
        link: { type: 'string', description: 'URL link for the update' },
      },
      required: ['symbol', 'link'],
    },
  },
  {
    name: 'create_project',
    description: 'Create a new Co-op project with a bonding curve token',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Project name' },
        symbol: { type: 'string', description: 'Token symbol' },
        maxSupply: { type: 'string', description: 'Maximum token supply' },
        mintRoyalty: { type: 'string', description: 'Mint royalty in basis points (default: 100 = 1%)' },
        burnRoyalty: { type: 'string', description: 'Burn royalty in basis points (default: 100 = 1%)' },
        steps: { type: 'string', description: 'Bonding curve steps as JSON array of {range, price}' },
      },
      required: ['name', 'symbol', 'maxSupply', 'steps'],
    },
  },
  {
    name: 'zap_mint',
    description: 'Buy project tokens with ETH or USDC via Zap (auto-swaps via Uniswap V4)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        symbol: { type: 'string', description: 'Project token symbol to buy' },
        amount: { type: 'string', description: 'Amount of tokens to buy' },
        from: { type: 'string', description: 'Payment token: eth or usdc (default: eth)' },
        slippage: { type: 'string', description: 'Slippage tolerance % (default: 1)' },
      },
      required: ['symbol', 'amount'],
    },
  },
] as const;

// ── Request handlers ────────────────────────────────────────────────────

function createServer() {
  const s = new Server(
    { name: 'hunttown', version: '0.1.0' },
    { capabilities: { tools: {} } },
  );

  s.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [...TOOLS],
  }));

  s.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      let output: string;

      switch (name) {
        // Read
        case 'projects':
          output = runCli('projects');
          break;
        case 'project_info':
          output = runCli(`project ${args!.symbol}`);
          break;
        case 'stats':
          output = runCli('stats');
          break;
        case 'leaderboard':
          output = runCli(`leaderboard${args?.limit ? ` -n ${args.limit}` : ''}`);
          break;
        case 'updates':
          output = runCli(`updates${args?.project ? ` -p ${args.project}` : ''}`);
          break;
        case 'wallet':
          output = runCli('wallet');
          break;
        case 'claimable':
          output = runCli(`claimable${args?.project ? ` -p ${args.project}` : ''}`);
          break;
        case 'royalty':
          output = runCli('royalty');
          break;

        // Write
        case 'vote':
          output = runCli(`vote ${args!.symbol} ${args!.amount}`);
          break;
        case 'claim': {
          let cmd = `claim ${args!.symbol}`;
          if (args?.tokens) cmd += ` -t ${args.tokens}`;
          if (args?.donation) cmd += ` -d ${args.donation}`;
          output = runCli(cmd);
          break;
        }
        case 'claim_royalty':
          output = runCli('claim-royalty');
          break;
        case 'post_update':
          output = runCli(`post-update ${args!.symbol} ${args!.link}`);
          break;
        case 'create_project': {
          let cmd = `create-project --name "${args!.name}" --symbol ${args!.symbol} --max-supply ${args!.maxSupply} --steps '${args!.steps}'`;
          if (args?.mintRoyalty) cmd += ` --mint-royalty ${args.mintRoyalty}`;
          if (args?.burnRoyalty) cmd += ` --burn-royalty ${args.burnRoyalty}`;
          output = runCli(cmd);
          break;
        }
        case 'zap_mint': {
          let cmd = `zap-mint ${args!.symbol} ${args!.amount}`;
          if (args?.from) cmd += ` --from ${args.from}`;
          if (args?.slippage) cmd += ` --slippage ${args.slippage}`;
          output = runCli(cmd);
          break;
        }
        default:
          return { content: [{ type: 'text' as const, text: `Unknown tool: ${name}` }], isError: true };
      }

      return { content: [{ type: 'text' as const, text: output }] };
    } catch (e: any) {
      return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
    }
  });

  return s;
}

// ── Sandbox (for scanning tools like Smithery) ──────────────────────────

export function createSandboxServer() {
  return createServer();
}

// ── Start ───────────────────────────────────────────────────────────────

async function main() {
  const s = createServer();
  const transport = new StdioServerTransport();
  await s.connect(transport);
  console.error('Hunt Town MCP server running on stdio');
}

if (!process.env.SMITHERY_SCAN) {
  main().catch(console.error);
}
