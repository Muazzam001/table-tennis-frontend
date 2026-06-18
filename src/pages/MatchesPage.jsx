import { useState, useEffect } from 'react';
import Button from '@/components/atoms/Button';
import MatchCard from '@/components/molecules/MatchCard';
import MatchResultForm from '@/components/molecules/MatchResultForm';
import DivisionTabs from '@/components/molecules/DivisionTabs';
import { useAuth } from '@/contexts/AuthContext';
import {
  getMatches,
  getMatchesByRound,
  generateMatchSchedule,
  updateMatchResult,
  generateQuarterFinals,
  generateSemiFinals,
  generateFinal,
} from '@/services/matchService';
import { getTeams } from '@/services/teamService';
import { getTournamentSetup } from '@/services/tournamentService';
import TournamentSetupPanel from '@/components/molecules/TournamentSetupPanel/TournamentSetupPanel';
import ScheduleWizard from '@/components/molecules/ScheduleWizard';
import {
  getMatchSetConfig,
  resetMatchSetConfig,
  saveMatchSetConfig,
} from '@/config/matchSetConfig';
import { getTimeSlotConfig, getTimeSlotSummary, saveTimeSlotConfig } from '@/config/timeSlotConfig';
import { getCourtConfig, getCourtSummary, saveCourtConfig } from '@/config/courtConfig';
import { showSuccess } from '@/utils/sweetAlert';
import { DIVISIONS } from '@/constants/divisions';

