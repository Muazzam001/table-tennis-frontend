import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/atoms/Card';
import Button from '../components/atoms/Button';
import { getDashboardStats } from '../services/statisticsService';
import { seedTeamsAndMatches } from '../services/seedService';

const HomePage = () => {
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

  useEffect(() => {
    // Only load stats if we think data might be seeded
    // Check localStorage first to avoid unnecessary API calls
    const hasSeededData = localStorage.getItem('hasSeededData') === 'true';
    if (hasSeededData) {
      setDataSeeded(true);
      loadStats();
    } else {
      setLoading(false);
    }
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDashboardStats();
      // Handle both response structures: { success: true, data: {...} } or direct data object
      const statsData = response?.data || response || {};
      const hasData = (statsData.totalPlayers || 0) > 0 || (statsData.totalTeams || 0) > 0;
      
      if (hasData) {
        setDataSeeded(true);
        localStorage.setItem('hasSeededData', 'true');
      }
      
      setStats({
        totalPlayers: statsData.totalPlayers || 0,
        totalTeams: statsData.totalTeams || 0,
        totalMatches: statsData.totalMatches || 0,
        completedMatches: statsData.completedMatches || 0,
        upcomingMatches: statsData.upcomingMatches || 0,
        expertiseLevels: statsData.expertiseLevels || {},
        matchesByRound: statsData.matchesByRound || {}
      });
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
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
  };

  const getExpertiseText = () => {
    const intermediate = stats.expertiseLevels?.Intermediate || 0;
    const expert = stats.expertiseLevels?.Expert || 0;
    if (intermediate > 0 || expert > 0) {
      return `${intermediate} Intermediate, ${expert} Expert`;
    }
    return 'No players yet';
  };

  const handleSeedData = async () => {
    const willSeedPlayers = stats.totalPlayers === 0;
    const confirmMessage = willSeedPlayers
      ? 'This will setup the database (if needed), generate players, teams, and matches for demo purposes. All existing data will be cleared. Continue?'
      : 'This will setup the database (if needed) and generate teams and matches for demo purposes. Existing teams and matches will be cleared. Continue?';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    const startDate = prompt('Enter start date for matches (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!startDate) return;

    const endDateInput = prompt('Enter end date (YYYY-MM-DD) - Leave empty for no end date:', '');
    const endDate = endDateInput && endDateInput.trim() !== '' ? endDateInput.trim() : null;

    if (endDate && new Date(endDate) < new Date(startDate)) {
      setError('End date must be after start date');
      return;
    }

    const venue = prompt('Enter venue name:', 'Main Court') || 'Main Court';

    try {
      setSeeding(true);
      setError(null);
      setSeedingSteps([]);
      
      // Show manual process steps
      const steps = [];
      steps.push('Step 1: Setting up database structure...');
      setSeedingSteps([...steps]);
      
      // Seed with automatic database setup (handled in backend)
      const result = await seedTeamsAndMatches(startDate, endDate, venue, true, willSeedPlayers);
      
      steps.push('Step 2: Database structure ready');
      if (willSeedPlayers) {
        steps.push('Step 3: Creating players...');
        setSeedingSteps([...steps]);
      }
      
      steps.push('Step 4: Generating teams...');
      setSeedingSteps([...steps]);
      
      steps.push('Step 5: Creating match schedule...');
      setSeedingSteps([...steps]);
      
      const messageParts = [];
      if (result?.data?.playersCreated > 0) {
        messageParts.push(`✓ Players created: ${result.data.playersCreated}`);
      }
      if (result?.data?.teamsCreated) {
        messageParts.push(`✓ Teams created: ${result.data.teamsCreated}`);
      }
      if (result?.data?.matchesCreated > 0) {
        messageParts.push(`✓ Matches created: ${result.data.matchesCreated}`);
      }
      
      steps.push('Step 6: Seeding completed successfully!');
      setSeedingSteps([...steps]);
      
      // Mark data as seeded
      setDataSeeded(true);
      localStorage.setItem('hasSeededData', 'true');
      
      alert(`Setup & Seeding completed!\n\n${result?.message || 'Success'}\n\n${messageParts.join('\n')}`);
      
      // Clear steps after a moment
      setTimeout(() => {
        setSeedingSteps([]);
      }, 2000);
      
      // Reload stats after seeding
      await loadStats();
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
          '2. Verify DB_USER and DB_PASSWORD are correct',
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
        {(!dataSeeded || stats.totalPlayers === 0 || stats.totalTeams === 0 || stats.totalMatches === 0) && (
          <div className="flex flex-col items-center gap-4">
            <Button
              onClick={handleSeedData}
              variant="primary"
              disabled={seeding}
            >
              {seeding ? 'Processing...' : stats.totalPlayers === 0 
                ? '🌱 Seed Demo Data (Players, Teams & Matches)' 
                : '🌱 Seed Demo Data (Teams & Matches)'}
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
        <Link to="/players" className="block">
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
        
        <Link to="/teams" className="block">
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
        
        <Link to="/matches" className="block">
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
        
        <Link to="/statistics" className="block">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer h-full">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Statistics</h3>
            {loading ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : (
              <>
                <p className="text-3xl font-bold text-orange-600 mb-2">
                  {stats.completedMatches > 0 ? 'View' : '—'}
                </p>
                <p className="text-gray-600 text-sm">View player and team performance</p>
              </>
            )}
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;


