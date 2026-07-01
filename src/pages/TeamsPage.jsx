import Button from '@/components/atoms/Button';
import DivisionTabs from '@/components/molecules/DivisionTabs';
import GroupAssignmentsTable from '@/components/molecules/GroupAssignmentsTable';
import TeamCard from '@/components/molecules/TeamCard';
import TeamCardPreview from '@/components/molecules/TeamCardPreview';
import { buildDivisionMap, countPlayersByDivision, DEFAULT_TOURNAMENT_DIVISION, DIVISIONS, filterPlayersForDivision, getCompetitionFormatLabel } from '@/constants/divisions';
import { DEFAULT_TOURNAMENT_FORMAT, getTournamentFormatLabel, TOURNAMENT_FORMATS } from '@/constants/tournamentFormats';
import { useAuth } from '@/contexts/AuthContext';
import { getDivisionSettings, updateDivisionFormat, updateDivisionTournamentFormat } from '@/services/divisionService';
import { getPlayers } from '@/services/playerService';
import { getEffectivePairingRules } from '@/services/teamPairingRuleService';
import { deleteTeam, getTeams, saveTeamsForDivision, updateTeam } from '@/services/teamService';
import { getDivisionGroups } from '@/services/tournamentService';
import { showConfirm, showSuccess } from '@/utils/sweetAlert';
import { buildDefaultTeamName, resolveTeamDivision } from '@/utils/teamNaming';
import { buildDoublesTeamsWithPairingRules } from '@shared/tournament/teamPairing.js';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const EMPTY_PREVIEW = buildDivisionMap([]);
const DEFAULT_FORMATS = buildDivisionMap('doubles');
const DEFAULT_TOURNAMENT_FORMATS = buildDivisionMap(DEFAULT_TOURNAMENT_FORMAT);

const getDivisionPlayerCount = (playerStats, division) =>
  playerStats.countsByDivision?.[division] ?? 0;

const canGenerateForDivision = (playerStats, division, competitionFormat = 'doubles') => {
  const count = getDivisionPlayerCount(playerStats, division);
  return count >= 2 && count % 2 === 0;
};

const getFormatRequirementText = (competitionFormat) =>
  competitionFormat === 'singles'
    ? 'each player competes individually (even count, ≥ 2)'
    : 'players are paired into 2-player teams (even count, ≥ 2)';

const getPlayersForDivision = (players, division) => filterPlayersForDivision(players, division);

