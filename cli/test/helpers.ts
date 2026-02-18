import { type Address } from 'viem';

// Well-known Hunt Town token addresses
export const HUNT: Address = '0x37f0c2915CeCC7e977183B8543Fc0864d03E064C';
export const USDC: Address = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
export const WETH: Address = '0x4200000000000000000000000000000000000006';
export const H1: Address = '0xa2Ec1288FA84C53Aaa37200a928a486CCE4a4afb';
export const MT: Address = '0xFf45161474C39cB00699070Dd49582e417b57a7E';
export const ONCHAT: Address = '0xD8F76e1e31a85bE129155d8CF699D3056f9DA301';
export const SIGNET: Address = '0xDF2B673Ec06d210C8A8Be89441F8de60B5C679c9';

// Contract addresses
export const BOND: Address = '0xc5a076cad94176c2996B32d8466Be1cE757FAa27';
export const MINTPAD: Address = '0xfb51D2120c27bB56D91221042cb2dd2866a647fE';
export const PROJECT_UPDATES: Address = '0xdD066121E4488edB73c4Ff7f461592c084e4303A';
export const SPOT_PRICE_AGGREGATOR: Address = '0x00000000000D6FFc74A8feb35aF5827bf57f6786';

// Spot price ABI for direct testing
export const SPOT_ABI = [{
  type: 'function', name: 'getRate', stateMutability: 'view',
  inputs: [
    { name: 'srcToken', type: 'address' },
    { name: 'dstToken', type: 'address' },
    { name: 'useWrappers', type: 'bool' },
  ],
  outputs: [{ name: 'weightedRate', type: 'uint256' }],
}] as const;

// RPCs for test transport
export const BASE_RPCS = [
  'https://base-rpc.publicnode.com',
  'https://mainnet.base.org',
  'https://base-mainnet.public.blastapi.io',
  'https://base.meowrpc.com',
  'https://1rpc.io/base',
  'https://base.drpc.org',
  'https://base.llamarpc.com',
];