/**
 * Mintpad contract ABI - Full ABI from authoritative source
 */
export const MINTPAD_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'signerAddress', type: 'address' },
      {
        internalType: 'uint256',
        name: 'initialDailyHuntReward',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  { inputs: [], name: 'ECDSAInvalidSignature', type: 'error' },
  {
    inputs: [{ internalType: 'uint256', name: 'length', type: 'uint256' }],
    name: 'ECDSAInvalidSignatureLength',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 's', type: 'bytes32' }],
    name: 'ECDSAInvalidSignatureS',
    type: 'error',
  },
  { inputs: [], name: 'Mintpad__AlreadyActivated', type: 'error' },
  {
    inputs: [
      { internalType: 'uint256', name: 'actualHuntSpent', type: 'uint256' },
    ],
    name: 'Mintpad__ExcessiveLeftover',
    type: 'error',
  },
  { inputs: [], name: 'Mintpad__InsufficientVotingPoints', type: 'error' },
  {
    inputs: [{ internalType: 'string', name: 'param', type: 'string' }],
    name: 'Mintpad__InvalidParams',
    type: 'error',
  },
  { inputs: [], name: 'Mintpad__InvalidSignature', type: 'error' },
  { inputs: [], name: 'Mintpad__NothingToClaim', type: 'error' },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'OwnableInvalidOwner',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    name: 'SafeERC20FailedOperation',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      {
        indexed: true,
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'dayClaimedUpTo',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'actualHuntSpent',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'tokensMinted',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'donationBp',
        type: 'uint256',
      },
    ],
    name: 'Claimed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newDailyHuntReward',
        type: 'uint256',
      },
    ],
    name: 'DailyHuntRewardUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'newSignerAddress',
        type: 'address',
      },
    ],
    name: 'SignerAddressUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'day', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      {
        indexed: true,
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint32',
        name: 'voteAmount',
        type: 'uint32',
      },
    ],
    name: 'Voted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'day', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      {
        indexed: false,
        internalType: 'uint32',
        name: 'votingPoint',
        type: 'uint32',
      },
    ],
    name: 'VotingPointActivated',
    type: 'event',
  },
  {
    inputs: [],
    name: 'BOND',
    outputs: [
      { internalType: 'contract IMCV2_Bond', name: '', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'VOTE_EXPIRATION_DAYS',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint32', name: 'votingPoint', type: 'uint32' },
      { internalType: 'bytes', name: 'signature', type: 'bytes' },
    ],
    name: 'activateVotingPoint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'tokensToMint', type: 'uint256' },
      { internalType: 'uint256', name: 'donationBp', type: 'uint256' },
    ],
    name: 'claim',
    outputs: [
      { internalType: 'uint256', name: 'actualHuntSpent', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'dailyHuntReward',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'dailyStats',
    outputs: [
      { internalType: 'uint32', name: 'totalVotingPointGiven', type: 'uint32' },
      { internalType: 'uint32', name: 'totalVotingPointSpent', type: 'uint32' },
      { internalType: 'uint32', name: 'votingCount', type: 'uint32' },
      { internalType: 'uint32', name: 'claimCount', type: 'uint32' },
      { internalType: 'uint88', name: 'totalHuntClaimed', type: 'uint88' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'address', name: '', type: 'address' },
    ],
    name: 'dailyUserTokenVotes',
    outputs: [{ internalType: 'uint32', name: '', type: 'uint32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'address', name: '', type: 'address' },
    ],
    name: 'dailyUserVotingPoint',
    outputs: [
      { internalType: 'uint32', name: 'activated', type: 'uint32' },
      { internalType: 'uint32', name: 'left', type: 'uint32' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'user', type: 'address' },
      { internalType: 'address', name: 'token', type: 'address' },
    ],
    name: 'getClaimableHunt',
    outputs: [
      { internalType: 'uint256', name: 'totalHuntToClaim', type: 'uint256' },
      { internalType: 'uint256', name: 'endDay', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'user', type: 'address' },
      { internalType: 'address[]', name: 'tokens', type: 'address[]' },
    ],
    name: 'getClaimableHuntMultiple',
    outputs: [
      { internalType: 'uint256[]', name: 'huntAmounts', type: 'uint256[]' },
      { internalType: 'uint256[]', name: 'endDays', type: 'uint256[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCurrentDay',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'refundHUNT',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'newDailyHuntReward', type: 'uint256' },
    ],
    name: 'setDailyHuntReward',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'signer',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'newSignerAddress', type: 'address' },
    ],
    name: 'updateSignerAddress',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'address', name: '', type: 'address' },
    ],
    name: 'userTokenLastClaimDay',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint32', name: 'voteAmount', type: 'uint32' },
    ],
    name: 'vote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;