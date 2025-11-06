import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/atoms/Card';
import { getDashboardStats } from '../services/statisticsService';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError('Failed to load statistics');
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

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Table Tennis Tournament
        </h1>
        <p className="text-xl text-gray-600">
          Manage your in-house tournament with ease
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
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


