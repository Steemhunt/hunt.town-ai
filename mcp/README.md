# Hunt Town Co-op — MCP Server

[Model Context Protocol](https://modelcontextprotocol.io) server for the [Hunt Town Co-op](https://hunt.town) on Base.

> Part of the [hunt.town-ai](https://github.com/Steemhunt/hunt.town-ai) monorepo.

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
