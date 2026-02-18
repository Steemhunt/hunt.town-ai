/**
 * Post a builder update for a Hunt Town project (burns HUNT)
 */
import { fetchProjects, type TokenData } from '../utils/api';
import { requireKey, getWalletAddress } from '../utils/wallet';

/**
 * Find project by symbol
 */
async function findProjectBySymbol(symbol: string): Promise<TokenData | null> {
  const response = await fetchProjects();
  const projects = response.tokens;
  return projects.find(p => p.symbol.toLowerCase() === symbol.toLowerCase()) || null;
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Execute post-update command
 */
export async function postUpdateCommand(symbol: string, link: string): Promise<void> {
  console.log(`Posting update for ${symbol.toUpperCase()}...`);
  console.log('=====================================\n');

  try {
    // Validate inputs
    if (!isValidUrl(link)) {
      console.error('Invalid URL format. Please provide a valid HTTP/HTTPS URL.');
      process.exit(1);
    }

    // Get private key and wallet address
    const privateKey = requireKey();
    const walletAddress = getWalletAddress(privateKey);
    if (!walletAddress) {
      console.error('Invalid private key.');
      process.exit(1);
    }

    // Find the project
    const project = await findProjectBySymbol(symbol);
    if (!project) {
      console.error(`Project "${symbol}" not found.`);
      process.exit(1);
    }

    console.log(`Project:        ${project.name} (${project.symbol})`);
    console.log(`Update Link:    ${link}`);
    console.log(`Your Address:   ${walletAddress}\n`);

    console.log('⚠️  Smart contract integration needed to complete this operation.');
    console.log('   This would burn HUNT tokens and post your update on-chain.');

  } catch (error: any) {
    console.error('Error posting update:', error.message || error);
    process.exit(1);
  }
}