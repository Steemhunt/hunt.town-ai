/**
 * List all Hunt Town Co-op projects
 */
import { fetchProjects, type TokenData } from '../utils/api';
import { formatNumber } from '../utils/format';

/**
 * Execute projects command
 */
export async function projectsCommand(): Promise<void> {
  console.log('Hunt Town Co-op Projects');
  console.log('========================\n');
  
  try {
    const response = await fetchProjects();
    const projects = response.tokens;
    
    if (projects.length === 0) {
      console.log('No projects found.');
      return;
    }
    
    // Display table header
    console.log(' #  Symbol     Reserve (HUNT)    Updates');
    console.log('--- --------   ---------------   -------');
    
    // Display projects
    projects.forEach((project, index) => {
      const num = (index + 1).toString().padStart(2, ' ');
      const symbol = project.symbol.padEnd(8, ' ');
      const reserve = formatNumber(project.reserveBalance || 0).padStart(13, ' ');
      const updates = '0'; // TODO: Get actual update count
      
      console.log(`${num}  ${symbol}   ${reserve}        ${updates}`);
    });
    
    // Display summary
    const totalReserve = projects.reduce((sum, p) => sum + (p.reserveBalance || 0), 0);
    console.log('');
    console.log(`Total: ${projects.length} projects | ${formatNumber(totalReserve)} HUNT locked`);
    
  } catch (error) {
    console.error('Error fetching projects:', error);
    process.exit(1);
  }
}