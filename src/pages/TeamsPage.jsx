import { useState, useEffect } from 'react';
import Button from '../components/atoms/Button';
import TeamCard from '../components/molecules/TeamCard';
import TeamCardPreview from '../components/molecules/TeamCardPreview';
import { getTeams, saveTeams, deleteTeam } from '../services/teamService';
import { getPlayers } from '../services/playerService';

const TeamsPage = () => {
  // State for managing teams list (saved teams from DB)
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for preview teams (not saved yet)
  const [previewTeams, setPreviewTeams] = useState([]);
  const [saving, setSaving] = useState(false);
  
  // State for player counts (to show requirements)
  const [playerStats, setPlayerStats] = useState({
    total: 0,
    intermediate: 0,
    expert: 0,
    players: [] // Store full player list for generation
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
        expert,
        players // Store players for team generation
      });
    } catch (err) {
      console.error('Error loading player stats:', err);
    }
  };
  
  // Function to shuffle array randomly
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  // Generate teams locally (preview mode - not saved to DB)
  const generateTeamsLocally = () => {
    const { players, intermediate, expert } = playerStats;
    
    // Split players by expertise
    const intermediatePlayers = players.filter(p => p.expertise_level === 'Intermediate');
    const expertPlayers = players.filter(p => p.expertise_level === 'Expert');
    
    // Shuffle players randomly
    const shuffledIntermediate = shuffleArray(intermediatePlayers);
    const shuffledExpert = shuffleArray(expertPlayers);
    
    // Create teams - one Intermediate + one Expert per team
    const generatedTeams = [];
    for (let i = 0; i < intermediate; i++) {
      generatedTeams.push({
        team_name: `Team ${i + 1}`,
        player1_id: shuffledIntermediate[i].id,
        player1_name: shuffledIntermediate[i].name,
        player1_expertise: 'Intermediate',
        player2_id: shuffledExpert[i].id,
        player2_name: shuffledExpert[i].name,
        player2_expertise: 'Expert'
      });
    }
    
    return generatedTeams;
  };

  // Function to generate random teams (preview mode - not saved to DB)
  const handleGenerateTeams = () => {
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

    // Warn if teams already exist
    if (teams.length > 0) {
      const confirmed = window.confirm(
        'You have existing teams. Generating new teams will create a preview. ' +
        'You can edit team names before saving. Continue?'
      );
      if (!confirmed) {
        return;
      }
    }

    // Generate teams locally (preview mode)
    setError(null);
    const generatedTeams = generateTeamsLocally();
    setPreviewTeams(generatedTeams);
    
    // Scroll to preview section
    setTimeout(() => {
      document.getElementById('preview-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  // Handle team name change in preview
  const handleTeamNameChange = (index, newName) => {
    const updatedTeams = [...previewTeams];
    updatedTeams[index].team_name = newName;
    setPreviewTeams(updatedTeams);
  };
  
  // Handle confirm and save teams to database
  const handleConfirmAndSave = async () => {
    if (previewTeams.length === 0) {
      setError('No teams to save');
      return;
    }

    // Confirm before saving
    const confirmed = window.confirm(
      `Save ${previewTeams.length} teams to database? This will replace any existing teams.`
    );
    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      // Delete existing teams first (if any)
      if (teams.length > 0) {
        // Delete all existing teams
        for (const team of teams) {
          try {
            await deleteTeam(team.id);
          } catch (err) {
            console.error('Error deleting team:', err);
          }
        }
      }
      
      // Save new teams to database
      await saveTeams(previewTeams);
      
      // Clear preview and reload teams
      setPreviewTeams([]);
      await loadTeams();
      
      // Show success message
      alert(`Successfully saved ${previewTeams.length} teams to database!`);
    } catch (err) {
      setError(err.message || 'Failed to save teams');
      console.error('Error saving teams:', err);
    } finally {
      setSaving(false);
    }
  };
  
  // Handle cancel preview
  const handleCancelPreview = () => {
    if (window.confirm('Discard preview teams? They will not be saved.')) {
      setPreviewTeams([]);
      setError(null);
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
          disabled={!canGenerateTeams || previewTeams.length > 0}
        >
          🎲 Generate Random Teams
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

      {/* Preview Section */}
      {previewTeams.length > 0 && (
        <div id="preview-section" className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-yellow-900">Preview Teams</h3>
              <p className="text-sm text-yellow-800 mt-1">
                Review and edit team names before saving. Teams are not saved to database yet.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCancelPreview}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAndSave}
                variant="primary"
                size="sm"
                disabled={saving}
              >
                {saving ? 'Saving...' : '✓ Confirm & Save Teams'}
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {previewTeams.map((team, index) => (
              <TeamCardPreview
                key={index}
                team={team}
                index={index}
                onNameChange={handleTeamNameChange}
              />
            ))}
          </div>
        </div>
      )}

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
