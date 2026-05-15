<p align="center">
  <img src="https://hunt.town/logo-256.png" alt="Hunt Town" width="80" />
</p>

<h1 align="center">Hunt Town Co-op — MCP Server</h1>

<p align="center">
  <a href="https://modelcontextprotocol.io">Model Context Protocol</a> server for the <a href="https://hunt.town">Hunt Town Co-op</a> on Base — enables AI assistants to interact with the co-op through standardized tool calls.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/hunttown-mcp"><img src="https://img.shields.io/npm/v/hunttown-mcp.svg?style=flat-square&label=npm" alt="npm" /></a>
  <a href="https://www.npmjs.com/package/hunttown-mcp"><img src="https://img.shields.io/npm/dm/hunttown-mcp.svg?style=flat-square&label=downloads" alt="downloads" /></a>
  <a href="https://packagephobia.com/result?p=hunttown-mcp"><img src="https://packagephobia.com/badge?p=hunttown-mcp" alt="install size" /></a>
  <a href="https://github.com/Steemhunt/hunt.town-ai"><img src="https://img.shields.io/github/stars/Steemhunt/hunt.town-ai?style=flat-square&logo=github" alt="GitHub" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="MIT" /></a>
</p>

<p align="center">
  Part of the <a href="https://github.com/Steemhunt/hunt.town-ai">hunt.town-ai</a> monorepo.
</p>

---

## Install

```bash
npm install -g hunttown-mcp hunt.town-cli
```

The MCP server delegates to the `ht` CLI — both must be installed.

## Configure

Add to your MCP client config (e.g. Claude Desktop `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "hunttown": {
      "command": "hunttown-mcp"
    }
  }
}
```

For wallet operations, set your private key:

```bash
echo "PRIVATE_KEY=0x..." > ~/.hunttown/.env
```

## Available Tools

### Read (no key needed)

| Tool | Description |
|------|-------------|
| `projects` | List all Co-op projects |
| `project_info` | Detailed project info (price, supply, royalties) |
| `stats` | Co-op overview (HUNT price, TVL, daily rewards) |
| `leaderboard` | Top projects by HUNT reserve |
| `updates` | Recent builder updates |
| `wallet` | Wallet balances (ETH, HUNT, project tokens) |
| `claimable` | Check claimable HUNT from voting |
| `royalty` | Check accumulated bonding curve royalties |

### Write (requires PRIVATE_KEY)

| Tool | Description |
|------|-------------|
| `vote` | Vote on a Co-op project |
| `claim` | Claim HUNT from voting rewards |
| `claim_royalty` | Claim bonding curve royalties |
| `post_update` | Post a project update (burns HUNT) |
| `create_project` | Create a new Co-op project |
| `zap_mint` | Buy project tokens with ETH/USDC |

## Links

- [Hunt Town](https://hunt.town)
- [Hunt Town Docs](https://docs.hunt.town)
- [CLI docs](../cli/README.md)
- [Agent Skill](../agent-skills/SKILL.md)
