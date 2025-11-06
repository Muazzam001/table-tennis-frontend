import { useState, useEffect } from 'react';
import Button from '../components/atoms/Button';
import TeamCard from '../components/molecules/TeamCard';
import { getTeams, generateRandomTeams, deleteTeam } from '../services/teamService';
import { getPlayers } from '../services/playerService';

const TeamsPage = () => {
  // State for managing teams list
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  
  // State for player counts (to show requirements)
  const [playerStats, setPlayerStats] = useState({
    total: 0,
    intermediate: 0,
    expert: 0
  });

  // Load teams and player stats when component mounts
  useEffect(() => {
    loadTeams();
    loadPlayerStats();
  }, []);

  // Function to fetch all teams from API
  const loadTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTeams();
      setTeams(data);
    } catch (err) {
      setError(err.message || 'Failed to load teams');
      console.error('Error loading teams:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to load player statistics
  const loadPlayerStats = async () => {
    try {
      const players = await getPlayers();
      const intermediate = players.filter(p => p.expertise_level === 'Intermediate').length;
      const expert = players.filter(p => p.expertise_level === 'Expert').length;
      
      setPlayerStats({
        total: players.length,
        intermediate,
        expert
      });
    } catch (err) {
      console.error('Error loading player stats:', err);
    }
  };

  // Function to generate random teams
  const handleGenerateTeams = async () => {
    // Check requirements before generating
    if (playerStats.total === 0) {
      setError('No players found. Please add players first.');
      return;
    }

    if (playerStats.total % 2 !== 0) {
      setError(`Cannot generate teams. You have ${playerStats.total} players. Need an even number of players.`);
      return;
    }

    if (playerStats.intermediate !== playerStats.expert) {
      setError(
        `Cannot generate teams. You have ${playerStats.intermediate} Intermediate and ${playerStats.expert} Expert players. ` +
        `Need equal numbers of each (one Intermediate + one Expert per team).`
      );
      return;
    }

    // Confirm before generating (this will replace existing teams)
    if (teams.length > 0) {
      const confirmed = window.confirm(
        'This will delete all existing teams and create new random teams. Continue?'
      );
      if (!confirmed) {
        return;
      }
    }

    try {
      setGenerating(true);
      setError(null);
      
      // Call API to generate teams
      await generateRandomTeams();
      
      // Reload teams to show new ones
      await loadTeams();
      
      // Show success message
      alert(`Successfully generated ${playerStats.intermediate} teams!`);
    } catch (err) {
      setError(err.message || 'Failed to generate teams');
      console.error('Error generating teams:', err);
    } finally {
      setGenerating(false);
    }
  };

  // Handle delete team
  const handleDelete = async (teamId) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await deleteTeam(teamId);
        loadTeams(); // Reload list after deletion
      } catch (err) {
        setError(err.message || 'Failed to delete team');
        console.error('Error deleting team:', err);
      }
    }
  };

  // Check if team generation is possible
  const canGenerateTeams = 
    playerStats.total > 0 &&
    playerStats.total % 2 === 0 &&
    playerStats.intermediate === playerStats.expert;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Teams</h2>
          <p className="text-gray-600 mt-1">
            Manage tournament teams ({teams.length} teams created)
          </p>
        </div>
        <Button 
          onClick={handleGenerateTeams} 
          variant="primary"
          disabled={generating || !canGenerateTeams}
        >
          {generating ? 'Generating...' : '🎲 Generate Random Teams'}
        </Button>
      </div>

      {/* Requirements Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Team Generation Requirements:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li className={playerStats.total % 2 === 0 ? 'text-green-700' : 'text-red-700'}>
            ✓ Even number of players: {playerStats.total} {playerStats.total % 2 === 0 ? '✓' : '✗'}
          </li>
          <li className={playerStats.intermediate === playerStats.expert ? 'text-green-700' : 'text-red-700'}>
            ✓ Equal Intermediate & Expert: {playerStats.intermediate} Intermediate, {playerStats.expert} Expert
            {playerStats.intermediate === playerStats.expert ? ' ✓' : ' ✗'}
          </li>
          <li className="text-blue-700">
            → Each team will have: 1 Intermediate + 1 Expert player
          </li>
        </ul>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-600">Total Teams</div>
          <div className="text-2xl font-bold text-gray-900">{teams.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-600">Intermediate Players</div>
          <div className="text-2xl font-bold text-blue-600">{playerStats.intermediate}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-600">Expert Players</div>
          <div className="text-2xl font-bold text-purple-600">{playerStats.expert}</div>
        </div>
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
          <div className="text-gray-600">Loading teams...</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && teams.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-6xl mb-4">🏓</div>
          <p className="text-gray-600 text-lg mb-2">No teams created yet</p>
          <p className="text-gray-500 text-sm mb-6">
            Click "Generate Random Teams" to automatically create teams
          </p>
          {!canGenerateTeams && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-yellow-800 text-sm">
                {playerStats.total === 0 && 'Add players first'}
                {playerStats.total > 0 && playerStats.total % 2 !== 0 && 'Need even number of players'}
                {playerStats.total > 0 && playerStats.total % 2 === 0 && playerStats.intermediate !== playerStats.expert && 
                  'Need equal numbers of Intermediate and Expert players'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Teams Grid */}
      {!loading && teams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