const TeamsPage = () => {
  const { isAdmin } = useAuth();
  // State for managing teams list (saved teams from DB)
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for preview teams per division (not saved yet)
  const [previewTeamsByDivision, setPreviewTeamsByDivision] = useState({ ...EMPTY_PREVIEW });
  const [saving, setSaving] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState(DEFAULT_TOURNAMENT_DIVISION);
  const [divisionFormats, setDivisionFormats] = useState({ ...DEFAULT_FORMATS });
  const [divisionTournamentFormats, setDivisionTournamentFormats] = useState({ ...DEFAULT_TOURNAMENT_FORMATS });
  const [formatSaving, setFormatSaving] = useState(false);
  const [divisionGroups, setDivisionGroups] = useState([]);
  const [teamGroupMap, setTeamGroupMap] = useState({});

  // State for player counts (to show requirements)
  const [playerStats, setPlayerStats] = useState({
    total: 0,
    countsByDivision: buildDivisionMap(0),
    players: [],
  });

  // Load teams and player stats when component mounts
  useEffect(() => {
    loadTeams();
    loadPlayerStats();
    loadDivisionFormats();
  }, []);

  const loadDivisionFormats = async () => {
    try {
      const settings = await getDivisionSettings();
      const formats = { ...DEFAULT_FORMATS };
      const tournamentFormats = { ...DEFAULT_TOURNAMENT_FORMATS };
      for (const row of settings) {
        formats[row.division] = row.competition_format || 'doubles';
        tournamentFormats[row.division] = row.tournament_format || DEFAULT_TOURNAMENT_FORMAT;
      }
      setDivisionFormats(formats);
      setDivisionTournamentFormats(tournamentFormats);
    } catch (err) {
      console.error('Error loading division formats:', err);
    }
  };

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await getDivisionGroups(selectedDivision);
        setDivisionGroups(data?.groups || []);
        setTeamGroupMap(data?.teamGroupMap || {});
      } catch {
        setDivisionGroups([]);
        setTeamGroupMap({});
      }
    };
    if (teams.length > 0) {
      loadGroups();
    }
  }, [selectedDivision, teams]);

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
      const countsByDivision = countPlayersByDivision(players);

      setPlayerStats({
        total: players.length,
        countsByDivision,
        players,
      });
    } catch (err) {
      console.error('Error loading player stats:', err);
    }
  };

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const generateTeamsLocally = async (division, competitionFormat) => {
    const bucketPlayers = getPlayersForDivision(playerStats.players, division);
    if (!canGenerateForDivision(playerStats, division, competitionFormat)) {
      return [];
    }

    const singles = competitionFormat === 'singles';
    const generatedTeams = [];

    if (singles) {
      const shuffledPlayers = shuffleArray(bucketPlayers);
      for (let i = 0; i < shuffledPlayers.length; i += 1) {
        const player = shuffledPlayers[i];
        generatedTeams.push({
          team_name: String(player.name || '').trim() || buildDefaultTeamName(i + 1),
          player1_id: player.id,
          player1_name: player.name,
          player1_expertise: player.expertise_level,
          player2_id: null,
          player2_name: null,
          player2_expertise: null,
          division,
        });
      }
      return generatedTeams;
    }

    const pairingRules = await getEffectivePairingRules();
    const teamPairs = buildDoublesTeamsWithPairingRules(bucketPlayers, pairingRules, division);

    for (let i = 0; i < teamPairs.length; i += 1) {
      const [p1, p2] = teamPairs[i];
      generatedTeams.push({
        team_name: buildDefaultTeamName(i + 1),
        player1_id: p1.id,
        player1_name: p1.name,
        player1_expertise: p1.expertise_level,
        player2_id: p2.id,
        player2_name: p2.name,
        player2_expertise: p2.expertise_level,
        division,
      });
    }

    return generatedTeams;
  };

  const handleFormatChange = async (newFormat) => {
    if (newFormat === selectedCompetitionFormat) return;

    const existingDivisionTeams = teamsByDivision(selectedDivision);
    if (existingDivisionTeams.length > 0) {
      setError(
        `Cannot change format while teams exist in ${selectedDivisionLabel}. Delete teams first.`
      );
      return;
    }

    try {
      setFormatSaving(true);
      setError(null);
      await updateDivisionFormat(selectedDivision, newFormat);
      setDivisionFormats((prev) => ({ ...prev, [selectedDivision]: newFormat }));
      setPreviewTeamsByDivision((prev) => ({ ...prev, [selectedDivision]: [] }));
    } catch (err) {
      setError(err.message || 'Failed to update competition format');
    } finally {
      setFormatSaving(false);
    }
  };

  const handleTournamentFormatChange = async (newFormat) => {
    if (newFormat === selectedTournamentFormat) return;

    const existingDivisionTeams = teamsByDivision(selectedDivision);
    if (existingDivisionTeams.length > 0) {
      setError(
        `Cannot change tournament format while teams exist in ${selectedDivisionLabel}. Delete teams first.`
      );
      return;
    }

    try {
      setFormatSaving(true);
      setError(null);
      await updateDivisionTournamentFormat(selectedDivision, newFormat);
      setDivisionTournamentFormats((prev) => ({ ...prev, [selectedDivision]: newFormat }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update tournament format');
    } finally {
      setFormatSaving(false);
    }
  };

  const handleGenerateTeams = async () => {
    const divisionLabel = DIVISIONS.find((l) => l.value === selectedDivision)?.label || selectedDivision;

    if (playerStats.total === 0) {
      setError('No players found. Please add players first.');
      return;
    }

    if (!canGenerateForDivision(playerStats, selectedDivision, selectedCompetitionFormat)) {
      const count = getDivisionPlayerCount(playerStats, selectedDivision);
      setError(
        `Cannot generate ${divisionLabel} ${selectedCompetitionFormat === 'singles' ? 'entrants' : 'teams'}. Need an even number of players (≥ 2). Found ${count}.`
      );
      return;
    }

    const existingDivisionTeams = teamsByDivision(selectedDivision);
    if (existingDivisionTeams.length > 0 || activePreviewTeams.length > 0) {
      const confirmed = await showConfirm({
        title: 'Generate new team preview?',
        text:
          `This will create a new preview for ${divisionLabel}. Saving will replace ${existingDivisionTeams.length} existing team(s) in this division only. Other divisions are not affected.`,
        confirmText: 'Continue',
      });
      if (!confirmed) {
        return;
      }
    }

    setError(null);
    try {
      const generatedTeams = await generateTeamsLocally(selectedDivision, selectedCompetitionFormat);
      setPreviewTeamsByDivision((prev) => ({
        ...prev,
        [selectedDivision]: generatedTeams,
      }));

      setTimeout(() => {
        document.getElementById('preview-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError(err.message || 'Failed to generate teams');
    }
  };

  const handleTeamNameChange = (index, newName) => {
    setPreviewTeamsByDivision((prev) => {
      const divisionPreview = [...(prev[selectedDivision] || [])];
      divisionPreview[index] = { ...divisionPreview[index], team_name: newName };
      return { ...prev, [selectedDivision]: divisionPreview };
    });
  };

  const handleConfirmAndSave = async () => {
    if (activePreviewTeams.length === 0) {
      setError('No teams to save for this division');
      return;
    }

    const divisionLabel = DIVISIONS.find((l) => l.value === selectedDivision)?.label || selectedDivision;
    const confirmed = await showConfirm({
      title: 'Save teams?',
      text:
        `Save ${activePreviewTeams.length} team(s) to ${divisionLabel}? This replaces existing teams and matches for this division only.`,
      confirmText: 'Save teams',
    });
    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await saveTeamsForDivision(activePreviewTeams, selectedDivision);

      setPreviewTeamsByDivision((prev) => ({ ...prev, [selectedDivision]: [] }));
      await loadTeams();

      await showSuccess(
        'Teams saved',
        `Successfully saved ${activePreviewTeams.length} team(s) to ${divisionLabel}!`
      );
    } catch (err) {
      setError(err.message || 'Failed to save teams');
      console.error('Error saving teams:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelPreview = async () => {
    const confirmed = await showConfirm({
      title: 'Discard preview?',
      text: `Discard preview teams for ${selectedDivision} division?`,
      confirmText: 'Discard',
      icon: 'warning',
      variant: 'danger',
    });
    if (confirmed) {
      setPreviewTeamsByDivision((prev) => ({ ...prev, [selectedDivision]: [] }));
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
    const confirmed = await showConfirm({
      title: 'Delete team?',
      text: 'Are you sure you want to delete this team?',
      confirmText: 'Delete',
      icon: 'warning',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await deleteTeam(teamId);
      loadTeams();
    } catch (err) {
      setError(err.message || 'Failed to delete team');
      console.error('Error deleting team:', err);
    }
  };

  const teamsByDivision = (division) =>
    teams.filter((team) => resolveTeamDivision(team) === division);

  const selectedDivisionLabel =
    DIVISIONS.find((l) => l.value === selectedDivision)?.label || selectedDivision;

  const selectedCompetitionFormat = divisionFormats[selectedDivision] || 'doubles';
  const selectedTournamentFormat = divisionTournamentFormats[selectedDivision] || DEFAULT_TOURNAMENT_FORMAT;
  const isSinglesDivision = selectedCompetitionFormat === 'singles';
  const entrantLabel = isSinglesDivision ? 'entrants' : 'teams';
  const entrantLabelSingular = isSinglesDivision ? 'entrant' : 'team';

  const canGenerateForSelectedDivision = canGenerateForDivision(
    playerStats,
    selectedDivision,
    selectedCompetitionFormat
  );

  const activePreviewTeams = previewTeamsByDivision[selectedDivision] || [];
  const hasPreviewForSelected = activePreviewTeams.length > 0;

  const divisionTeamCounts = Object.fromEntries(
    DIVISIONS.map((d) => [d.value, teamsByDivision(d.value).length])
  );

  const activeTeams = teamsByDivision(selectedDivision);

  const getPreviewIndex = (divisionTeam) =>
    activePreviewTeams.findIndex((team) => {
      if (team.player1_id !== divisionTeam.player1_id) return false;
      if (selectedCompetitionFormat === 'singles') return true;
      return team.player2_id === divisionTeam.player2_id;
    });

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Teams</h2>
          <p className="text-gray-600 mt-1">
            {isAdmin
              ? 'Manage teams per division — each division has its own generation and tournament flow'
              : 'Browse teams per division — read-only view'}
          </p>
        </div>
        {isAdmin && (
          <Link
            to="/admin/team-pairing"
            className="text-sm text-gray-500 hover:text-gray-800 underline"
          >
            Doubles pairing rules
          </Link>
        )}
      </div>

      {/* Requirements Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">
          {isAdmin ? 'Generation Requirements' : 'Division overview'}
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          {DIVISIONS.map((division) => {
            const count = getDivisionPlayerCount(playerStats, division.value);
            const format = divisionFormats[division.value] || 'doubles';
            const ok = count >= 2 && count % 2 === 0;
            return (
              <li key={division.value} className={ok ? 'text-green-700' : 'text-red-700'}>
                {division.label}: {count} players — {format === 'singles' ? 'singles' : 'doubles'} ({getFormatRequirementText(format)})
              </li>
            );
          })}
          {isAdmin && (
            <li className="text-blue-700">
              Each division can be singles or doubles — choose the format before generating {entrantLabel}.
              {!isSinglesDivision && ' Doubles generation uses pairing rules when configured.'}
            </li>
          )}
        </ul>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-600">Total Teams</div>
          <div className="text-2xl font-bold text-gray-900">{teams.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-600">{selectedDivisionLabel}</div>
          <div className="text-2xl font-bold text-purple-600">{divisionTeamCounts[selectedDivision] || 0}</div>
        </div>
      </div>

      <DivisionTabs
        selected={selectedDivision}
        onChange={setSelectedDivision}
        counts={divisionTeamCounts}
      />

      {isAdmin && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-gray-900">{selectedDivisionLabel}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Competition: <span className="font-medium">{getCompetitionFormatLabel(selectedCompetitionFormat)}</span>
                {' · '}
                Tournament: <span className="font-medium">{getTournamentFormatLabel(selectedTournamentFormat)}</span>
                {' — '}
                Generate and save {entrantLabel} for this division only.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-700">Competition format:</span>
              <select
                value={selectedCompetitionFormat}
                onChange={(e) => handleFormatChange(e.target.value)}
                disabled={formatSaving || activeTeams.length > 0}
                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white disabled:opacity-60"
                aria-label={`Competition format for ${selectedDivisionLabel}`}
              >
                <option value="doubles">Doubles (2-player teams)</option>
                <option value="singles">Singles (individual players)</option>
              </select>
              <span className="text-sm text-gray-700 ml-2">Tournament format:</span>
              <select
                value={selectedTournamentFormat}
                onChange={(e) => handleTournamentFormatChange(e.target.value)}
                disabled={formatSaving || activeTeams.length > 0}
                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white disabled:opacity-60"
                aria-label={`Tournament format for ${selectedDivisionLabel}`}
              >
                {TOURNAMENT_FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              {activeTeams.length > 0 && (
                <span className="text-xs text-amber-700">Delete existing {entrantLabel} to change formats</span>
              )}
            </div>
          </div>
          <Button
            onClick={handleGenerateTeams}
            variant="primary"
            disabled={!canGenerateForSelectedDivision || hasPreviewForSelected}
          >
            🎲 Generate {selectedDivisionLabel} {isSinglesDivision ? 'Entrants' : 'Teams'}
          </Button>
        </div>
      )}

      {!loading && activeTeams.length > 0 && divisionGroups.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-900">
          {isAdmin ? (
            <>
              Group assignments appear after you generate the group-stage schedule on the{' '}
              <Link to="/matches" className="font-medium underline">
                Matches page
              </Link>
              .
            </>
          ) : (
            'Group assignments will appear here once the group-stage schedule is published.'
          )}
        </div>
      )}

      {!loading && divisionGroups.length > 0 && (
        <GroupAssignmentsTable groups={divisionGroups} division={selectedDivision} />
      )}

      {/* Preview Section — admin only */}
      {isAdmin && hasPreviewForSelected && (
        <div id="preview-section" className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-yellow-900">{selectedDivisionLabel} — Preview {isSinglesDivision ? 'Entrants' : 'Teams'}</h3>
              <p className="text-sm text-yellow-800 mt-1">
                Review and edit team names before saving. Only this division will be updated.
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
              No preview teams for {selectedDivision} division.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activePreviewTeams.map((team) => {
                const index = getPreviewIndex(team);
                return (
                  <TeamCardPreview
                    key={`${team.player1_id}-${team.player2_id ?? 'singles'}`}
                    team={team}
                    index={index}
                    onNameChange={handleTeamNameChange}
                    isSingles={isSinglesDivision}
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
                {isAdmin
                  ? `Select a division tab and click "Generate … Teams" to create teams for that division`
                  : 'Teams will appear here once they are created for a division'}
              </p>
              {isAdmin && !canGenerateForSelectedDivision && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-yellow-800 text-sm">
                    {playerStats.total === 0 && 'Add players first'}
                    {playerStats.total > 0 &&
                      `${selectedDivisionLabel} needs an even number of players (≥ 2)`}
                  </p>
                </div>
              )}
            </div>
          )}

          {teams.length > 0 && activeTeams.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-600 text-lg mb-2">
                No teams in {selectedDivisionLabel}
              </p>
              <p className="text-gray-500 text-sm">
                {isAdmin
                  ? 'Use the generate button above to create teams for this division'
                  : 'No teams are registered for this division yet.'}
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
                  isSingles={team.player2_id == null}
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
