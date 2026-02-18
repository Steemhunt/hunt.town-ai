/**
 * Mintpad contract ABI - Daily rewards and stats for Hunt Town Co-op
 */
export const MINTPAD_ABI = [
  {
    inputs: [],
    name: "getCurrentDay",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "dailyHuntReward",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "dailyStats",
    outputs: [
      { name: "totalVotingPointGiven", type: "uint32" },
      { name: "totalVotingPointSpent", type: "uint32" },
      { name: "votingCount", type: "uint32" },
      { name: "claimCount", type: "uint32" },
      { name: "totalHuntClaimed", type: "uint88" }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;