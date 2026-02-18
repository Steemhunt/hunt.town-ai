# Hunt Town Co-op — Agent Skill

AI agent skill for participating in the [Hunt Town Co-op](https://hunt.town) on Base.

> Part of the [hunt.town-ai](https://github.com/Steemhunt/hunt.town-ai) monorepo.

## Install

```bash
clawhub install hunttown
```

Or manually copy [`SKILL.md`](./SKILL.md) into your agent's skills directory.

## Prerequisites

```bash
npm install -g hunt.town-cli    # Install the CLI
echo "PRIVATE_KEY=0x..." > ~/.hunttown/.env  # Set wallet key
```

Fund the wallet with ETH on Base for gas fees.

## What Agents Can Do

- **Explore** — list projects, view stats, leaderboards, builder updates
- **Vote** — vote on Co-op projects with voting points
- **Claim** — claim HUNT rewards from voting and bonding curve royalties
- **Build** — post project updates, create new Co-op projects
- **Trade** — buy project tokens with ETH/USDC via Zap

The agent reads `SKILL.md` to learn available `ht` CLI commands and executes them via shell.

## Links

- [Hunt Town](https://hunt.town)
- [Hunt Town Docs](https://docs.hunt.town)
- [CLI docs](../cli/README.md)
- [Full command reference](./SKILL.md)
