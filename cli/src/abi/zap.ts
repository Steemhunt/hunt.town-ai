/**
 * ZapUniV4MCV2 contract ABI - Full ABI from authoritative source
 */
export const ZAP_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'fromToken', type: 'address' },
      { internalType: 'address', name: 'huntChildToken', type: 'address' },
      { internalType: 'uint256', name: 'huntChildAmount', type: 'uint256' },
      { internalType: 'uint256', name: 'maxFromTokenAmount', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [
      { internalType: 'uint256', name: 'fromTokenUsed', type: 'uint256' },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'fromToken', type: 'address' },
      { internalType: 'address', name: 'huntChildToken', type: 'address' },
      { internalType: 'uint256', name: 'fromTokenAmount', type: 'uint256' },
      { internalType: 'uint256', name: 'minHuntChildAmount', type: 'uint256' },
    ],
    name: 'mintReverse',
    outputs: [
      { internalType: 'uint256', name: 'huntChildAmount', type: 'uint256' },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'fromToken', type: 'address' },
      { internalType: 'address', name: 'huntChildToken', type: 'address' },
      { internalType: 'uint256', name: 'huntChildAmount', type: 'uint256' },
    ],
    name: 'estimateMint',
    outputs: [
      { internalType: 'uint256', name: 'fromTokenAmount', type: 'uint256' },
      { internalType: 'uint256', name: 'totalHuntRequired', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'fromToken', type: 'address' },
      { internalType: 'address', name: 'huntChildToken', type: 'address' },
      { internalType: 'uint256', name: 'fromTokenAmount', type: 'uint256' },
    ],
    name: 'estimateMintReverse',
    outputs: [
      { internalType: 'uint256', name: 'huntChildAmount', type: 'uint256' },
      { internalType: 'uint256', name: 'huntAmount', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  { inputs: [], name: 'ZapUniV4MCV2__UnsupportedToken', type: 'error' },
  { inputs: [], name: 'ZapUniV4MCV2__InvalidAmount', type: 'error' },
  { inputs: [], name: 'ZapUniV4MCV2__SlippageExceeded', type: 'error' },
  { inputs: [], name: 'ZapUniV4MCV2__InsufficientHUNTReceived', type: 'error' },
  { inputs: [], name: 'ZapUniV4MCV2__InvalidETHAmount', type: 'error' },
] as const;