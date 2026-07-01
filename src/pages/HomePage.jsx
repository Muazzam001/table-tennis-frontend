import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import DivisionWorkflowCards from '@/components/molecules/DivisionWorkflowCards/DivisionWorkflowCards';
import GroupAssignmentsTable from '@/components/molecules/GroupAssignmentsTable';
import { DEFAULT_TOURNAMENT_DIVISION, DIVISIONS } from '@/constants/divisions';
import { useAuth } from '@/contexts/AuthContext';
import { resetApplicationData } from '@/services/adminService';
import { seedPlayers } from '@/services/seedService';
import { getDashboardStats } from '@/services/statisticsService';
import { getTeams } from '@/services/teamService';
import { archiveTournament } from '@/services/tournamentArchiveService';
import { getDivisionGroups, getTournamentOverview } from '@/services/tournamentService';
import { showConfirm, showError, showSuccess } from '@/utils/sweetAlert';
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

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
  const [divisionGroupsByDivision, setDivisionGroupsByDivision] = useState({});
  const [divisionOverviews, setDivisionOverviews] = useState({});
  const [divisionTeamCounts, setDivisionTeamCounts] = useState({});
  const [divisionWorkflowLoading, setDivisionWorkflowLoading] = useState(false);
  const [archivingDivision, setArchivingDivision] = useState(null);

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
        const divisions = DIVISIONS.map((d) => d.value);
        const groupResults = await Promise.all(
          divisions.map(async (division) => {
            try {
              const data = await getDivisionGroups(division);
              return [division, data?.groups || []];
            } catch {
              return [division, []];
            }
          })
        );
        setDivisionGroupsByDivision(Object.fromEntries(groupResults));
      } else {
        setDivisionGroupsByDivision({});
      }

      if ((newStats.totalPlayers || 0) > 0) {
        setDivisionWorkflowLoading(true);
        try {
          const allTeams = await getTeams();
          const counts = Object.fromEntries(
            DIVISIONS.map((d) => [
              d.value,
              allTeams.filter((t) => (t.division || DEFAULT_TOURNAMENT_DIVISION) === d.value).length,
            ])
          );
          setDivisionTeamCounts(counts);

          const overviewResults = await Promise.all(
            DIVISIONS.map(async (division) => {
              try {
                const data = await getTournamentOverview(division.value);
                return [division.value, data];
              } catch {
                return [division.value, null];
              }
            })
          );
          setDivisionOverviews(Object.fromEntries(overviewResults));
        } catch {
          setDivisionTeamCounts({});
          setDivisionOverviews({});
        } finally {
          setDivisionWorkflowLoading(false);
        }
      } else {
        setDivisionTeamCounts({});
        setDivisionOverviews({});
      }
    } catch (err) {
      console.error('❌ Error loading dashboard stats:', err);
      // Don't show error if it's just a connection issue - user might not have backend running yet
      const errorMessage = err.message || 'Failed to load statistics';
      const isLocalDev =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
      if (errorMessage.includes('Backend server is not running')) {
        setError('⚠️ Backend server not detected. Please start the backend server to view statistics.');
      } else if (errorMessage.includes('Unable to reach the API server')) {
        setError('⚠️ Cannot reach the API. Redeploy the frontend (proxy) and ensure the backend health check returns JSON.');
      } else if (errorMessage.includes('page could not be found') || errorMessage.includes('NOT_FOUND')) {
        setError('⚠️ Backend API returned 404. Deploy the backend project and confirm /api/health works.');
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
    const beginner = stats.expertiseLevels?.Beginner || 0;
    const intermediate = stats.expertiseLevels?.Intermediate || 0;
    const expert = stats.expertiseLevels?.Expert || 0;
    if (beginner > 0 || intermediate > 0 || expert > 0) {
      return `${beginner} Beginner, ${intermediate} Intermediate, ${expert} Expert`;
    }
    return 'No players yet';
  };

  const handleResetData = async () => {
    const confirmed = await showConfirm({
      title: 'Reset all application data?',
      text:
        'This will delete ALL players, teams, matches, and statistics. Admin user accounts will be preserved. Continue?',
      confirmText: 'Reset everything',
      icon: 'warning',
      variant: 'danger',
    });
    if (!confirmed) {
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
      await showSuccess(
        'Application data reset',
        `${detail}\n\nYou can reseed demo data when ready.`
      );
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

    const confirmed = await showConfirm({
      title: 'Seed demo players?',
      text: confirmMessage,
      confirmText: 'Seed players',
      icon: 'question',
    });
    if (!confirmed) {
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
      if (result?.data?.divisionCounts) {
        const counts = result.data.divisionCounts;
        const total = Object.values(counts).reduce((sum, n) => sum + (Number(n) || 0), 0);
        const summary = Object.entries(counts)
          .filter(([, n]) => n > 0)
          .map(([track, n]) => `${track}: ${n}`)
          .join(', ');
        messageParts.push(`Total players: ${total}${summary ? ` (${summary})` : ''}`);
      }
      if (result?.data?.possibleTeams?.Men) {
        messageParts.push(
          `Men division can form up to ${result.data.possibleTeams.Men} teams after pairing`
        );
      }

      setDataSeeded(true);
      localStorage.setItem('hasSeededData', 'true');
      setError(null);
      await loadStats(true);
      setSeedingSteps([]);

      const workflow = result?.data?.workflow?.map((step, i) => `${i + 1}. ${step}`).join('\n') || '';
      await showSuccess(
        'Player seeding completed',
        `${result?.message || 'Success'}\n\n${messageParts.join('\n')}\n\n${workflow}`
      );
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

      await showError(
        'Seeding failed',
        `Error: ${errorMessage}\n\nTroubleshooting:\n${troubleshootingSteps.join('\n')}`
      );
    } finally {
      setSeeding(false);
    }
  };

  const handleArchiveDivision = async (division) => {
    const confirmed = await showConfirm({
      title: `Archive ${division} tournament?`,
      text:
        `Archive the completed ${division} tournament?\n\nThis saves all teams, matches, standings, and final results to history, then clears this division so a new season can begin. Players are kept.`,
      confirmText: 'Archive',
      icon: 'warning',
    });
    if (!confirmed) {
      return;
    }

    try {
      setArchivingDivision(division);
      setError(null);
      await archiveTournament(division);
      await loadStats(true);
      await showSuccess(
        'Tournament archived',
        `${division} tournament archived successfully. View it in Tournament History, then create new teams and schedule for the next season.`
      );
    } catch (err) {
      setError(err.message || 'Failed to archive tournament');
    } finally {
      setArchivingDivision(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Table Tennis Tournament
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          {isAdmin
            ? 'Manage your in-house tournament with ease'
            : 'Browse players, teams, matches, and tournament results'}
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
        <div className={`px-4 py-3 rounded ${error.includes('Backend server not detected') || error.includes('Cannot reach the API') || error.includes('Backend API returned 404')
            ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
            : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
          <div className="flex items-start">
            <div className="flex-1">
              <p className="font-medium">{error}</p>
              {error.includes('Backend server not detected') && (
                <div className="mt-2 text-sm">
                  <p className="mb-1">To start the backend server locally:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Open a terminal in the project root</li>
                    <li>Run: <code className="bg-yellow-100 px-1 rounded">cd backend && npm start</code></li>
                    <li>Wait for "Server running on port 3000" message</li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
              )}
              {error.includes('Cannot reach the API') && (
                <div className="mt-2 text-sm space-y-2">
                  <p>1. Redeploy <strong>table-tennis-backend</strong> — commit <code className="bg-yellow-100 px-1 rounded">api/index.mjs</code> and build must create <code className="bg-yellow-100 px-1 rounded">.vercel/bundle.mjs</code></p>
                  <p>2. Redeploy <strong>table-tennis-frontend-one</strong> with <code className="bg-yellow-100 px-1 rounded">VITE_API_BASE_URL=/api</code></p>
                  <p>
                    3. Verify:{' '}
                    <a
                      href="https://table-tennis-backend.vercel.app/api/health"
                      className="underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      table-tennis-backend.vercel.app/api/health
                    </a>{' '}
                    returns JSON (not 404).
                  </p>
                </div>
              )}
              {error.includes('Backend API returned 404') && (
                <div className="mt-2 text-sm space-y-2">
                  <p>The backend Vercel project is not serving API routes yet.</p>
                  <p>In the backend repo: run <code className="bg-yellow-100 px-1 rounded">npm run build</code>, push (including <code className="bg-yellow-100 px-1 rounded">api/index.mjs</code>), and redeploy. Build logs should show <code className="bg-yellow-100 px-1 rounded">.vercel/bundle.mjs</code>.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/players" className="block cursor-pointer">
          <Card className="p-5 text-center hover:shadow-lg transition-shadow cursor-pointer h-full">
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
          <Card className="p-5 text-center hover:shadow-lg transition-shadow cursor-pointer h-full">
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
          <Card className="p-5 text-center hover:shadow-lg transition-shadow cursor-pointer h-full">
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
          <Card className="p-5 text-center hover:shadow-lg transition-shadow cursor-pointer h-full">
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

      {!loading && stats.totalPlayers > 0 && (
        <DivisionWorkflowCards
          overviews={divisionOverviews}
          teamCounts={divisionTeamCounts}
          loading={divisionWorkflowLoading}
          isAdmin={isAdmin}
          archivingDivision={archivingDivision}
          onArchive={handleArchiveDivision}
        />
      )}

      {!loading && stats.totalTeams > 0 && Object.values(divisionGroupsByDivision).some((g) => g.length > 0) && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tournament groups</h2>
            <p className="text-gray-600 mt-1">
              Team placements per division after the group-stage schedule has been generated.
            </p>
          </div>
          {DIVISIONS.filter((division) => (divisionGroupsByDivision[division.value] || []).length > 0).map(
            (division) => (
              <GroupAssignmentsTable
                key={division.value}
                groups={divisionGroupsByDivision[division.value]}
                division={division.value}
                compact
              />
            )
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;