const getDivision = (item) => item?.division ?? null;

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
  const [selectedDivision, setSelectedDivision] = useState('Expert');
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupOptions, setSetupOptions] = useState(null);
  const [selectedGroupCount, setSelectedGroupCount] = useState(null);
  const [setConfig, setSetConfig] = useState(getMatchSetConfig);
  const [timeSlotConfig, setTimeSlotConfig] = useState(getTimeSlotConfig);
  const [courtConfig, setCourtConfig] = useState(getCourtConfig);
  const [scheduleWizard, setScheduleWizard] = useState(null);
  const timeSlotSummary = getTimeSlotSummary(timeSlotConfig);
  const courtSummary = getCourtSummary(courtConfig);
  const matchesPerWeekday = timeSlotSummary.slotsPerWeekday * courtConfig.courtCount;

  const divisionTeams = teams.filter(t => getDivision(t) === selectedDivision);
  const divisionMatches = matches.filter(m => getDivision(m) === selectedDivision);
  const quarterFinalMatches = divisionMatches.filter((m) => m.round_type === 'Quarter Final');
  const semiFinalMatches = divisionMatches.filter((m) => m.round_type === 'Semi Final');
  const isSingleGroup = Boolean(
    setupOptions?.isSingleGroup || setupOptions?.suggestedConfig?.format === 'single-group'
  );
  const configuredTeamCount = setupOptions?.teamCount ?? divisionTeams.length;
  const skipsQuarterFinals = isSingleGroup;
  const skipsSemiFinals = isSingleGroup
    ? configuredTeamCount === 4
    : setupOptions?.defaultGroupCount === 2;
  const qualifyingMatches = divisionMatches.filter((m) => m.round_type === 'Qualifying');
  const qualifyingComplete =
    qualifyingMatches.length > 0 &&
    qualifyingMatches.every((m) => m.status === 'Completed');
  const firstKnockoutLabel = isSingleGroup
    ? configuredTeamCount === 4
      ? '🏆 Generate Final'
      : '🏆 Generate Semi Finals'
    : '🏆 Generate Quarter Finals';
  const canGenerateFirstKnockout =
    qualifyingComplete &&
    quarterFinalMatches.length === 0 &&
    semiFinalMatches.length === 0 &&
    divisionMatches.filter((m) => m.round_type === 'Final').length === 0;

  const quarterFinalsComplete =
    quarterFinalMatches.length > 0 &&
    quarterFinalMatches.every((m) => m.status === 'Completed');
  const semiFinalsComplete =
    semiFinalMatches.length === 2 &&
    semiFinalMatches.every((m) => m.status === 'Completed');
  const canGenerateFinal =
    divisionMatches.filter((m) => m.round_type === 'Final').length === 0 &&
    (semiFinalsComplete || (skipsSemiFinals && quarterFinalMatches.length === 2 && quarterFinalsComplete));

  // Load data when division changes
  useEffect(() => {
    loadData(selectedDivision);
  }, [selectedDivision]);

  useEffect(() => {
    let cancelled = false;

    const loadSetup = async () => {
      setSetupLoading(true);
      setSetupOptions(null);
      setSelectedGroupCount(null);
      try {
        const setup = await getTournamentSetup(selectedDivision, {
          timeSlotConfig,
          courtConfig,
        });
        if (cancelled) return;
        setSetupOptions(setup);
        const defaultCount = setup?.defaultGroupCount ?? null;
        setSelectedGroupCount(defaultCount);
      } catch {
        if (!cancelled) {
          setSetupOptions(null);
        }
      } finally {
        if (!cancelled) {
          setSetupLoading(false);
        }
      }
    };

    loadSetup();
    setSelectedRound('Qualifying');
    setError(null);

    return () => {
      cancelled = true;
    };
  }, [selectedDivision, timeSlotConfig, courtConfig]);

  const selectedDivisionLabel =
    DIVISIONS.find((l) => l.value === selectedDivision)?.label || selectedDivision;

  const setupReadyForDivision =
    setupOptions?.division === selectedDivision && !setupLoading;

  const closeScheduleWizard = () => setScheduleWizard(null);

  const openGroupStageWizard = () => {
    if (!setupReadyForDivision) {
      setError(`Loading tournament setup for ${selectedDivisionLabel}…`);
      return;
    }
    if (!setupOptions?.isValid) {
      setError(setupOptions?.rejectionReason || 'Cannot generate schedule with current team count.');
      return;
    }
    if (setupOptions.division !== selectedDivision) {
      setError(`Tournament setup is out of date for ${selectedDivisionLabel}. Please wait a moment and try again.`);
      return;
    }

    const groupCount = selectedGroupCount ?? setupOptions.defaultGroupCount;
    const matchCount =
      groupCount &&
      (groupCount *
        ((setupOptions.teamCount / groupCount) * (setupOptions.teamCount / groupCount - 1))) /
      2;

    setError(null);
    setScheduleWizard({
      mode: 'group-stage',
      title: `Create ${selectedDivisionLabel} group stage schedule`,
      groupCount,
      matchCount,
      existingQualifyingCount: divisionMatches.filter((m) => m.round_type === 'Qualifying').length,
      teamCount: setupOptions.teamCount,
    });
  };

  const handleWizardSubmit = async (payload) => {
    if (!scheduleWizard) return;

    const { timeSlotConfig: configuredTimeSlots, courtConfig: configuredCourts, startDate, endDate, venue, replaceExisting } = payload;

    setTimeSlotConfig(configuredTimeSlots);
    setCourtConfig(configuredCourts);
    saveTimeSlotConfig(configuredTimeSlots);
    saveCourtConfig(configuredCourts);

    if (scheduleWizard.mode === 'group-stage') {
      setGenerating(true);
      try {
        const schedule = await generateMatchSchedule(startDate, endDate, venue, selectedDivision, {
          groupCount: selectedGroupCount ?? setupOptions.defaultGroupCount,
          replaceExisting,
          timeSlotConfig: configuredTimeSlots,
          courtConfig: configuredCourts,
        });

        if (!schedule.matches?.length) {
          throw new Error('No matches were created for this division.');
        }

        if (schedule.division && schedule.division !== selectedDivision) {
          throw new Error(`Schedule was created for ${schedule.division} instead of ${selectedDivisionLabel}.`);
        }

        await loadData(selectedDivision);

        let message = `${selectedDivisionLabel}: ${schedule.matches.length} qualifying matches created.`;
        if (schedule.expectedMatchCount && schedule.matches.length !== schedule.expectedMatchCount) {
          message += ` Expected ${schedule.expectedMatchCount} matches.`;
        }
        if (endDate) {
          message += ` Date range: ${startDate} to ${endDate}.`;
        } else {
          message += ` Starting from ${startDate}.`;
        }

        await showSuccess('Schedule created', message);
        closeScheduleWizard();
      } catch (err) {
        throw new Error(err.message || 'Failed to generate schedule');
      } finally {
        setGenerating(false);
      }
      return;
    }

    const knockoutHandlers = {
      'knockout-qf': { fn: generateQuarterFinals, setLoading: setGeneratingQF, label: firstKnockoutLabel.replace('🏆 ', '') },
      'knockout-sf': { fn: generateSemiFinals, setLoading: setGeneratingSF, label: 'Semi Finals' },
      'knockout-final': { fn: generateFinal, setLoading: setGeneratingFinal, label: 'Final' },
    };

    const handler = knockoutHandlers[scheduleWizard.mode];
    if (!handler) return;

    handler.setLoading(true);
    try {
      const result = await handler.fn(
        startDate,
        venue,
        selectedDivision,
        configuredTimeSlots,
        configuredCourts
      );
      await loadData();
      const matchesCreated = result?.data?.matches?.length || result?.matches?.length || 0;
      await showSuccess('Knockout scheduled', result?.message || `${handler.label} generated! ${matchesCreated} match(es) created.`);
      closeScheduleWizard();
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || `Failed to generate ${handler.label}`);
    } finally {
      handler.setLoading(false);
    }
  };

  const loadData = async (division = selectedDivision) => {
    try {
      setLoading(true);
      setError(null);
      const [matchesData, teamsData] = await Promise.all([
        getMatches(division),
        getTeams(division),
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


  // Generate match schedule — opens wizard
  const handleGenerateSchedule = () => {
    openGroupStageWizard();
  };

  // Filter matches by division and round
  const filteredMatches = selectedRound === 'all'
    ? divisionMatches
    : divisionMatches.filter(m => m.round_type === selectedRound);

  const groupPools = [
    ...new Set(
      divisionMatches
        .filter((m) => m.round_type === 'Qualifying' && m.pool)
        .map((m) => m.pool)
    ),
  ].sort();
  const qualifyingMatchesByPool = groupPools.reduce((acc, pool) => {
    acc[pool] = filteredMatches.filter(m => m.round_type === 'Qualifying' && m.pool === pool);
    return acc;
  }, {});

  const qualifyingCount = divisionMatches.filter((m) => m.round_type === 'Qualifying').length;
  const activeGroupCount = selectedGroupCount ?? setupOptions?.defaultGroupCount;
  const expectedQualifyingMatches =
    setupOptions?.isValid && activeGroupCount
      ? activeGroupCount *
      (((divisionTeams.length / activeGroupCount) * (divisionTeams.length / activeGroupCount - 1)) / 2)
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
  const handleGenerateQuarterFinals = () => {
    const qualifyingMatches = divisionMatches.filter(m => m.round_type === 'Qualifying');
    const completedQualifying = qualifyingMatches.filter(m => m.status === 'Completed');

    if (qualifyingMatches.length === 0) {
      setError('No qualifying matches found. Please generate schedule first.');
      return;
    }

    if (completedQualifying.length < qualifyingMatches.length) {
      setError(`Please complete all qualifying matches first. ${completedQualifying.length}/${qualifyingMatches.length} completed.`);
      return;
    }

    const existingQF = divisionMatches.filter(m => m.round_type === 'Quarter Final');
    if (existingQF.length > 0) {
      setError('Quarter Finals already generated. Delete existing Quarter Final matches to regenerate.');
      return;
    }

    setError(null);
    setScheduleWizard({
      mode: 'knockout-qf',
      title: `Schedule ${firstKnockoutLabel.replace('🏆 ', '')}`,
    });
  };

  // Generate Semi Finals
  const handleGenerateSemiFinals = () => {
    const quarterFinals = divisionMatches.filter(m => m.round_type === 'Quarter Final');
    const completedQF = quarterFinals.filter(m => m.status === 'Completed');

    if (quarterFinals.length === 0) {
      setError('No Quarter Final matches found. Please generate Quarter Finals first.');
      return;
    }

    if (completedQF.length < quarterFinals.length) {
      setError(`Please complete all Quarter Final matches first. ${completedQF.length}/${quarterFinals.length} completed.`);
      return;
    }

    const existingSF = divisionMatches.filter(m => m.round_type === 'Semi Final');
    if (existingSF.length > 0) {
      setError('Semi Finals already generated. Delete existing Semi Final matches to regenerate.');
      return;
    }

    setError(null);
    setScheduleWizard({
      mode: 'knockout-sf',
      title: 'Schedule Semi Finals',
    });
  };

  // Generate Final
  const handleGenerateFinal = () => {
    if (!canGenerateFinal) {
      if (skipsSemiFinals) {
        setError('Complete both Quarter Final matches before generating the Final.');
      } else {
        setError('Complete all Semi Final matches before generating the Final.');
      }
      return;
    }

    const existingFinal = divisionMatches.filter(m => m.round_type === 'Final');
    if (existingFinal.length > 0) {
      setError('Final already generated. Delete existing Final match to regenerate.');
      return;
    }

    setError(null);
    setScheduleWizard({
      mode: 'knockout-final',
      title: 'Schedule Final',
    });
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
        getMatches(selectedDivision),
        getTeams(selectedDivision),
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
    { value: 'Third Place', label: 'Third Place' },
    { value: 'Final', label: 'Final' },
  ];

  const editableRounds = ['Qualifying', 'Quarter Final', 'Semi Final', 'Third Place', 'Final'];

  const handleSetConfigChange = (roundType, value) => {
    setSetConfig((prev) => ({
      ...prev,
      [roundType]: value,
    }));
  };

  const handleSaveSetConfig = () => {
    const sanitized = saveMatchSetConfig(setConfig);
    setSetConfig(sanitized);
  };

  const handleResetSetConfig = () => {
    setSetConfig(resetMatchSetConfig());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Matches</h2>
          <p className="text-gray-600 mt-1">
            Schedule and score matches per division — each division has its own tournament flow
          </p>
        </div>
      </div>
      
      {isAdmin && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900">Match set configuration</h3>
            <p className="text-sm text-gray-600 mt-1">
              Configure odd number of sets per round (frontend only, no DB schema change).
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {editableRounds.map((roundType) => (
              <label key={roundType} className="text-sm text-gray-700">
                <span className="block mb-1">{roundType}</span>
                <input
                  type="number"
                  min="1"
                  step="2"
                  value={setConfig[roundType]}
                  onChange={(e) => handleSetConfigChange(roundType, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Even values are automatically adjusted to the next odd value when saved.
            Defaults: Qualifying 1, Quarter Final 3, Semi Final 5, Final 7.
          </p>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleSaveSetConfig}>
              Save set config
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={handleResetSetConfig}>
              Reset defaults
            </Button>
          </div>
        </div>
      )}

      <DivisionTabs
        selected={selectedDivision}
        onChange={setSelectedDivision}
        counts={{
          Expert: teams.filter((t) => getDivision(t) === 'Expert').length,
          Intermediate: teams.filter((t) => getDivision(t) === 'Intermediate').length,
          Women: teams.filter((t) => getDivision(t) === 'Women').length,
        }}
      />

      {divisionTeams.length === 0 && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-900">
          No teams in {selectedDivisionLabel}. Generate teams on the Teams page for this division first.
        </div>
      )}

      {scheduleMismatch && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
          <p className="font-medium">Schedule does not match your team count</p>
          <p className="mt-1">
            {divisionTeams.length} teams in {selectedDivisionLabel} need{' '}
            <strong>{expectedQualifyingMatches}</strong> qualifying matches ({activeGroupCount} groups), but only{' '}
            <strong>{qualifyingCount}</strong> are scheduled. Regenerate the group stage to include every team.
          </p>
        </div>
      )}

      {isAdmin && divisionTeams.length > 0 && setupReadyForDivision && (qualifyingCount === 0 || scheduleMismatch) && (
        <TournamentSetupPanel
          setupOptions={setupOptions}
          selectedGroupCount={selectedGroupCount}
          onGroupCountChange={setSelectedGroupCount}
          onGenerate={handleGenerateSchedule}
          generating={generating}
          isAdmin={isAdmin}
          divisionLabel={selectedDivisionLabel}
          timeSlotSummary={timeSlotSummary}
          courtSummary={courtSummary}
          matchesPerWeekday={matchesPerWeekday}
        />
      )}

      {setupLoading && (
        <div className="text-sm text-gray-500">Loading setup for {selectedDivisionLabel}…</div>
      )}

      {/* Requirements */}
      {setupOptions && setupReadyForDivision && !setupOptions.isValid && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            <strong>Note:</strong> {setupOptions.rejectionReason}
          </p>
        </div>
      )}

      {/* Round Filter */}
      {divisionMatches.length > 0 && (
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



      {/* Generate first knockout round (QF, SF, or Final depending on format) */}
      {selectedRound === 'Qualifying' && canGenerateFirstKnockout && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-800 font-medium">
                ✅ All qualifying matches completed!
              </p>
              <p className="text-green-600 text-sm mt-1">
                {isSingleGroup
                  ? configuredTeamCount === 4
                    ? 'Top 2 from the single group are ready for the Final.'
                    : 'Top 4 from the single group are ready for Semi-finals.'
                  : 'Top 2 teams from each group are ready. Generate Quarter Finals to proceed.'}
              </p>
            </div>
            {isAdmin && (
              <Button
                onClick={handleGenerateQuarterFinals}
                variant="primary"
                disabled={generatingQF}
              >
                {generatingQF ? 'Generating...' : firstKnockoutLabel}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Generate Semi Finals (multi-group only) */}
      {selectedRound === 'Quarter Final' &&
        !skipsQuarterFinals &&
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
                    ? 'Top 2 teams are ready. Generate the Final (this division skips Semi Finals).'
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
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="text-gray-600">Loading matches...</div>
        </div>
      )}

      {/* Matches Display */}
      {!loading && divisionMatches.length === 0 && (
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
      {!loading && ['Quarter Final', 'Semi Final', 'Third Place', 'Final'].includes(selectedRound) && filteredMatches.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {selectedRound === 'Quarter Final' && 'Quarter Final Matches'}
            {selectedRound === 'Semi Final' && 'Semi Final Matches'}
            {selectedRound === 'Third Place' && 'Third Place Match'}
            {selectedRound === 'Final' && 'Final Match'}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 4xl:grid-cols-4 gap-6">
            {filteredMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onUpdateResult={handleUpdateResult}
                isAdmin={isAdmin}
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
                setConfig={setConfig}
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

      {scheduleWizard && (
        <ScheduleWizard
          open
          mode={scheduleWizard.mode === 'group-stage' ? 'group-stage' : 'knockout'}
          title={scheduleWizard.title}
          division={selectedDivision}
          divisionLabel={selectedDivisionLabel}
          groupCount={scheduleWizard.groupCount}
          matchCount={scheduleWizard.matchCount}
          existingQualifyingCount={scheduleWizard.existingQualifyingCount ?? 0}
          teamCount={scheduleWizard.teamCount}
          onCancel={closeScheduleWizard}
          onSubmit={handleWizardSubmit}
          submitting={generating || generatingQF || generatingSF || generatingFinal}
        />
      )}
    </div>
  );
};

export default MatchesPage;


