/**
 * MCV2_Bond contract ABI - Bonding curve mechanics for Hunt Town projects
 */
export const BOND_ABI = [
  {
    inputs: [{ name: "token", type: "address" }],
    name: "tokenBond",
    outputs: [
      { name: "creator", type: "address" },
      { name: "mintRoyalty", type: "uint16" },
      { name: "burnRoyalty", type: "uint16" },
      { name: "createdAt", type: "uint40" },
      { name: "reserveToken", type: "address" },
      { name: "reserveBalance", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "token", type: "address" }],
    name: "priceForNextMint",
    outputs: [{ name: "", type: "uint128" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "token", type: "address" }],
    name: "exists",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "token", type: "address" }],
    name: "maxSupply",
    outputs: [{ name: "", type: "uint128" }],
    stateMutability: "view",
    type: "function"
  }
] as const;