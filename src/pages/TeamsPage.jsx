import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/atoms/Button';
import TeamCard from '../components/molecules/TeamCard';
import TeamCardPreview from '../components/molecules/TeamCardPreview';
import LeagueTabs from '../components/molecules/LeagueTabs';
import GroupAssignmentsTable from '../components/molecules/GroupAssignmentsTable';
import { useAuth } from '../contexts/AuthContext';
import { getTeams, saveTeams, deleteTeam, updateTeam } from '../services/teamService';
import { buildDefaultTeamName, resolveTeamLeague } from '../utils/teamNaming';
import { getPlayers } from '../services/playerService';
import { getLeagueGroups } from '../services/tournamentService';

const TeamsPage = () => {
  const { isAdmin } = useAuth();
  // State for managing teams list (saved teams from DB)
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for preview teams (not saved yet)
  const [previewTeams, setPreviewTeams] = useState([]);
  const [saving, setSaving] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState('Expert');
  const [leagueGroups, setLeagueGroups] = useState([]);
  const [teamGroupMap, setTeamGroupMap] = useState({});

  // State for player counts (to show requirements)
  const [playerStats, setPlayerStats] = useState({
    total: 0,
    expertMen: 0,
    intermediateMen: 0,
    women: 0,
    players: [] // Store full player list for generation
  });

  // Load teams and player stats when component mounts
  useEffect(() => {
    loadTeams();
    loadPlayerStats();
  }, []);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await getLeagueGroups(selectedLeague);
        setLeagueGroups(data?.groups || []);
        setTeamGroupMap(data?.teamGroupMap || {});
      } catch {
        setLeagueGroups([]);
        setTeamGroupMap({});
      }
    };
    if (teams.length > 0) {
      loadGroups();
    }
  }, [selectedLeague, teams]);

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
      const expertMen = players.filter(p => p.expertise_level === 'Expert' && (p.category === 'Men' || !p.category)).length;
      const intermediateMen = players.filter(p => p.expertise_level === 'Intermediate' && (p.category === 'Men' || !p.category)).length;
      const women = players.filter(p => p.category === 'Women').length;

      setPlayerStats({
        total: players.length,
        expertMen,
        intermediateMen,
        women,
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
    const { players } = playerStats;

    // Split players by league buckets
    const expertMenPlayers = players.filter(
      p => p.expertise_level === 'Expert' && (p.category === 'Men' || !p.category)
    );
    const intermediateMenPlayers = players.filter(
      p => p.expertise_level === 'Intermediate' && (p.category === 'Men' || !p.category)
    );
    const womenPlayers = players.filter(p => p.category === 'Women');

    // Shuffle each bucket
    const shuffledExpertMen = shuffleArray(expertMenPlayers);
    const shuffledIntermediateMen = shuffleArray(intermediateMenPlayers);
    const shuffledWomen = shuffleArray(womenPlayers);

    // Create teams within the same league/category
    const generatedTeams = [];
    // Expert League (Men)
    for (let i = 0; i + 1 < shuffledExpertMen.length; i += 2) {
      const p1 = shuffledExpertMen[i];
      const p2 = shuffledExpertMen[i + 1];
      generatedTeams.push({
        team_name: buildDefaultTeamName(Math.floor(i / 2) + 1),
        player1_id: p1.id,
        player1_name: p1.name,
        player1_expertise: p1.expertise_level,
        player2_id: p2.id,
        player2_name: p2.name,
        player2_expertise: p2.expertise_level,
        league: 'Expert'
      });
    }
    // Intermediate League (Men)
    for (let i = 0; i + 1 < shuffledIntermediateMen.length; i += 2) {
      const p1 = shuffledIntermediateMen[i];
      const p2 = shuffledIntermediateMen[i + 1];
      generatedTeams.push({
        team_name: buildDefaultTeamName(Math.floor(i / 2) + 1),
        player1_id: p1.id,
        player1_name: p1.name,
        player1_expertise: p1.expertise_level,
        player2_id: p2.id,
        player2_name: p2.name,
        player2_expertise: p2.expertise_level,
        league: 'Intermediate'
      });
    }
    // Women League
    for (let i = 0; i + 1 < shuffledWomen.length; i += 2) {
      const p1 = shuffledWomen[i];
      const p2 = shuffledWomen[i + 1];
      generatedTeams.push({
        team_name: buildDefaultTeamName(Math.floor(i / 2) + 1),
        player1_id: p1.id,
        player1_name: p1.name,
        player1_expertise: p1.expertise_level,
        player2_id: p2.id,
        player2_name: p2.name,
        player2_expertise: p2.expertise_level,
        league: 'Women'
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

    // Determine if at least one league has an even count and enough players
    const expertOk = playerStats.expertMen >= 2 && playerStats.expertMen % 2 === 0;
    const intermediateOk = playerStats.intermediateMen >= 2 && playerStats.intermediateMen % 2 === 0;
    const womenOk = playerStats.women >= 2 && playerStats.women % 2 === 0;
    if (!expertOk && !intermediateOk && !womenOk) {
      setError(
        `Cannot generate teams. Need even numbers per league with at least 2 players. ` +
        `Expert: ${playerStats.expertMen}, Intermediate: ${playerStats.intermediateMen}, Women: ${playerStats.women}`
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

  const handleSaveTeamName = async (teamId, teamName) => {
    if (!teamName?.trim()) {
      setError('Team name cannot be empty');
      return;
    }
    try {
      setError(null);
      await updateTeam(teamId, { team_name: teamName.trim() });
      await loadTeams();
    } catch (err) {
      setError(err.message || 'Failed to update team name');
      throw err;
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
  const canGenerateTeams = (() => {
    if (playerStats.total <= 0) return false;
    const expertOk = playerStats.expertMen >= 2 && playerStats.expertMen % 2 === 0;
    const intermediateOk = playerStats.intermediateMen >= 2 && playerStats.intermediateMen % 2 === 0;
    const womenOk = playerStats.women >= 2 && playerStats.women % 2 === 0;
    return expertOk || intermediateOk || womenOk;
  })();

  const teamsByLeague = (league) =>
    teams.filter((team) => resolveTeamLeague(team) === league);

  const previewByLeague = (league) =>
    previewTeams.filter((team) => resolveTeamLeague(team) === league);

  const leagueTeamCounts = {
    Expert: teamsByLeague('Expert').length,
    Intermediate: teamsByLeague('Intermediate').length,
    Women: teamsByLeague('Women').length,
  };

  const activeTeams = teamsByLeague(selectedLeague);
  const activePreviewTeams = previewByLeague(selectedLeague);

  const getPreviewIndex = (leagueTeam) =>
    previewTeams.findIndex(
      (team) =>
        team.player1_id === leagueTeam.player1_id &&
        team.player2_id === leagueTeam.player2_id
    );

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
        {isAdmin && (
          <Button
            onClick={handleGenerateTeams}
            variant="primary"
            disabled={!canGenerateTeams || previewTeams.length > 0}
          >
            🎲 Generate Random Teams
          </Button>
        )}
      </div>

      {/* Requirements Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Team Generation Requirements:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li className={(playerStats.expertMen >= 2 && playerStats.expertMen % 2 === 0) ? 'text-green-700' : 'text-red-700'}>
            ✓ Expert League (Men): {playerStats.expertMen} players {playerStats.expertMen >= 2 && playerStats.expertMen % 2 === 0 ? '✓' : '✗'} (need even, ≥ 2)
          </li>
          <li className={(playerStats.intermediateMen >= 2 && playerStats.intermediateMen % 2 === 0) ? 'text-green-700' : 'text-red-700'}>
            ✓ Intermediate League (Men): {playerStats.intermediateMen} players {playerStats.intermediateMen >= 2 && playerStats.intermediateMen % 2 === 0 ? '✓' : '✗'} (need even, ≥ 2)
          </li>
          <li className={(playerStats.women >= 2 && playerStats.women % 2 === 0) ? 'text-green-700' : 'text-red-700'}>
            ✓ Women League: {playerStats.women} players {playerStats.women >= 2 && playerStats.women % 2 === 0 ? '✓' : '✗'} (need even, ≥ 2)
          </li>
          <li className="text-blue-700">
            → Teams are formed within the same league only (no mixed levels)
          </li>
        </ul>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-600">Total Teams</div>
          <div className="text-2xl font-bold text-gray-900">{teams.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-600">Expert Teams</div>
          <div className="text-2xl font-bold text-purple-600">{leagueTeamCounts.Expert}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-600">Intermediate Teams</div>
          <div className="text-2xl font-bold text-blue-600">{leagueTeamCounts.Intermediate}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-600">Women Teams</div>
          <div className="text-2xl font-bold text-pink-600">{leagueTeamCounts.Women}</div>
        </div>
      </div>

      <LeagueTabs
        selected={selectedLeague}
        onChange={setSelectedLeague}
        counts={leagueTeamCounts}
      />

      {!loading && activeTeams.length > 0 && leagueGroups.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-900">
          Group assignments appear after you generate the group-stage schedule on the{' '}
          <Link to="/matches" className="font-medium underline">
            Matches page
          </Link>
          .
        </div>
      )}

      {!loading && leagueGroups.length > 0 && (
        <GroupAssignmentsTable groups={leagueGroups} league={selectedLeague} />
      )}

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

          {activePreviewTeams.length === 0 ? (
            <div className="text-center py-8 text-yellow-800">
              No preview teams for {selectedLeague} league.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activePreviewTeams.map((team) => {
                const index = getPreviewIndex(team);
                return (
                  <TeamCardPreview
                    key={`${team.player1_id}-${team.player2_id}`}
                    team={team}
                    index={index}
                    onNameChange={handleTeamNameChange}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <strong>Error</strong>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="text-gray-600">Loading teams...</div>
        </div>
      )}

      {/* Teams Grid */}
      {!loading && (
        <>
          {teams.length === 0 && (
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
                    {playerStats.total > 0 && 'Need even numbers within at least one league (Expert Men, Intermediate Men, or Women)'}
                  </p>
                </div>
              )}
            </div>
          )}

          {teams.length > 0 && activeTeams.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-600 text-lg mb-2">
                No teams in {selectedLeague} league
              </p>
              <p className="text-gray-500 text-sm">
                Switch tabs to view teams from another league
              </p>
            </div>
          )}

          {activeTeams.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 4xl:grid-cols-4 gap-6">
              {activeTeams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  groupId={teamGroupMap[team.id]}
                  onDelete={handleDelete}
                  onSaveName={isAdmin ? handleSaveTeamName : undefined}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeamsPage;
