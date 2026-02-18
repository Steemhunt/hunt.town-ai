/**
 * Show Hunt Town Co-op leaderboard - top projects by TVL
 */
import { fetchProjects, type TokenData } from '../utils/api';
import { formatNumber } from '../utils/format';

/**
 * Execute leaderboard command
 */
export async function leaderboardCommand(options: { limit?: number } = {}): Promise<void> {
  const limit = options.limit || 10;
  
  console.log(`Hunt Town Co-op Leaderboard — Top ${limit} Projects by TVL`);
  console.log('============================================================\n');

  try {
    const response = await fetchProjects();
    const projects = response.tokens;

    if (projects.length === 0) {
      console.log('No projects found.');
      return;
    }

    // Sort by reserve balance descending and take top N
    const topProjects = projects
      .sort((a, b) => (b.reserveBalance || 0) - (a.reserveBalance || 0))
      .slice(0, limit);

    // Display header
    console.log('Rank Symbol     TVL (HUNT)      ');
    console.log('---- --------   ---------------');

    // Display leaderboard
    topProjects.forEach((project, index) => {
      const rank = (index + 1).toString().padStart(2, ' ');
      const symbol = project.symbol.padEnd(8, ' ');
      const tvl = formatNumber(project.reserveBalance || 0).padStart(13, ' ');

      console.log(`  ${rank}  ${symbol}   ${tvl}`);
    });

    // Display totals
    const totalTVL = topProjects.reduce((sum, p) => sum + (p.reserveBalance || 0), 0);

    console.log('\n' + '─'.repeat(40));
    console.log(`Total (top ${limit}): ${formatNumber(totalTVL)} HUNT`);
    
    if (projects.length > limit) {
      console.log(`\nShowing top ${limit} of ${projects.length} total projects.`);
    }

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    process.exit(1);
  }
}