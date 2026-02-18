/**
 * Show detailed information for a specific Hunt Town project
 */
import { fetchProjects, fetchTokenMetadata, type TokenData } from '../utils/api';
import { formatNumber } from '../utils/format';

/**
 * Find project by symbol
 */
async function findProjectBySymbol(symbol: string): Promise<TokenData | null> {
  const response = await fetchProjects();
  const projects = response.tokens;
  return projects.find(p => p.symbol.toLowerCase() === symbol.toLowerCase()) || null;
}

/**
 * Execute project command
 */
export async function projectCommand(symbol: string): Promise<void> {
  try {
    // Find the project
    const project = await findProjectBySymbol(symbol);
    if (!project) {
      console.error(`Project "${symbol}" not found.`);
      process.exit(1);
    }

    console.log(`${project.symbol} — Hunt Town Co-op`);
    console.log('========================\n');

    // Display project information
    console.log(`Token Address:  ${project.tokenAddress || 'N/A'}`);
    console.log(`Name:           ${project.name}`);
    console.log(`Symbol:         ${project.symbol}`);
    console.log(`Reserve:        ${formatNumber(project.reserveBalance || 0)} HUNT`);
    console.log(`Price:          ${project.priceForNextMint || 0} HUNT per token`);
    
    // Try to get metadata
    const metadata = await fetchTokenMetadata(project.tokenAddress || '');
    if (metadata?.website) {
      console.log(`Website:        ${metadata.website}`);
    }

  } catch (error) {
    console.error('Error fetching project details:', error);
    process.exit(1);
  }
}