import { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Card from '../components/atoms/Card';
import Button from '../components/atoms/Button';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardStats } from '../services/statisticsService';
import { seedPlayers } from '../services/seedService';
import { resetApplicationData } from '../services/adminService';
import { getLeagueGroups } from '../services/tournamentService';
import GroupAssignmentsTable from '../components/molecules/GroupAssignmentsTable';

const HomePage = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalTeams: 0,
    totalMatches: 0,
    completedMatches: 0,
    upcomingMatches: 0,
    expertiseLevels: {},
    matchesByRound: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [dataSeeded, setDataSeeded] = useState(false);
  const [seedingSteps, setSeedingSteps] = useState([]);
  const [resetting, setResetting] = useState(false);
  const [leagueGroupsByLeague, setLeagueGroupsByLeague] = useState({});

  // Memoize loadStats to avoid dependency issues
  const loadStats = useCallback(async (forceReload = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading stats...', { forceReload });
      const statsData = await getDashboardStats();
      console.log('📦 Stats data received:', JSON.stringify(statsData, null, 2));
      
      // getDashboardStats now returns the data directly: { totalPlayers: ..., totalTeams: ..., ... }
      // No need for nested extraction
      
      // Always create a new stats object to ensure React detects the change
      const newStats = {
        totalPlayers: Number(statsData.totalPlayers) || 0,
        totalTeams: Number(statsData.totalTeams) || 0,
        totalMatches: Number(statsData.totalMatches) || 0,
        completedMatches: Number(statsData.completedMatches) || 0,
        upcomingMatches: Number(statsData.upcomingMatches) || 0,
        expertiseLevels: statsData.expertiseLevels || {},
        matchesByRound: statsData.matchesByRound || {}
      };
      
      console.log('📊 New stats to set:', newStats);
      console.log('📊 Current stats before update:', stats);
      
      // Always update stats, even if values are 0
      // Use direct setState to ensure React detects the change
      setStats(newStats);
      
      // Force a re-render by updating a timestamp
      const updateKey = Date.now();
      console.log('🔄 Stats state updated with key:', updateKey);
      
      const hasData = (newStats.totalPlayers || 0) > 0 || (newStats.totalTeams || 0) > 0;
      if (hasData) {
        setDataSeeded(true);
        localStorage.setItem('hasSeededData', 'true');
        console.log('✅ Data detected, marked as seeded');
      } else {
        console.log('⚠️ No data found in stats response');
      }
      
      console.log('✅ Stats updated successfully');

      if ((newStats.totalTeams || 0) > 0 && (newStats.totalMatches || 0) > 0) {
        const leagues = ['Expert', 'Intermediate', 'Women'];
        const groupResults = await Promise.all(
          leagues.map(async (league) => {
            try {
              const data = await getLeagueGroups(league);
              return [league, data?.groups || []];
            } catch {
              return [league, []];
            }
          })
        );
        setLeagueGroupsByLeague(Object.fromEntries(groupResults));
      } else {
        setLeagueGroupsByLeague({});
      }
    } catch (err) {
      console.error('❌ Error loading dashboard stats:', err);
      // Don't show error if it's just a connection issue - user might not have backend running yet
      const errorMessage = err.message || 'Failed to load statistics';
      if (errorMessage.includes('Backend server is not running')) {
        // Set a friendly message but don't block the UI
        setError('⚠️ Backend server not detected. Please start the backend server to view statistics.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Always try to load stats on mount or when component becomes visible
    const hasSeededData = localStorage.getItem('hasSeededData') === 'true';
    if (hasSeededData) {
      setDataSeeded(true);
    }
    // Always load stats to get current state
    loadStats();
  }, [loadStats]);
  
  // Reload stats when navigating back to this page
  useEffect(() => {
    const hasSeededData = localStorage.getItem('hasSeededData') === 'true';
    if (hasSeededData && location.pathname === '/') {
      console.log('Navigated to homepage, reloading stats...');
      loadStats(true);
    }
  }, [location.pathname, loadStats]);
  
  // Reload stats when component becomes visible (after navigation)
  useEffect(() => {
    const handleFocus = () => {
      const hasSeededData = localStorage.getItem('hasSeededData') === 'true';
      if (hasSeededData) {
        console.log('Page focused, reloading stats...');
        loadStats(true);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadStats]);


  const getExpertiseText = () => {
    const intermediate = stats.expertiseLevels?.Intermediate || 0;
    const expert = stats.expertiseLevels?.Expert || 0;
    if (intermediate > 0 || expert > 0) {
      return `${intermediate} Intermediate, ${expert} Expert`;
    }
    return 'No players yet';
  };

  const handleResetData = async () => {
    if (!window.confirm(
      'This will delete ALL players, teams, matches, and statistics. Admin user accounts will be preserved. Continue?'
    )) {
      return;
    }

    try {
      setResetting(true);
      setError(null);
      const result = await resetApplicationData();
      localStorage.removeItem('hasSeededData');
      setDataSeeded(false);
      await loadStats(true);

      const cleared = result?.data?.tablesCleared?.join(', ') || 'tournament tables';
      const verified = result?.data?.verification;
      let detail = `Cleared: ${cleared}. New rows will use IDs starting at 1.`;
      if (verified) {
        const lines = Object.entries(verified).map(
          ([table, state]) => `${table}: ${state.rowCount} rows cleared (${state.method})`
        );
        detail += `\n\n${lines.join('\n')}`;
      }
      alert(`Application data reset successfully.\n\n${detail}\n\nYou can reseed demo data when ready.`);
    } catch (err) {
      setError(err.message || 'Failed to reset application data');
    } finally {
      setResetting(false);
    }
  };

  const handleSeedData = async () => {
    const confirmMessage =
      'This will setup the database (if needed) and seed demo players only. ' +
      'All existing players, teams, matches, and statistics will be cleared.\n\n' +
      'Next steps after seeding:\n' +
      '1. Edit players on the Players page\n' +
      '2. Generate teams on the Teams page\n' +
      '3. Create match schedules on the Matches page\n\n' +
      'Continue?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setSeeding(true);
      setError(null);
      setSeedingSteps([]);
      
      const steps = ['Step 1: Setting up database structure...'];
      setSeedingSteps([...steps]);
      
      const result = await seedPlayers(true);
      
      steps.push('Step 2: Database structure ready');
      steps.push('Step 3: Creating demo players...');
      steps.push('Step 4: Player seeding completed!');
      setSeedingSteps([...steps]);
      
      const messageParts = [];
      if (result?.data?.playersCreated > 0) {
        messageParts.push(`Players created: ${result.data.playersCreated}`);
      }
      if (result?.data?.leagueCounts) {
        const { expertMen, intermediateMen, women, total } = result.data.leagueCounts;
        messageParts.push(`Total players: ${total} (Expert Men: ${expertMen}, Intermediate Men: ${intermediateMen}, Women: ${women})`);
      }
      if (result?.data?.possibleTeams?.Expert) {
        messageParts.push(`Expert league can form up to ${result.data.possibleTeams.Expert} teams after pairing`);
      }
      
      setDataSeeded(true);
      localStorage.setItem('hasSeededData', 'true');
      setError(null);
      await loadStats(true);
      setSeedingSteps([]);
      
      const workflow = result?.data?.workflow?.map((step, i) => `${i + 1}. ${step}`).join('\n') || '';
      alert(`Player seeding completed!\n\n${result?.message || 'Success'}\n\n${messageParts.join('\n')}\n\n${workflow}`);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to setup and seed data';
      setError(errorMessage);
      console.error('Error setting up/seeding data:', err);
      setSeedingSteps([]);
      
      // Show helpful error message based on error type
      let troubleshootingSteps = [];
      
      if (errorMessage.includes('MySQL server is not running')) {
        troubleshootingSteps = [
          '1. Start MySQL service:',
          '   - Windows: Open Services, find MySQL, and start it',
          '   - Mac/Linux: Run: sudo service mysql start',
          '2. Verify MySQL is running: mysql --version',
          '3. Try seeding again'
        ];
      } else if (errorMessage.includes('Access denied')) {
        troubleshootingSteps = [
          '1. Check backend/.env file exists',
          '2. Verify DB_USER and DB_PASS are correct',
          '3. Test connection: mysql -u [user] -p',
          '4. Ensure user has CREATE DATABASE permission'
        ];
      } else if (errorMessage.includes('Cannot connect')) {
        troubleshootingSteps = [
          '1. Check DB_HOST in backend/.env (should be "localhost" or your MySQL host)',
          '2. Check DB_PORT in backend/.env (default is 3306)',
          '3. Verify MySQL server is accessible',
          '4. Check firewall settings'
        ];
      } else {
        troubleshootingSteps = [
          '1. Verify MySQL server is running',
          '2. Check database credentials in backend/.env',
          '3. Ensure user has CREATE DATABASE permissions',
          '4. Check backend console for detailed error messages'
        ];
      }
      
      alert(`Error: ${errorMessage}\n\nTroubleshooting:\n${troubleshootingSteps.join('\n')}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Table Tennis Tournament
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          Manage your in-house tournament with ease
        </p>
        {isAdmin && (
          <div className="flex flex-col items-center gap-4">
            {stats.totalPlayers === 0 && (
            <Button
              onClick={handleSeedData}
              variant="primary"
              disabled={seeding || resetting}
            >
              {seeding ? 'Processing...' : '🌱 Seed Demo Players'}
            </Button>
            )}
            <Button
              onClick={handleResetData}
              variant="outline"
              disabled={seeding || resetting}
            >
              {resetting ? 'Resetting...' : '🗑️ Reset Application Data (Keep Users)'}
            </Button>
            
            {seeding && seedingSteps.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full max-w-md">
                <h4 className="font-semibold text-blue-900 mb-2">Seeding Progress:</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  {seedingSteps.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">{step.includes('completed') || step.includes('ready') ? '✓' : '→'}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className={`px-4 py-3 rounded ${
          error.includes('Backend server not detected') 
            ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <div className="flex items-start">
            <div className="flex-1">
              <p className="font-medium">{error}</p>
              {error.includes('Backend server not detected') && (
                <div className="mt-2 text-sm">
                  <p className="mb-1">To start the backend server:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Open a terminal in the project root</li>
                    <li>Run: <code className="bg-yellow-100 px-1 rounded">cd backend && npm start</code></li>
                    <li>Wait for "Server running on port 3001" message</li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/players" className="block cursor-pointer">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer h-full">
            <div className="text-4xl mb-3">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Players</h3>
            {loading ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : (
              <>
                <p className="text-3xl font-bold text-blue-600 mb-2">{stats.totalPlayers}</p>
                <p className="text-gray-600 text-sm">{getExpertiseText()}</p>
              </>
            )}
          </Card>
        </Link>
        
        <Link to="/teams" className="block cursor-pointer">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer h-full">
            <div className="text-4xl mb-3">🤝</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Teams</h3>
            {loading ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : (
              <>
                <p className="text-3xl font-bold text-green-600 mb-2">{stats.totalTeams}</p>
                <p className="text-gray-600 text-sm">
                  {stats.totalTeams > 0 
                    ? `${stats.totalTeams} team${stats.totalTeams !== 1 ? 's' : ''} formed`
                    : 'No teams yet'}
                </p>
              </>
            )}
          </Card>
        </Link>
        
        <Link to="/matches" className="block cursor-pointer">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer h-full">
            <div className="text-4xl mb-3">⚔️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Matches</h3>
            {loading ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : (
              <>
                <p className="text-3xl font-bold text-purple-600 mb-2">{stats.totalMatches}</p>
                <p className="text-gray-600 text-sm">
                  {stats.completedMatches} completed, {stats.upcomingMatches} upcoming
                </p>
              </>
            )}
          </Card>
        </Link>
        
        <Link to="/tournament" className="block cursor-pointer">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer h-full">
            <div className="text-4xl mb-3">🏆</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tournament</h3>
            {loading ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : (
              <>
                <p className="text-3xl font-bold text-orange-600 mb-2">
                  {stats.completedMatches > 0 ? 'View' : '—'}
                </p>
                <p className="text-gray-600 text-sm">Standings, bracket, and results</p>
              </>
            )}
          </Card>
        </Link>
      </div>

      {!loading && stats.totalTeams > 0 && Object.values(leagueGroupsByLeague).some((g) => g.length > 0) && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tournament groups</h2>
            <p className="text-gray-600 mt-1">
              Team placements per league after the group-stage schedule has been generated.
            </p>
          </div>
          {['Expert', 'Intermediate', 'Women']
            .filter((league) => (leagueGroupsByLeague[league] || []).length > 0)
            .map((league) => (
              <GroupAssignmentsTable
                key={league}
                groups={leagueGroupsByLeague[league]}
                league={league}
                compact
              />
            ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;






