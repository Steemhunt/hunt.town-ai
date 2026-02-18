# Hunt Town Co-op — Agent Skill

Interact with the Hunt Town Co-op on Base using the `ht` CLI.

## Setup

```bash
npm install -g hunt.town-cli
```

Set your private key for write operations:
```bash
echo "PRIVATE_KEY=0x..." > ~/.hunttown/.env
```

## Commands

### Read Operations (no key needed)

```bash
ht projects                          # List all Co-op projects (symbol, reserve, price)
ht project <symbol>                  # Detailed project info (price, supply, royalties, updates)
ht stats                             # Co-op overview (HUNT price, TVL, daily rewards, voting activity)
ht leaderboard                       # Top projects ranked by HUNT reserve (TVL)
ht leaderboard -n 10                 # Show top 10 only
ht updates                           # Recent builder updates across all projects
ht updates -p <symbol>               # Updates for a specific project
ht wallet                            # Wallet balances (ETH, HUNT, project tokens, USD values)
ht claimable                         # Check claimable HUNT from voting (all projects)
ht claimable -p <symbol>             # Check claimable for a specific project
ht royalty                           # Check accumulated HUNT royalties from bonding curves
```

### Write Operations (requires PRIVATE_KEY)

```bash
# Voting & Rewards
ht vote <symbol> <amount>            # Vote on a Co-op project (uses voting points)
ht claim <symbol>                    # Claim HUNT tokens from voting rewards
ht claim <symbol> -t <amount>        # Claim with specific token mint amount
ht claim <symbol> -d <bp>            # Claim with donation (basis points, e.g. 500 = 5%)
ht claim-royalty                     # Claim accumulated HUNT royalties from Bond contract

# Builder Operations
ht post-update <symbol> <link>       # Post a project update (burns HUNT)

# Project Creation
ht create-project --name "My Project" --symbol MYP --max-supply 1000000 \
  --mint-royalty 100 --burn-royalty 100 --steps '[{"range":"500000","price":"0.001"},{"range":"1000000","price":"0.01"}]'

# Buy tokens with ETH or USDC via Zap
ht zap-mint <symbol> <amount>                # Buy tokens with ETH (default)
ht zap-mint <symbol> <amount> --from usdc    # Buy tokens with USDC
ht zap-mint <symbol> <amount> --slippage 2   # Custom slippage tolerance (%)
```

## Token Resolution

Use project symbols directly: `H1`, `ONCHAT`, `SIGNET`, `MT`, `HUNT`, etc.

## Environment

| Variable | Description |
|----------|-------------|
| `PRIVATE_KEY` | Wallet private key (stored in `~/.hunttown/.env`) |
| `RPC_URL` | Custom Base RPC endpoint (optional, uses public RPCs by default) |

## Notes

- All operations are on **Base** (chain 8453)
- HUNT is the reserve token for all Co-op projects
- Voting requires activated voting points (daily allocation via Hunt Town app)
- Project updates burn HUNT tokens (cost shown before confirming)
- Write operations prompt for confirmation before executing
- Zap operations default to 1% slippage
- Community: https://hunt.town
