import { useState, useEffect } from 'react';
import Button from '../components/atoms/Button';
import { getTeamStandings, getMatches } from '../services/matchService';

const StatisticsPage = () => {
  const [standings, setStandings] = useState({ poolA: [], poolB: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load matches to check if qualifying matches exist
      const matchesData = await getMatches();
      setMatches(matchesData);
      
      // Load standings if qualifying matches exist
      const hasQualifyingMatches = matchesData.some(m => m.round_type === 'Qualifying');
      if (hasQualifyingMatches) {
        await loadStandings();
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStandings = async () => {
    try {
      const [poolA, poolB] = await Promise.all([
        getTeamStandings('A', 'Qualifying'),
        getTeamStandings('B', 'Qualifying')
      ]);
      setStandings({ poolA, poolB });
    } catch (err) {
      console.error('Error loading standings:', err);
      setError('Failed to load standings. Please refresh the page.');
    }
  };

  const hasQualifyingMatches = matches.some(m => m.round_type === 'Qualifying');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Statistics</h2>
          <p className="text-gray-600 mt-1">
            Tournament statistics and pool standings
          </p>
        </div>
        {hasQualifyingMatches && (
          <Button
            onClick={loadStandings}
            variant="outline"
            size="sm"
          >
            🔄 Refresh Standings
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <strong>Error: </strong>{error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="text-gray-600">Loading statistics...</div>
        </div>
      )}

      {/* Pool Standings */}
      {!loading && hasQualifyingMatches && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-900">Pool Standings - Qualifying Round</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pool A Standings */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Pool A Standings</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-2">Team</th>
                      <th className="text-center p-2">Pts</th>
                      <th className="text-center p-2">W</th>
                      <th className="text-center p-2">L</th>
                      <th className="text-center p-2">MP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.poolA && standings.poolA.length > 0 ? (
                      standings.poolA.map((team, index) => (
                        <tr key={team.id} className={index < 4 ? 'bg-green-50' : ''}>
                          <td className="p-2 font-medium">{team.team_name}</td>
                          <td className="p-2 text-center font-bold">{team.points || 0}</td>
                          <td className="p-2 text-center">{team.matches_won || 0}</td>
                          <td className="p-2 text-center">{team.matches_lost || 0}</td>
                          <td className="p-2 text-center">{team.matches_played || 0}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-gray-500">
                          No teams found in Pool A
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <p className="text-xs text-gray-500 mt-2">Top 4 teams qualify for Quarter Finals</p>
              </div>
            </div>

            {/* Pool B Standings */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Pool B Standings</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-2">Team</th>
                      <th className="text-center p-2">Pts</th>
                      <th className="text-center p-2">W</th>
                      <th className="text-center p-2">L</th>
                      <th className="text-center p-2">MP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.poolB && standings.poolB.length > 0 ? (
                      standings.poolB.map((team, index) => (
                        <tr key={team.id} className={index < 4 ? 'bg-green-50' : ''}>
                          <td className="p-2 font-medium">{team.team_name}</td>
                          <td className="p-2 text-center font-bold">{team.points || 0}</td>
                          <td className="p-2 text-center">{team.matches_won || 0}</td>
                          <td className="p-2 text-center">{team.matches_lost || 0}</td>
                          <td className="p-2 text-center">{team.matches_played || 0}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-gray-500">
                          No teams found in Pool B
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <p className="text-xs text-gray-500 mt-2">Top 4 teams qualify for Quarter Finals</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !hasQualifyingMatches && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-600 text-lg mb-2">No qualifying matches found</p>
          <p className="text-gray-500 text-sm">
            Generate a match schedule from the Matches page to see pool standings here.
          </p>
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;


