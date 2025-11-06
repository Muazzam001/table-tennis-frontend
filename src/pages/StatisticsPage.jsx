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
      
      // Load all matches
      const matchesData = await getMatches();
      setMatches(matchesData);
      
      // Load standings if qualifying matches exist (only for Qualifying round)
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
      // Only load standings for Qualifying round matches
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

  // Filter matches by round type
  const finalMatches = matches.filter(m => m.round_type === 'Final').sort((a, b) => 
    new Date(b.scheduled_date || b.created_at) - new Date(a.scheduled_date || a.created_at)
  );
  const semiFinalMatches = matches.filter(m => m.round_type === 'Semi Final').sort((a, b) => 
    new Date(b.scheduled_date || b.created_at) - new Date(a.scheduled_date || a.created_at)
  );
  const quarterFinalMatches = matches.filter(m => m.round_type === 'Quarter Final').sort((a, b) => 
    new Date(b.scheduled_date || b.created_at) - new Date(a.scheduled_date || a.created_at)
  );
  const hasQualifyingMatches = matches.some(m => m.round_type === 'Qualifying');

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
          <strong>Error</strong>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="text-gray-600">Loading statistics...</div>
        </div>
      )}

      {/* Content in reverse chronological order: Final → Semi Finals → Quarter Finals → Qualifying */}
      {!loading && (
        <div className="space-y-6">
          {/* Final */}
          {finalMatches.length > 0 && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">🏆 Final</h3>
              <div className="space-y-3">
                {finalMatches.map((match) => (
                  <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded">
                        Final
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(match.scheduled_date)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className={`font-medium ${match.winner_team_id === match.team1_id ? 'text-green-600' : ''}`}>
                          {match.team1_name}
                        </div>
                        <div className={`font-medium mt-1 ${match.winner_team_id === match.team2_id ? 'text-green-600' : ''}`}>
                          {match.team2_name}
                        </div>
                      </div>
                      <div className="text-right">
                        {match.status === 'Completed' ? (
                          <>
                            <div className="font-bold text-lg">{match.score_team1 || 0}</div>
                            <div className="font-bold text-lg mt-1">{match.score_team2 || 0}</div>
                            {match.winner_team_id && (
                              <div className="text-xs text-green-600 font-semibold mt-1">
                                Winner: {match.winner_team_id === match.team1_id ? match.team1_name : match.team2_name}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-gray-400 text-sm">Scheduled</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Semi Finals */}
          {semiFinalMatches.length > 0 && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">🥈 Semi Finals</h3>
              <div className="space-y-3">
                {semiFinalMatches.map((match) => (
                  <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        Semi Final
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(match.scheduled_date)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className={`font-medium ${match.winner_team_id === match.team1_id ? 'text-green-600' : ''}`}>
                          {match.team1_name}
                        </div>
                        <div className={`font-medium mt-1 ${match.winner_team_id === match.team2_id ? 'text-green-600' : ''}`}>
                          {match.team2_name}
                        </div>
                      </div>
                      <div className="text-right">
                        {match.status === 'Completed' ? (
                          <>
                            <div className="font-bold text-lg">{match.score_team1 || 0}</div>
                            <div className="font-bold text-lg mt-1">{match.score_team2 || 0}</div>
                            {match.winner_team_id && (
                              <div className="text-xs text-green-600 font-semibold mt-1">
                                Winner: {match.winner_team_id === match.team1_id ? match.team1_name : match.team2_name}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-gray-400 text-sm">Scheduled</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quarter Finals */}
          {quarterFinalMatches.length > 0 && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">🥉 Quarter Finals</h3>
              <div className="space-y-3">
                {quarterFinalMatches.map((match) => (
                  <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                        Quarter Final
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(match.scheduled_date)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className={`font-medium ${match.winner_team_id === match.team1_id ? 'text-green-600' : ''}`}>
                          {match.team1_name}
                        </div>
                        <div className={`font-medium mt-1 ${match.winner_team_id === match.team2_id ? 'text-green-600' : ''}`}>
                          {match.team2_name}
                        </div>
                      </div>
                      <div className="text-right">
                        {match.status === 'Completed' ? (
                          <>
                            <div className="font-bold text-lg">{match.score_team1 || 0}</div>
                            <div className="font-bold text-lg mt-1">{match.score_team2 || 0}</div>
                            {match.winner_team_id && (
                              <div className="text-xs text-green-600 font-semibold mt-1">
                                Winner: {match.winner_team_id === match.team1_id ? match.team1_name : match.team2_name}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-gray-400 text-sm">Scheduled</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pool Standings - Qualifying Round */}
          {hasQualifyingMatches && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-900">Pool Standings - Qualifying Round</h3>
              <p className="text-sm text-gray-600">Standings based on Qualifying Round matches only</p>
              
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
          {!hasQualifyingMatches && finalMatches.length === 0 && semiFinalMatches.length === 0 && quarterFinalMatches.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-600 text-lg mb-2">No matches found</p>
              <p className="text-gray-500 text-sm">
                Generate a match schedule from the Matches page to see statistics here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;


