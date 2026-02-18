/**
 * 1inch Spot Price aggregator ABI
 */
export const SPOT_PRICE_ABI = [
  {
    inputs: [
      { name: "srcToken", type: "address" },
      { name: "dstToken", type: "address" },
      { name: "useWrappers", type: "bool" }
    ],
    name: "getRate",
    outputs: [{ name: "weightedRate", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;