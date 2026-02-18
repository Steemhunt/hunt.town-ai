/**
 * Show Hunt Town Co-op statistics and overview
 */
import { fetchProjects, fetchReserveStats } from '../utils/api';
import { formatNumber } from '../utils/format';

/**
 * Execute stats command
 */
export async function statsCommand(): Promise<void> {
  console.log('Hunt Town Co-op Stats');
  console.log('=====================\n');

  try {
    const [projectsResponse, reserveStats] = await Promise.all([
      fetchProjects(),
      fetchReserveStats()
    ]);

    const projects = projectsResponse.tokens;
    
    // Calculate total HUNT locked
    const totalHuntLocked = projects.reduce((sum, p) => sum + (p.reserveBalance || 0), 0);
    
    console.log(`HUNT Price:         $0.000136 (placeholder)`);
    console.log(`Total Projects:     ${formatNumber(projects.length)}`);
    console.log(`HUNT in Co-op:      ${formatNumber(totalHuntLocked)} HUNT`);
    console.log(`Daily Reward Pool:  TBD`);
    console.log(`Current Day:        TBD`);

    console.log('\nToday\'s Activity:');
    console.log('  Voting Points:    TBD');
    console.log('  Votes:            TBD');
    console.log('  Claims:           TBD');
    console.log('  HUNT Claimed:     TBD');

  } catch (error) {
    console.error('Error fetching co-op stats:', error);
    process.exit(1);
  }
}