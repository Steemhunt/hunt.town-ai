<p align="center">
  <img src="https://hunt.town/images/logo.svg" width="80" alt="Hunt Town" />
</p>

<h1 align="center">hunt.town-ai</h1>

<p align="center">
  AI-friendly tools for <a href="https://hunt.town">Hunt Town</a> — the first onchain cooperative on Base
</p>

<p align="center">
  <a href="./cli">CLI</a> ·
  <a href="./mcp">MCP Server</a> ·
  <a href="./agent-skills">Agent Skill</a>
</p>

---

## What is Hunt Town?

Hunt Town is the first onchain cooperative (Co-op) model for Web3 builders and backers. Builders launch project tokens backed by HUNT (the reserve token) via bonding curves, backers mint them daily with Backing Points. Everything is connected through HUNT on Base.

- **Docs**: https://docs.hunt.town
- **App**: https://hunt.town

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [`cli/`](./cli) | `ht` command-line tool — 14 commands for full Co-op participation | `hunt.town-cli` |
| [`mcp/`](./mcp) | MCP server — exposes Co-op tools to AI assistants (Claude, Cursor, etc.) | `hunttown-mcp` |
| [`agent-skills/`](./agent-skills) | Agent skill file — teach any AI agent to use the `ht` CLI | — |

## Quick Start

```bash
# Install the CLI
npm install -g hunt.town-cli

# Explore the Co-op
ht projects          # List all projects
ht stats             # Co-op overview
ht project ONCHAT    # Detailed project info

# Set up wallet for write operations
mkdir -p ~/.hunttown
echo "PRIVATE_KEY=0x..." > ~/.hunttown/.env

# Participate
ht vote ONCHAT 10    # Vote on a project
ht claimable         # Check voting rewards
ht claim ONCHAT      # Claim rewards
ht royalty           # Check bonding curve royalties
```

## CLI Commands

### Read

| Command | Description |
|---------|-------------|
| `ht projects` | List all Co-op projects |
| `ht project <symbol>` | Detailed project info |
| `ht stats` | Co-op overview (HUNT price, TVL, daily rewards) |
| `ht leaderboard` | Top projects by HUNT reserve |
| `ht updates` | Recent builder updates |
| `ht wallet` | Wallet balances |
| `ht claimable` | Claimable HUNT from voting |
| `ht royalty` | Accumulated bonding curve royalties |

### Write

| Command | Description |
|---------|-------------|
| `ht vote <symbol> <amount>` | Vote on a project |
| `ht claim <symbol>` | Claim voting rewards |
| `ht claim-royalty` | Claim bonding curve royalties |
| `ht post-update <symbol> <link>` | Post a builder update (burns HUNT) |
| `ht create-project` | Create a new Co-op project |
| `ht zap-mint <symbol> <amount>` | Buy tokens with ETH/USDC |

## MCP Server

```bash
npm install -g hunttown-mcp hunt.town-cli
```

Add to your MCP client config:

```json
{
  "mcpServers": {
    "hunttown": {
      "command": "hunttown-mcp"
    }
  }
}
```

## Agent Skill

For [OpenClaw](https://openclaw.ai) / [ClawHub](https://clawhub.com) agents:

```bash
clawhub install hunttown
```

Or copy [`agent-skills/SKILL.md`](./agent-skills/SKILL.md) into your agent's skills directory.

## Architecture

```
hunt.town-ai/
├── cli/              # Core CLI (ht) — all logic lives here
├── mcp/              # MCP server — thin wrapper, delegates to CLI
├── agent-skills/     # SKILL.md — teaches agents to use the CLI
└── README.md
```

The MCP server and agent skill both delegate to the `ht` CLI. No code duplication — single source of truth.

## Contracts

All on **Base** (chain 8453):

| Contract | Address |
|----------|---------|
| HUNT Token | `0x37f0c2915CeCC7e977183B8543Fc0864d03E064C` |
| MCV2_Bond | `0xc5a076cad94176c2996B32d8466Be1cE757FAa27` |
| Mintpad | `0xfb51D2120c27bB56D91221042cb2dd2866a647fE` |
| ProjectUpdates | `0xdD066121E4488edB73c4Ff7f461592c084e4303A` |
| ZapUniV4MCV2 | `0xa2e7BcA51A84Ed635909a8E845d5f66602742A75` |

## License

MIT
