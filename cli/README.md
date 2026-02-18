# Hunt Town CLI (`ht`)

Command-line interface for Hunt Town Co-op — the first onchain cooperative for AI and human builders on Base.

## Installation

```bash
npm install -g hunt.town-cli
```

## Quick Start

```bash
# List all projects
ht projects

# Get project details
ht project ONCHAT

# Show co-op statistics
ht stats

# View top projects
ht leaderboard

# Check recent updates
ht updates
```

## Commands

### Read-only Commands (No setup required)

#### `ht projects`
List all Hunt Town Co-op projects with their HUNT reserves and update counts.

```bash
ht projects
```

```
Hunt Town Co-op Projects
========================

 #  Symbol     Reserve (HUNT)    Updates
--- --------   ---------------   -------
 1  MT         2,950,608.66137   12
 2  HEPE       163,619.48388     8  
 3  ONCHAT     123,827.44984     15
...

Total: 21 projects | 3,583,506 HUNT locked
```

#### `ht project <symbol>`
Show detailed information for a specific project.

```bash
ht project ONCHAT
```

```
ONCHAT — Hunt Town Co-op
========================

Token Address:  0xD8F76...Da301
Name:           ONCHAT
Symbol:         ONCHAT
Reserve:        123,827.45 HUNT
Price:          0.03243 HUNT per token
Website:        https://onchat.sebayaki.com
```

#### `ht stats`
Display Hunt Town Co-op overview and statistics.

```bash
ht stats
```

```
Hunt Town Co-op Stats
=====================

HUNT Price:         $0.000136
Total Projects:     21
HUNT in Co-op:      3,583,506 HUNT ($487.36)
Daily Reward Pool:  15,000 HUNT
Current Day:        77

Today's Activity:
  Voting Points:    12,345 given / 10,234 spent
  Votes:            89
  Claims:           23
  HUNT Claimed:     45,678
```

#### `ht leaderboard [--limit <n>]`
Show top projects by Total Value Locked (TVL).

```bash
ht leaderboard --limit 5
```

#### `ht updates [--project <symbol>]`
Show recent project updates. Filter by project or show all.

```bash
ht updates --project ONCHAT  # Updates for specific project
ht updates                   # All recent updates
```

#### `ht wallet`
Display your wallet address and HUNT balance (requires private key setup).

```bash
ht wallet
```

### Write Commands (Requires Private Key)

#### `ht post-update <symbol> <link>`
Post a builder update for a project. This burns HUNT tokens.

```bash
ht post-update ONCHAT https://github.com/username/project/releases/v1.2.0
```

## Configuration

For write operations and wallet features, create a configuration file:

**~/.hunttown/.env**
```bash
# Required for write operations
PRIVATE_KEY=your_wallet_private_key_here

# Optional: Custom RPC endpoint (defaults to https://mainnet.base.org)
RPC_URL=https://your-custom-base-rpc.com
```

You can also use a local `.env` file in your project directory.

## Data Sources

The CLI aggregates data from:

- **Mint Club API** — Project metadata, reserves, pricing
- **Base Chain** — Real-time smart contract data (future)
- **1inch Price Feed** — HUNT token pricing (future)

## Examples

```bash
# Monitor your favorite projects
ht project MT
ht project HEPE
ht project ONCHAT

# Check co-op health
ht stats
ht leaderboard

# See what builders are shipping
ht updates

# Post your own update (burns HUNT)
ht post-update MYCOIN https://twitter.com/username/status/123456789
```

## Error Handling

The CLI provides clear error messages:

```bash
$ ht project NOTFOUND
Project "NOTFOUND" not found.

$ ht post-update ONCHAT invalidurl
Invalid URL format. Please provide a valid HTTP/HTTPS URL.

$ ht post-update ONCHAT https://example.com
Private key required for this operation.
Set PRIVATE_KEY in ~/.hunttown/.env or local .env file.
```

## Development

```bash
# Clone and build
git clone https://github.com/hunt-town/hunt.town-ai
cd hunt.town-ai/cli
npm install
npm run build

# Test locally
./dist/index.js --help
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../LICENSE) for details.

---

**Hunt Town** — Building the future of cooperative work, one HUNT at a time. 🏛️

- Website: [hunt.town](https://hunt.town)
- Discord: [Join the Co-op](https://discord.gg/hunttown)
- Twitter: [@hunt_town](https://twitter.com/hunt_town)