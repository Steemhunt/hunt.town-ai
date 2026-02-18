/**
 * MCV2_Bond contract ABI - Full ABI from authoritative source
 */
export const BOND_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    name: 'tokenBond',
    outputs: [
      { internalType: 'address', name: 'creator', type: 'address' },
      { internalType: 'uint16', name: 'mintRoyalty', type: 'uint16' },
      { internalType: 'uint16', name: 'burnRoyalty', type: 'uint16' },
      { internalType: 'uint40', name: 'createdAt', type: 'uint40' },
      { internalType: 'address', name: 'reserveToken', type: 'address' },
      { internalType: 'uint256', name: 'reserveBalance', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    name: 'priceForNextMint',
    outputs: [{ internalType: 'uint128', name: '', type: 'uint128' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    name: 'exists',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    name: 'maxSupply',
    outputs: [{ internalType: 'uint128', name: '', type: 'uint128' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'creationFee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'symbol', type: 'string' },
        ],
        internalType: 'struct MCV2_Bond.TokenParams',
        name: 'tp',
        type: 'tuple',
      },
      {
        components: [
          { internalType: 'uint16', name: 'mintRoyalty', type: 'uint16' },
          { internalType: 'uint16', name: 'burnRoyalty', type: 'uint16' },
          { internalType: 'address', name: 'reserveToken', type: 'address' },
          { internalType: 'uint128', name: 'maxSupply', type: 'uint128' },
          { internalType: 'uint128[]', name: 'stepRanges', type: 'uint128[]' },
          { internalType: 'uint128[]', name: 'stepPrices', type: 'uint128[]' },
        ],
        internalType: 'struct MCV2_Bond.BondParams',
        name: 'bp',
        type: 'tuple',
      },
    ],
    name: 'createToken',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'tokensToMint', type: 'uint256' },
      { internalType: 'uint256', name: 'maxReserveAmount', type: 'uint256' },
      { internalType: 'address', name: 'receiver', type: 'address' },
    ],
    name: 'mint',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'tokensToMint', type: 'uint256' },
    ],
    name: 'getReserveForToken',
    outputs: [
      { internalType: 'uint256', name: 'reserveAmount', type: 'uint256' },
      { internalType: 'uint256', name: 'royalty', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'wallet', type: 'address' },
      { internalType: 'address', name: 'reserveToken', type: 'address' },
    ],
    name: 'getRoyaltyInfo',
    outputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'reserveToken', type: 'address' },
    ],
    name: 'claimRoyalties',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;