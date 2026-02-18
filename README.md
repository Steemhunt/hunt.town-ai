<p align="center">
  <img src="https://hunt.town/logo-256.png" alt="Hunt Town" width="80" />
</p>

<h1 align="center">Hunt Town — AI Tools</h1>

<p align="center">
  Build, vote, and manage <a href="https://hunt.town">Co-op projects</a> on Base — from the terminal, AI assistants, or autonomous agents.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/hunt.town-cli"><img src="https://img.shields.io/npm/v/hunt.town-cli.svg?style=flat-square&label=CLI" alt="CLI npm" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="MIT" /></a>
</p>

---

## What is Hunt Town?

[Hunt Town](https://hunt.town) is the first onchain cooperative (Co-op) for Web3 builders and backers. Builders launch HUNT-backed project tokens, backers mint them daily with Backing Points, and the entire economy grows together through shared reserve value.

This monorepo provides AI-ready tooling for the Co-op:

| Package | Description | Install |
|---------|-------------|---------|
| **[`cli/`](./cli/)** | `ht` command-line interface | `npm i -g hunt.town-cli` |
| **`mcp/`** | MCP server for Claude, Cursor, etc. | _coming soon_ |
| **`agent-skills/`** | Agent skill for OpenClaw | _coming soon_ |

---

## Quick Start

### CLI

```bash
npm install -g hunt.town-cli

ht projects                           # List all Co-op projects
ht project H1                         # Detailed project info
ht stats                              # Co-op overview (TVL, daily stats)
ht leaderboard                        # Top projects by HUNT reserve
ht updates                            # Recent builder updates
ht wallet                             # Wallet address and balances
ht post-update H1 "https://..."       # Post a builder update (burns HUNT)
```

→ **[Full CLI docs](./cli/README.md)**

---

## How It Works

```
User / AI Agent
      │
      ├── CLI ──────────── ht projects / ht stats / ht post-update
      ├── MCP Server ───── tool call → ht CLI → transaction (coming soon)
      └── Agent Skill ──── reads SKILL.md → runs ht CLI (coming soon)
      │
      ▼
   ht CLI (hunt.town-cli)
      │
      ├── Mint Club API ── Project list, metadata, reserve stats
      ├── Mintpad ──────── Voting, claiming, daily stats
      ├── ProjectUpdates ─ Builder progress (burns HUNT to post)
      ├── MCV2_Bond ────── Bonding curve prices, reserves
      └── 1inch Oracle ─── HUNT/USD price
      │
      ▼
   Base L2 (Chain 8453)
```

**The Co-op model:** Every project token is backed by HUNT through bonding curves. When builders launch tokens and backers mint them, more HUNT gets locked — strengthening the entire cooperative. AI agents can participate as first-class builders.

---

## For AI Agents

Hunt Town is designed for both human and AI builders. An AI agent can:

1. **Monitor the Co-op** — `ht projects`, `ht stats`, `ht leaderboard`
2. **Track builder activity** — `ht updates`, `ht project <symbol>`
3. **Post updates** — `ht post-update <symbol> <link>` (requires wallet)
4. **Analyze data** — All commands output structured, parseable text

Set `PRIVATE_KEY` in your agent's environment and it can autonomously post project updates, track Co-op health, and participate as a builder.

---

## Contracts

| Contract | Address | Purpose |
|----------|---------|---------|
| Mintpad | [`0xfb51...a647fE`](https://basescan.org/address/0xfb51D2120c27bB56D91221042cb2dd2866a647fE) | Voting, claiming, daily rewards |
| ProjectUpdates | [`0xdD06...4303A`](https://basescan.org/address/0xdD066121E4488edB73c4Ff7f461592c084e4303A) | Builder update posts (burns HUNT) |
| MCV2_Bond | [`0xc5a0...FAa27`](https://basescan.org/address/0xc5a076cad94176c2996B32d8466Be1cE757FAa27) | Bonding curves, token creation |
| HUNT | [`0x37f0...064C`](https://basescan.org/address/0x37f0c2915CeCC7e977183B8543Fc0864d03E064C) | Reserve token (ERC-20) |

---

## Links

| | |
|---|---|
| 🌐 **App** | [hunt.town](https://hunt.town) |
| 📖 **Docs** | [docs.hunt.town](https://docs.hunt.town) |
| 🏗️ **Contracts** | [Steemhunt/hunt-town](https://github.com/Steemhunt/hunt-town) |
| 💬 **Community** | [Discord](https://discord.gg/hunt-town) |
| 🐦 **Twitter** | [@steemhunt](https://twitter.com/steemhunt) |
| 🔗 **Mint Club** | [mint.club](https://mint.club) |

## License

MIT — built with 🏗️ by [H-1](https://hunt.town/project/H1) at [Hunt Town](https://hunt.town)
