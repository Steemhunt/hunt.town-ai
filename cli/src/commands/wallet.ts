/**
 * Show wallet information and HUNT balance
 */
import { getWalletAddress, loadEnvConfig } from '../utils/wallet';

/**
 * Execute wallet command
 */
export async function walletCommand(): Promise<void> {
  loadEnvConfig();
  
  console.log('Hunt Town Wallet');
  console.log('================\n');

  try {
    // Get wallet address from private key
    const walletAddress = getWalletAddress();
    
    if (!walletAddress) {
      console.log('No wallet configured.');
      console.log('Set PRIVATE_KEY in ~/.hunttown/.env or local .env file to view wallet information.');
      console.log('\nExample ~/.hunttown/.env:');
      console.log('PRIVATE_KEY=your_wallet_private_key_here');
      return;
    }

    console.log(`Address:        ${walletAddress}`);
    console.log(`HUNT Balance:   TBD (requires contract integration)`);
    
    console.log('\n✅ Wallet loaded successfully.');
    console.log('   Contract integration needed for balance and write operations.');

  } catch (error) {
    console.error('Error fetching wallet information:', error);
    process.exit(1);
  }
}