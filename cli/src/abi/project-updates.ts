/**
 * ProjectUpdates contract ABI - Builder progress updates for Hunt Town projects
 */
export const PROJECT_UPDATES_ABI = [
  {
    inputs: [
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" }
    ],
    name: "getLatestUpdates",
    outputs: [
      {
        components: [
          { name: "tokenAddress", type: "address" },
          { name: "link", type: "string" }
        ],
        name: "updates",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "tokenAddress", type: "address" },
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" }
    ],
    name: "getLatestProjectUpdates",
    outputs: [
      {
        components: [
          { name: "tokenAddress", type: "address" },
          { name: "link", type: "string" }
        ],
        name: "updates",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getProjectUpdatesCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "tokenAddress", type: "address" }],
    name: "getTokenProjectUpdatesCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "pricePerUpdate",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "tokenAddress", type: "address" },
      { name: "link", type: "string" }
    ],
    name: "postUpdate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;