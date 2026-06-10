import { useState, useEffect } from 'react';
import Button from '../components/atoms/Button';
import MatchCard from '../components/molecules/MatchCard';
import MatchResultForm from '../components/molecules/MatchResultForm';
import { useAuth } from '../contexts/AuthContext';
import {
  getMatches,
  getMatchesByRound,
  generateMatchSchedule,
  createMultipleMatches,
  updateMatchResult,
  generateQuarterFinals,
  generateSemiFinals,
  generateFinal
} from '../services/matchService';
import { getTeams } from '../services/teamService';
import { getTournamentSetup } from '../services/tournamentService';
import TournamentSetupPanel from '../components/molecules/TournamentSetupPanel/TournamentSetupPanel';

const LEAGUES = [
  { value: 'Expert', label: 'Expert League' },
  { value: 'Intermediate', label: 'Intermediate League' },
  { value: 'Women', label: 'Women League' }
];

const getLeague = (item) => item.league || 'Expert';

const MatchesPage = () => {
  const { isAdmin } = useAuth();
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRound, setSelectedRound] = useState('Qualifying');
  const [showResultForm, setShowResultForm] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatingQF, setGeneratingQF] = useState(false);
  const [generatingSF, setGeneratingSF] = useState(false);
  const [generatingFinal, setGeneratingFinal] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState('Expert');
  const [setupOptions, setSetupOptions] = useState(null);
  const [selectedGroupCount, setSelectedGroupCount] = useState(null);

  const leagueTeams = teams.filter(t => getLeague(t) === selectedLeague);
  const leagueMatches = matches.filter(m => getLeague(m) === selectedLeague);
  const quarterFinalMatches = leagueMatches.filter((m) => m.round_type === 'Quarter Final');
  const semiFinalMatches = leagueMatches.filter((m) => m.round_type === 'Semi Final');
  const skipsSemiFinals = setupOptions?.defaultGroupCount === 2;
  const quarterFinalsComplete =
    quarterFinalMatches.length > 0 &&
    quarterFinalMatches.every((m) => m.status === 'Completed');
  const semiFinalsComplete =
    semiFinalMatches.length === 2 &&
    semiFinalMatches.every((m) => m.status === 'Completed');
  const canGenerateFinal =
    leagueMatches.filter((m) => m.round_type === 'Final').length === 0 &&
    (semiFinalsComplete || (skipsSemiFinals && quarterFinalMatches.length === 2 && quarterFinalsComplete));

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const loadSetup = async () => {
      try {
        const setup = await getTournamentSetup(selectedLeague);
        setSetupOptions(setup);
        const defaultCount = setup.defaultGroupCount ?? null;
        setSelectedGroupCount((prev) => {
          if (prev && setup.validGroupCounts?.includes(prev)) return prev;
          return defaultCount;
        });
      } catch {
        setSetupOptions(null);
      }
    };
    loadSetup();
  }, [selectedLeague, teams]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [matchesData, teamsData] = await Promise.all([
        getMatches(),
        getTeams()
      ]);
      setMatches(matchesData);
      setTeams(teamsData);
    } catch (err) {
      setError(err.message || 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };


  // Generate match schedule
  const handleGenerateSchedule = async () => {
    if (!setupOptions?.isValid) {
      setError(setupOptions?.rejectionReason || 'Cannot generate schedule with current team count.');
      return;
    }

    const groupCount = selectedGroupCount ?? setupOptions.defaultGroupCount;
    const matchCount =
      groupCount &&
      (groupCount *
        ((setupOptions.teamCount / groupCount) * (setupOptions.teamCount / groupCount - 1))) /
        2;

    const startDate = prompt('Enter start date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!startDate) return;

    let suggestedEnd = null;
    try {
      const hint = await getTournamentSetup(selectedLeague, { startDate, groupCount });
      suggestedEnd = hint.scheduling?.suggestedEndDate ?? null;
    } catch {
      // continue without hint
    }

    const endPrompt =
      matchCount > 0
        ? `Enter end date (YYYY-MM-DD).\n\n${matchCount} matches need ${matchCount} weekday evening slots (6 per day, Mon–Fri).\nSuggested minimum end date: ${suggestedEnd || 'n/a'}\n\nLeave empty for no end date:`
        : 'Enter end date (YYYY-MM-DD) - Leave empty for no end date:';

    const endDateInput = prompt(endPrompt, suggestedEnd || '');
    const endDate = endDateInput && endDateInput.trim() !== '' ? endDateInput.trim() : null;

    if (endDate && new Date(endDate) < new Date(startDate)) {
      setError('End date must be on or after start date');
      return;
    }

    const venue = prompt('Enter venue name:', 'Main Court') || 'Main Court';

    const existingQualifying = leagueMatches.filter((m) => m.round_type === 'Qualifying');
    const replaceExisting = existingQualifying.length > 0
      ? window.confirm(
          `${existingQualifying.length} qualifying match(es) already exist for ${selectedLeague} league. ` +
          `Replace them with a fresh schedule for all ${setupOptions.teamCount} teams?`
        )
      : false;

    if (existingQualifying.length > 0 && !replaceExisting) {
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const schedule = await generateMatchSchedule(startDate, endDate, venue, selectedLeague, {
        groupCount: selectedGroupCount ?? setupOptions.defaultGroupCount,
        replaceExisting,
      });

      if (!schedule.matches?.length) {
        throw new Error('No matches were returned from the schedule generator.');
      }

      await createMultipleMatches(schedule.matches);

      await loadData();

      let message = `Schedule generated! ${schedule.matches.length} qualifying matches created.`;
      if (schedule.expectedMatchCount && schedule.matches.length !== schedule.expectedMatchCount) {
        message += `\n\nWarning: expected ${schedule.expectedMatchCount} matches.`;
      }
      if (schedule.data?.dateRange?.totalDays) {
        message += `\n\nDate range: ${startDate} to ${endDate} (${schedule.data.dateRange.totalDays} day(s))`;
      } else if (endDate) {
        message += `\n\nDate range: ${startDate} to ${endDate}`;
      } else {
        message += `\n\nStarting from: ${startDate}`;
      }
      if (schedule.data?.additionalMatch) {
        message += `\n\n${schedule.data.additionalMatch.message}`;
      }
      if (schedule.data?.poolDifference > 1) {
        message += `\n\nNote: Pools have been redistributed to ensure equal team counts (${schedule.data.poolA.length} teams in Pool A, ${schedule.data.poolB.length} teams in Pool B).`;
      }
      alert(message);
    } catch (err) {
      setError(err.message || 'Failed to generate schedule');
      console.error('Error generating schedule:', err);
    } finally {
      setGenerating(false);
    }
  };

  // Filter matches by league and round
  const filteredMatches = selectedRound === 'all'
    ? leagueMatches
    : leagueMatches.filter(m => m.round_type === selectedRound);

  const groupPools = [
    ...new Set(
      leagueMatches
        .filter((m) => m.round_type === 'Qualifying' && m.pool)
        .map((m) => m.pool)
    ),
  ].sort();
  const qualifyingMatchesByPool = groupPools.reduce((acc, pool) => {
    acc[pool] = filteredMatches.filter(m => m.round_type === 'Qualifying' && m.pool === pool);
    return acc;
  }, {});

  const qualifyingCount = leagueMatches.filter((m) => m.round_type === 'Qualifying').length;
  const activeGroupCount = selectedGroupCount ?? setupOptions?.defaultGroupCount;
  const expectedQualifyingMatches =
    setupOptions?.isValid && activeGroupCount
      ? activeGroupCount *
        (((leagueTeams.length / activeGroupCount) * (leagueTeams.length / activeGroupCount - 1)) / 2)
      : null;
  const scheduleMismatch =
    expectedQualifyingMatches != null &&
    qualifyingCount > 0 &&
    qualifyingCount !== expectedQualifyingMatches;

  // Handle update result
  const handleUpdateResult = (match) => {
    setSelectedMatch(match);
    setShowResultForm(true);
  };

  // Handle winner change (for future use - standings update after save)
  const handleWinnerChange = (winnerId) => {
    // This is called when winner is selected in the form
    // Standings will update automatically after save via handleSaveResult
    // No need to reload here since data isn't saved yet
  };

  // Generate Quarter Finals
  const handleGenerateQuarterFinals = async () => {
    const qualifyingMatches = leagueMatches.filter(m => m.round_type === 'Qualifying');
    const completedQualifying = qualifyingMatches.filter(m => m.status === 'Completed');

    if (qualifyingMatches.length === 0) {
      setError('No qualifying matches found. Please generate schedule first.');
      return;
    }

    if (completedQualifying.length < qualifyingMatches.length) {
      setError(`Please complete all qualifying matches first. ${completedQualifying.length}/${qualifyingMatches.length} completed.`);
      return;
    }

    const existingQF = leagueMatches.filter(m => m.round_type === 'Quarter Final');
    if (existingQF.length > 0) {
      setError('Quarter Finals already generated. Delete existing Quarter Final matches to regenerate.');
      return;
    }

    const startDate = prompt('Enter start date for Quarter Finals (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!startDate) return;

    const venue = prompt('Enter venue name:', 'Main Court') || 'Main Court';

    try {
      setGeneratingQF(true);
      setError(null);

      const result = await generateQuarterFinals(startDate, venue, selectedLeague);
      console.log('Quarter Finals generation result:', result);

      // Reload matches
      await loadData();

      // Handle response structure - API interceptor returns response.data
      // Backend sends: { success: true, data: { matches: [...] } }
      // Interceptor returns: response.data = { success: true, data: { matches: [...] } }
      const matchesCreated = result?.data?.matches?.length || result?.matches?.length || 0;
      alert(`Quarter Finals generated! ${matchesCreated} matches created.`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate Quarter Finals');
      console.error('Error generating Quarter Finals:', err);
    } finally {
      setGeneratingQF(false);
    }
  };

  // Generate Semi Finals
  const handleGenerateSemiFinals = async () => {
    const quarterFinals = leagueMatches.filter(m => m.round_type === 'Quarter Final');
    const completedQF = quarterFinals.filter(m => m.status === 'Completed');

    if (quarterFinals.length === 0) {
      setError('No Quarter Final matches found. Please generate Quarter Finals first.');
      return;
    }

    if (completedQF.length < quarterFinals.length) {
      setError(`Please complete all Quarter Final matches first. ${completedQF.length}/${quarterFinals.length} completed.`);
      return;
    }

    const existingSF = leagueMatches.filter(m => m.round_type === 'Semi Final');
    if (existingSF.length > 0) {
      setError('Semi Finals already generated. Delete existing Semi Final matches to regenerate.');
      return;
    }

    const startDate = prompt('Enter start date for Semi Finals (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!startDate) return;

    const venue = prompt('Enter venue name:', 'Main Court') || 'Main Court';

    try {
      setGeneratingSF(true);
      setError(null);

      const result = await generateSemiFinals(startDate, venue, selectedLeague);

      // Reload matches
      await loadData();

      // Handle response structure - API interceptor returns response.data
      const matchesCreated = result?.data?.matches?.length || result?.matches?.length || 0;
      alert(`Semi Finals generated! ${matchesCreated} matches created.`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate Semi Finals');
      console.error('Error generating Semi Finals:', err);
    } finally {
      setGeneratingSF(false);
    }
  };

  // Generate Final
  const handleGenerateFinal = async () => {
    if (!canGenerateFinal) {
      if (skipsSemiFinals) {
        setError('Complete both Quarter Final matches before generating the Final.');
      } else {
        setError('Complete all Semi Final matches before generating the Final.');
      }
      return;
    }

    const existingFinal = leagueMatches.filter(m => m.round_type === 'Final');
    if (existingFinal.length > 0) {
      setError('Final already generated. Delete existing Final match to regenerate.');
      return;
    }

    const startDate = prompt('Enter start date for Final (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!startDate) return;

    const venue = prompt('Enter venue name:', 'Main Court') || 'Main Court';

    try {
      setGeneratingFinal(true);
      setError(null);

      const result = await generateFinal(startDate, venue, selectedLeague);

      // Reload matches
      await loadData();

      alert(`Final generated! The championship match is ready.`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate Final');
      console.error('Error generating Final:', err);
    } finally {
      setGeneratingFinal(false);
    }
  };

  const handleSaveResult = async (resultData) => {
    try {
      // Update match result in database
      await updateMatchResult(selectedMatch.id, resultData);

      // Close the form
      setShowResultForm(false);
      setSelectedMatch(null);

      // Wait a brief moment to ensure database transaction is complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Reload matches to show updated results
      const [matchesData, teamsData] = await Promise.all([
        getMatches(),
        getTeams()
      ]);

      // Update matches and teams state
      setMatches(matchesData);
      setTeams(teamsData);

      // Log for debugging
      console.log('Match result saved');
    } catch (err) {
      setError(err.message || 'Failed to update match result');
      console.error('Error updating result:', err);
    }
  };

  const rounds = [
    { value: 'Qualifying', label: 'Qualifying Round' },
    { value: 'Quarter Final', label: 'Quarter Finals' },
    { value: 'Semi Final', label: 'Semi Finals' },
    { value: 'Final', label: 'Final' },
    { value: 'Third Place', label: 'Third Place' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Matches</h2>
          <p className="text-gray-600 mt-1">
            Tournament match schedule and results
          </p>
        </div>
      </div>

      {scheduleMismatch && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
          <p className="font-medium">Schedule does not match your team count</p>
          <p className="mt-1">
            {leagueTeams.length} teams in {selectedLeague} league need{' '}
            <strong>{expectedQualifyingMatches}</strong> qualifying matches ({activeGroupCount} groups), but only{' '}
            <strong>{qualifyingCount}</strong> are scheduled. Regenerate the group stage to include every team.
          </p>
        </div>
      )}

      {isAdmin && (qualifyingCount === 0 || scheduleMismatch) && (
        <TournamentSetupPanel
          setupOptions={setupOptions}
          selectedGroupCount={selectedGroupCount}
          onGroupCountChange={setSelectedGroupCount}
          onGenerate={handleGenerateSchedule}
          generating={generating}
          isAdmin={isAdmin}
        />
      )}

      {/* League Selector */}
      <div className="flex gap-2 flex-wrap">
        {LEAGUES.map(league => (
          <Button
            key={league.value}
            onClick={() => setSelectedLeague(league.value)}
            variant={selectedLeague === league.value ? 'primary' : 'outline'}
            size="sm"
          >
            {league.label}
          </Button>
        ))}
      </div>

      {/* Requirements */}
      {setupOptions && !setupOptions.isValid && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            <strong>Note:</strong> {setupOptions.rejectionReason}
          </p>
        </div>
      )}

      {/* Round Filter */}
      {leagueMatches.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {rounds.map(round => (
            <Button
              key={round.value}
              onClick={() => setSelectedRound(round.value)}
              variant={selectedRound === round.value ? 'primary' : 'outline'}
              size="sm"
            >
              {round.label}
            </Button>
          ))}
        </div>
      )}


      {/* Generate Quarter Finals Button */}
      {selectedRound === 'Qualifying' &&
        leagueMatches.filter(m => m.round_type === 'Qualifying').length > 0 &&
        leagueMatches.filter(m => m.round_type === 'Qualifying').every(m => m.status === 'Completed') &&
        leagueMatches.filter(m => m.round_type === 'Quarter Final').length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 font-medium">
                  ✅ All qualifying matches completed!
                </p>
                <p className="text-green-600 text-sm mt-1">
                  Top 2 teams from each group are ready. Generate Quarter Finals to proceed.
                </p>
              </div>
              {isAdmin && (
                <Button
                  onClick={handleGenerateQuarterFinals}
                  variant="primary"
                  disabled={generatingQF}
                >
                  {generatingQF ? 'Generating...' : '🏆 Generate Quarter Finals'}
                </Button>
              )}
            </div>
          </div>
        )}

      {/* Generate Semi Finals Button (4-group knockout) */}
      {selectedRound === 'Quarter Final' &&
        quarterFinalMatches.length === 4 &&
        quarterFinalsComplete &&
        semiFinalMatches.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 font-medium">
                  ✅ All Quarter Final matches completed!
                </p>
                <p className="text-green-600 text-sm mt-1">
                  Top 4 teams are ready. Generate Semi Finals to proceed.
                </p>
              </div>
              {isAdmin && (
                <Button
                  onClick={handleGenerateSemiFinals}
                  variant="primary"
                  disabled={generatingSF}
                >
                  {generatingSF ? 'Generating...' : '🏆 Generate Semi Finals'}
                </Button>
              )}
            </div>
          </div>
        )}

      {/* Generate Final (from Semi Finals or directly after 2 Quarter Finals) */}
      {canGenerateFinal &&
        (selectedRound === 'Semi Final' ||
          (selectedRound === 'Quarter Final' && skipsSemiFinals && quarterFinalMatches.length === 2)) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 font-medium">
                  {semiFinalsComplete
                    ? '✅ All Semi Final matches completed!'
                    : '✅ All Quarter Final matches completed!'}
                </p>
                <p className="text-green-600 text-sm mt-1">
                  {skipsSemiFinals && quarterFinalMatches.length === 2
                    ? 'Top 2 teams are ready. Generate the Final (this league skips Semi Finals).'
                    : 'Top 2 teams are ready. Generate Final to determine the champion.'}
                </p>
              </div>
              {isAdmin && (
                <Button
                  onClick={handleGenerateFinal}
                  variant="primary"
                  disabled={generatingFinal}
                >
                  {generatingFinal ? 'Generating...' : '🏆 Generate Final'}
                </Button>
              )}
            </div>
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
          <div className="text-gray-600">Loading matches...</div>
        </div>
      )}

      {/* Matches Display */}
      {!loading && leagueMatches.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-6xl mb-4">🏓</div>
          <p className="text-gray-600 text-lg mb-2">No matches scheduled yet</p>
          <p className="text-gray-500 text-sm mb-6">
            Click "Generate Schedule" to create the tournament schedule
          </p>
        </div>
      )}

      {/* Qualifying Round - Show by Pool */}
      {!loading && selectedRound === 'Qualifying' && (
        <div className="space-y-6">
          {groupPools.map((pool) =>
            qualifyingMatchesByPool[pool]?.length > 0 ? (
              <div key={pool}>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Group {pool} Matches</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 4xl:grid-cols-4 gap-6">
                  {qualifyingMatchesByPool[pool].map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      onUpdateResult={handleUpdateResult}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      )}

      {/* Quarter Finals, Semi Finals, and Final - Show all matches */}
      {!loading && ['Quarter Final', 'Semi Final', 'Final', 'Third Place'].includes(selectedRound) && filteredMatches.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {selectedRound === 'Quarter Final' && 'Quarter Final Matches'}
            {selectedRound === 'Semi Final' && 'Semi Final Matches'}
            {selectedRound === 'Final' && 'Final Match'}
            {selectedRound === 'Third Place' && 'Third Place Match'}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 4xl:grid-cols-4 gap-6">
            {filteredMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onUpdateResult={handleUpdateResult}
              />
            ))}
          </div>
        </div>
      )}

      {/* No matches for selected round */}
      {!loading && ['Quarter Final', 'Semi Final', 'Final', 'Third Place'].includes(selectedRound) && filteredMatches.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-6xl mb-4">🏓</div>
          <p className="text-gray-600 text-lg mb-2">No {selectedRound.toLowerCase()} matches yet</p>
          <p className="text-gray-500 text-sm">
            {selectedRound === 'Quarter Final' && 'Complete all qualifying matches to generate Quarter Finals.'}
            {selectedRound === 'Semi Final' && 'Complete all Quarter Final matches to generate Semi Finals.'}
            {selectedRound === 'Final' && 'Complete all Semi Final matches to generate the Final.'}
          </p>
        </div>
      )}

      {/* Result Form Modal */}
      {showResultForm && selectedMatch && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <MatchResultForm
                match={selectedMatch}
                onSubmit={handleSaveResult}
                onCancel={() => {
                  setShowResultForm(false);
                  setSelectedMatch(null);
                }}
                onWinnerChange={handleWinnerChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchesPage;


