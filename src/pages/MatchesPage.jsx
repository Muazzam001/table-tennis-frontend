import Button from '@/components/atoms/Button';
import LoadingOverlay from '@/components/atoms/LoadingOverlay';
import Modal from '@/components/atoms/Modal';
import DivisionTabs from '@/components/molecules/DivisionTabs';
import MatchCard from '@/components/molecules/MatchCard';
import MatchDetailPanel from '@/components/molecules/MatchDetailPanel';
import MatchResultForm from '@/components/molecules/MatchResultForm';
import PyramidAdminPanel from '@/components/molecules/PyramidAdminPanel/PyramidAdminPanel';
import ScheduleWizard from '@/components/molecules/ScheduleWizard';
import SearchInput from '@/components/molecules/SearchInput';
import TierAssignmentPanel from '@/components/molecules/TierAssignmentPanel/TierAssignmentPanel';
import TierPyramidConfigPanel from '@/components/molecules/TierPyramidConfigPanel/TierPyramidConfigPanel';
import TierPyramidSetupPanel from '@/components/molecules/TierPyramidSetupPanel/TierPyramidSetupPanel';
import TournamentSetupPanel from '@/components/molecules/TournamentSetupPanel/TournamentSetupPanel';
import { getCourtConfig, getCourtSummary, saveCourtConfig } from '@/config/courtConfig';
import {
  GAME_POINT_OPTIONS,
  GROUP_STAGE_SET_ROUNDS,
  TIER_PYRAMID_SET_ROUNDS,
  getMatchSetConfig,
  getMatchSetRoundLabel,
  resetMatchSetConfig,
  saveMatchSetConfig,
} from '@/config/matchSetConfig';
import { getTimeSlotConfig, getTimeSlotSummary, saveTimeSlotConfig } from '@/config/timeSlotConfig';
import { DEFAULT_TOURNAMENT_DIVISION, DIVISIONS, buildDivisionMap } from '@/constants/divisions';
import { DEFAULT_TOURNAMENT_FORMAT, isTierPyramidFormat } from '@/constants/tournamentFormats';
import { useAuth } from '@/contexts/AuthContext';
import { getDivisionSettings } from '@/services/divisionService';
import {
  autoFillMatchResults,
  generateFinal,
  generateMatchSchedule,
  generateQuarterFinals,
  generateSemiFinals,
  getMatches,
  updateMatchResult
} from '@/services/matchService';
import { getTeams, updateTeam } from '@/services/teamService';
import { activateLevel1B, assignPyramidTiers, getPyramidProgressionLog, getPyramidTiers, overridePyramidAdvancement, regeneratePyramidStage } from '@/services/tierPyramidService';
import { getTournamentSetup } from '@/services/tournamentService';
import { CACHE_KEYS, getCached, hasCached, setCached } from '@/utils/dataCache';
import { buildLevel1BRoundsView } from '@/utils/level1bPairingLabels';
import {
  groupMatchesByRoundRobinRounds,
  summarizeLevel1Schedule,
} from '@/utils/level1Matches';
import { showConfirm, showSuccess } from '@/utils/sweetAlert';
import { deriveLevel1bStatus, derivePyramidTournamentStatus, getLevel1BRoundMatches } from '@shared/tournament/formats/tierPyramid/advancement.js';
import { filterMatchesForPyramidRound } from '@shared/tournament/formats/tierPyramid/roundFilters.js';
import { useCallback, useEffect, useMemo, useState } from 'react';

const getDivision = (item) => item?.division ?? null;

const KNOCKOUT_ROUND_TABS = [
  { value: 'Qualifying', label: 'Qualifying Round' },
  { value: 'Quarter Final', label: 'Quarter Finals' },
  { value: 'Semi Final', label: 'Semi Finals' },
  { value: 'Third Place', label: 'Third Place' },
  { value: 'Final', label: 'Final' },
];

const PYRAMID_ROUND_TABS = [
  { value: 'Level 1A', label: 'Level 1A (S1)' },
  { value: 'Level 1B R1', label: 'L1B - Round 1 (S1)' },
  { value: 'Level 1B R2', label: 'L1B - Round 2 (S1)' },
  { value: 'S3', label: 'Level 1C (S2)' },
  { value: 'Level 2', label: 'Level 2' },
  { value: 'Level 3', label: 'Level 3' },
  { value: 'Semi Final', label: 'Semi Finals' },
  { value: 'Third Place', label: 'Third Place' },
  { value: 'Final', label: 'Final' },
];

const roundHasMatches = (divisionMatches, roundValue, isPyramid) => {
  if (isPyramid) {
    if (roundValue === 'Level 1B R1') {
      return (
        divisionMatches.some((m) => m.round_type === 'S1') ||
        getLevel1BRoundMatches(divisionMatches)[0]?.length > 0
      );
    }
    if (roundValue === 'Level 1B R2') {
      return getLevel1BRoundMatches(divisionMatches)[1]?.length > 0;
    }
    return filterMatchesForPyramidRound(divisionMatches, roundValue).length > 0;
  }
  return divisionMatches.some((m) => m.round_type === roundValue);
};

const MatchesPage = () => {
  const { isAdmin } = useAuth();
  const [matches, setMatches] = useState(() => getCached(CACHE_KEYS.matchesAll) || []);
  const [teams, setTeams] = useState(() => getCached(CACHE_KEYS.teamsAll) || []);
  const [loading, setLoading] = useState(() => !hasCached(CACHE_KEYS.matchesAll));
  const [error, setError] = useState(null);
  const [selectedRound, setSelectedRound] = useState('Qualifying');
  const [matchSearchQuery, setMatchSearchQuery] = useState('');
  const [showResultForm, setShowResultForm] = useState(false);
  const [showMatchDetail, setShowMatchDetail] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatingQF, setGeneratingQF] = useState(false);
  const [generatingSF, setGeneratingSF] = useState(false);
  const [generatingFinal, setGeneratingFinal] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState(DEFAULT_TOURNAMENT_DIVISION);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupOptions, setSetupOptions] = useState(null);
  const [selectedGroupCount, setSelectedGroupCount] = useState(null);
  const [setConfig, setSetConfig] = useState(getMatchSetConfig);
  const [timeSlotConfig, setTimeSlotConfig] = useState(getTimeSlotConfig);
  const [courtConfig, setCourtConfig] = useState(getCourtConfig);
  const [scheduleWizard, setScheduleWizard] = useState(null);
  const [divisionTournamentFormats, setDivisionTournamentFormats] = useState(buildDivisionMap(DEFAULT_TOURNAMENT_FORMAT));
  const [divisionCompetitionFormats, setDivisionCompetitionFormats] = useState(buildDivisionMap('doubles'));
  const [tierAssignments, setTierAssignments] = useState({});
  const [pyramidTierState, setPyramidTierState] = useState(null);
  const [tierSaving, setTierSaving] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [entrantNameSavingId, setEntrantNameSavingId] = useState(null);
  const [progressionLog, setProgressionLog] = useState([]);
  const [logLoading, setLogLoading] = useState(false);
  const [pyramidAdminSaving, setPyramidAdminSaving] = useState(false);
  const [activatingLevel1B, setActivatingLevel1B] = useState(false);
  const [divisionSettingsMap, setDivisionSettingsMap] = useState({});
  const [autoFillingRound, setAutoFillingRound] = useState(null);
  const [autoFillingLabel, setAutoFillingLabel] = useState('');
  const timeSlotSummary = getTimeSlotSummary(timeSlotConfig);
  const courtSummary = getCourtSummary(courtConfig);
  const matchesPerWeekday = timeSlotSummary.slotsPerWeekday * courtConfig.courtCount;

  const divisionTeams = useMemo(
    () => teams.filter((t) => getDivision(t) === selectedDivision),
    [teams, selectedDivision]
  );
  const divisionMatches = useMemo(
    () => matches.filter((m) => getDivision(m) === selectedDivision),
    [matches, selectedDivision]
  );
  const selectedTournamentFormat = divisionTournamentFormats[selectedDivision] || DEFAULT_TOURNAMENT_FORMAT;
  const selectedCompetitionFormat = divisionCompetitionFormats[selectedDivision] || 'doubles';
  const isSinglesDivision = selectedCompetitionFormat === 'singles';
  const isTierPyramid = isTierPyramidFormat(selectedTournamentFormat) || setupOptions?.format === 'tier-pyramid';
  const level1aMatches = useMemo(
    () => divisionMatches.filter((m) => m.round_type === 'S1'),
    [divisionMatches]
  );
  const s3Matches = useMemo(
    () => divisionMatches.filter((m) => m.round_type === 'S2' || m.round_type === 'S3'),
    [divisionMatches]
  );
  const level1bMatches = useMemo(
    () => divisionMatches.filter((m) => m.round_type === 'Level 1B'),
    [divisionMatches]
  );
  const level1Matches = useMemo(
    () => [...level1aMatches, ...s3Matches],
    [level1aMatches, s3Matches]
  );
  // Passed to every MatchCard — memoized so a stable reference lets React.memo skip cards.
  const teamTierMap = useMemo(() => Object.fromEntries(
    (pyramidTierState?.teams || divisionTeams).map((t) => [t.id, tierAssignments[t.id] ?? t.tier])
  ),
    [pyramidTierState, divisionTeams, tierAssignments]
  );
  const pyramidAdminTeams = (pyramidTierState?.teams || divisionTeams).map((t) => ({
    ...t, tier: tierAssignments[t.id] ?? t.tier,
  }));
  const level1bRoundsView = useMemo(
    () => buildLevel1BRoundsView(level1bMatches, pyramidAdminTeams),
    [level1bMatches, pyramidAdminTeams]
  );
  const selectedDivisionSettings = divisionSettingsMap[selectedDivision] || {};
  const level1bStatus = isTierPyramid
    ? deriveLevel1bStatus(divisionMatches, selectedDivisionSettings, pyramidAdminTeams)
    : 'waiting';
  const pyramidQualifiersPerGroup =
    setupOptions?.config?.s1QualifiersPerGroup ??
    pyramidTierState?.config?.s1QualifiersPerGroup ??
    4;
  const pyramidStatus = isTierPyramid
    ? derivePyramidTournamentStatus(divisionMatches, {}, { level1bStatus })
    : null;
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
  const pyramidTierRequirements = (() => {
    if (pyramidTierState?.config) {
      return {
        tier1: pyramidTierState.config.tier1Count,
        tier2: pyramidTierState.config.tier2Count,
        tier3: pyramidTierState.config.tier3Count,
      };
    }
    if (setupOptions?.isValid && setupOptions?.tierRequirements) {
      return setupOptions.tierRequirements;
    }
    const counts = { tier1: 0, tier2: 0, tier3: 0 };
    for (const team of divisionTeams) {
      const tier = tierAssignments[team.id] ?? team.tier;
      if (tier === 1) counts.tier1 += 1;
      else if (tier === 2) counts.tier2 += 1;
      else if (tier === 3) counts.tier3 += 1;
    }
    if (counts.tier1 + counts.tier2 + counts.tier3 > 0) {
      return counts;
    }
    return setupOptions?.tierRequirements || { tier1: 8, tier2: 12, tier3: 12 };
  })();
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

  const refreshDivisionSettings = useCallback(async () => {
    const settingsRows = await getDivisionSettings();
    const map = {};
    for (const row of settingsRows) {
      map[row.division] = row;
    }
    setDivisionSettingsMap(map);
    return map;
  }, []);

  const loadData = useCallback(async ({ silent = false } = {}) => {
    try {
      // Only show the full-screen spinner on a true cold load. When we already
      // have cached data we revalidate silently to avoid a UI flash.
      if (!silent) setLoading(true);
      setError(null);

      // getMatches()/getTeams() with no division return every division in a
      // single query each (2 requests total), then we filter client-side.
      const [allMatches, allTeams] = await Promise.all([getMatches(), getTeams()]);

      setCached(CACHE_KEYS.matchesAll, allMatches);
      setCached(CACHE_KEYS.teamsAll, allTeams);
      setMatches(allMatches);
      setTeams(allTeams);
    } catch (err) {
      setError(err.message || 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount. If cache is warm, paint it immediately and revalidate silently.
  useEffect(() => {
    loadData({ silent: hasCached(CACHE_KEYS.matchesAll) });
  }, [loadData]);

  useEffect(() => {
    let cancelled = false;

    const loadSetup = async () => {
      setSetupLoading(true);
      setSetupOptions(null);
      setSelectedGroupCount(null);
      try {
        // Fetch setup, settings, and potential pyramid tiers all in parallel
        const [setup, settingsRows, pyramidTiersResult] = await Promise.all([
          getTournamentSetup(selectedDivision, { timeSlotConfig, courtConfig }),
          getDivisionSettings(),
          getPyramidTiers(selectedDivision).catch(() => null), // Pre-fetch, may not be needed
        ]);
        const formats = buildDivisionMap(DEFAULT_TOURNAMENT_FORMAT);
        const competitionFormats = buildDivisionMap('doubles');
        const settingsMap = {};
        for (const row of settingsRows) {
          formats[row.division] = row.tournament_format || DEFAULT_TOURNAMENT_FORMAT;
          competitionFormats[row.division] = row.competition_format || 'doubles';
          settingsMap[row.division] = row;
        }
        if (cancelled) return;
        setDivisionSettingsMap(settingsMap);
        setDivisionTournamentFormats(formats);
        setDivisionCompetitionFormats(competitionFormats);
        setSetupOptions(setup);
        const defaultCount = setup?.defaultGroupCount ?? null;
        setSelectedGroupCount(defaultCount);
        setSelectedRound(
          isTierPyramidFormat(formats[selectedDivision] || setup?.format) ? 'Level 1A' : 'Qualifying'
        );

        if (isTierPyramidFormat(formats[selectedDivision] || setup?.format)) {
          // Use pre-fetched tier data if pyramid format
          const tierData = pyramidTiersResult || (await getPyramidTiers(selectedDivision));
          if (!cancelled) {
            setPyramidTierState(tierData);
            const map = {};
            for (const team of tierData?.teams || []) {
              if (team.tier != null) map[team.id] = team.tier;
            }
            setTierAssignments(map);
          }
        } else {
          setPyramidTierState(null);
          setTierAssignments({});
        }
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
    setError(null);

    return () => {
      cancelled = true;
    };
  }, [selectedDivision, timeSlotConfig, courtConfig]);

  const loadProgressionLog = async (division = selectedDivision) => {
    if (!isTierPyramidFormat(divisionTournamentFormats[division])) return;
    try {
      setLogLoading(true);
      const data = await getPyramidProgressionLog(division);
      setProgressionLog(Array.isArray(data) ? data : []);
    } catch {
      setProgressionLog([]);
    } finally {
      setLogLoading(false);
    }
  };

  useEffect(() => {
    if (isTierPyramid && level1Matches.length > 0) {
      loadProgressionLog(selectedDivision);
    } else {
      setProgressionLog([]);
    }
  }, [selectedDivision, isTierPyramid, level1Matches.length]);

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
      setError(setupOptions?.rejectionReason || setupOptions?.errors?.[0] || 'Cannot generate schedule with current team count.');
      return;
    }
    if (setupOptions.division !== selectedDivision) {
      setError(`Tournament setup is out of date for ${selectedDivisionLabel}. Please wait a moment and try again.`);
      return;
    }

    if (isTierPyramid && !pyramidTierState?.isComplete) {
      setError('Assign tiers to all entrants before generating the Tier Pyramid schedule.');
      return;
    }

    const groupCount = selectedGroupCount ?? setupOptions.defaultGroupCount;
    const matchCount = isTierPyramid
      ? setupOptions.matchCounts?.level1Total
      : groupCount &&
      (groupCount *
        ((setupOptions.teamCount / groupCount) * (setupOptions.teamCount / groupCount - 1))) /
      2;

    setError(null);
    setScheduleWizard({
      mode: 'group-stage',
      title: isTierPyramid
        ? `Create ${selectedDivisionLabel} Tier Pyramid Level 1 schedule`
        : `Create ${selectedDivisionLabel} group stage schedule`,
      groupCount, matchCount,
      existingQualifyingCount: isTierPyramid ? level1Matches.length
        : divisionMatches.filter((m) => m.round_type === 'Qualifying').length,
      teamCount: setupOptions.teamCount,
      isTierPyramid,
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
          format: scheduleWizard.isTierPyramid ? 'tier-pyramid' : 'groups',
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

        await loadData({ silent: true });

        let message = scheduleWizard.isTierPyramid
          ? `${selectedDivisionLabel}: ${schedule.matches.length} Level 1 matches created (S1 + S2). Later levels auto-generate as you enter results.`
          : `${selectedDivisionLabel}: ${schedule.matches.length} qualifying matches created.`;
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
      await loadData({ silent: true });
      const matchesCreated = result?.data?.matches?.length || result?.matches?.length || 0;
      await showSuccess('Knockout scheduled', result?.message || `${handler.label} generated! ${matchesCreated} match(es) created.`);
      closeScheduleWizard();
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || `Failed to generate ${handler.label}`);
    } finally {
      handler.setLoading(false);
    }
  };

  // Generate match schedule — opens wizard
  const handleGenerateSchedule = () => {
    openGroupStageWizard();
  };

  // Client-side search within the selected division (matches by team name)
  const normalizedMatchQuery = matchSearchQuery.trim().toLowerCase();
  const matchMatchesQuery = useCallback(
    (m) => !normalizedMatchQuery ||
      [m.team1_name, m.team2_name].filter(Boolean)
        .some((name) => String(name).toLowerCase().includes(normalizedMatchQuery)),
    [normalizedMatchQuery]
  );

  // Filter matches by division and round
  const filteredMatches = useMemo(
    () =>
      (selectedRound === 'all' ? divisionMatches : isTierPyramid
        ? filterMatchesForPyramidRound(divisionMatches, selectedRound)
        : divisionMatches.filter((m) => m.round_type === selectedRound)
      ).filter(matchMatchesQuery),
    [divisionMatches, selectedRound, isTierPyramid, matchMatchesQuery]
  );

  const level1S2Matches = useMemo(
    () => s3Matches, [s3Matches]
  );
  const level1Summary = summarizeLevel1Schedule(level1Matches, setupOptions?.matchCounts || {});
  const s2RoundGroups = useMemo(
    () => groupMatchesByRoundRobinRounds(level1S2Matches.filter(matchMatchesQuery)),
    [level1S2Matches, matchMatchesQuery]
  );

  const qualifyingCount = divisionMatches.filter((m) => m.round_type === 'Qualifying').length;
  const activeGroupCount = selectedGroupCount ?? setupOptions?.defaultGroupCount;
  const expectedQualifyingMatches = setupOptions?.isValid && activeGroupCount
    ? activeGroupCount * (((divisionTeams.length / activeGroupCount) * (divisionTeams.length / activeGroupCount - 1)) / 2) : null;
  const scheduleMismatch =
    !isTierPyramid && expectedQualifyingMatches != null && qualifyingCount > 0 &&
    qualifyingCount !== expectedQualifyingMatches;

  // Stable handlers passed to memoized MatchCards so cards skip re-renders.
  const handleUpdateResult = useCallback((match) => {
    setSelectedMatch(match);
    setShowMatchDetail(false);
    setShowResultForm(true);
  }, []);

  const handleViewMatch = useCallback((match) => {
    setSelectedMatch(match);
    setShowResultForm(false);
    setShowMatchDetail(true);
  }, []);

  const closeMatchModal = () => {
    setShowResultForm(false);
    setShowMatchDetail(false);
    setSelectedMatch(null);
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

      // Reload all divisions so tab counts stay accurate
      await loadData({ silent: true });
      if (isTierPyramid) {
        const [tierData] = await Promise.all([
          getPyramidTiers(selectedDivision),
          refreshDivisionSettings(),
        ]);
        setPyramidTierState(tierData);
      }
    } catch (err) {
      setError(err.message || 'Failed to update match result');
      console.error('Error updating result:', err);
    }
  };

  const matchesForRound = (roundType) =>
    isTierPyramid
      ? filterMatchesForPyramidRound(divisionMatches, roundType)
      : roundType === 'Level 1'
        ? divisionMatches.filter((match) => match.round_type === 'S1' || match.round_type === 'S2')
        : divisionMatches.filter((match) => match.round_type === roundType);

  const pendingCountForRound = (roundType) =>
    matchesForRound(roundType).filter(
      (match) => match.status !== 'Completed' && match.team1_id && match.team2_id
    ).length;

  const handleAutoFillResults = async (roundType, roundLabel) => {
    const pendingCount = pendingCountForRound(roundType);
    if (pendingCount === 0) {
      setError(`No pending ${roundLabel} matches to fill.`);
      return;
    }

    const confirmed = await showConfirm({
      title: `Auto-fill ${roundLabel} results?`,
      text:
        `This will complete ${pendingCount} match(es) with valid scores for testing. ` +
        'The team with the lower ID wins each match so outcomes are predictable. ' +
        'You can review every result on the match cards afterward.',
      confirmText: 'Auto-fill',
      variant: 'primary',
    });
    if (!confirmed) return;

    try {
      setAutoFillingRound(roundType);
      setAutoFillingLabel(roundLabel);
      setError(null);
      const response = await autoFillMatchResults(selectedDivision, {
        roundType,
        setConfig,
        gamePointsPerSet: setConfig.gamePointsPerSet,
      });

      await loadData({ silent: true });
      if (isTierPyramid && level1Matches.length > 0) {
        await loadProgressionLog(selectedDivision);
      }

      const filled = response?.data?.filled ?? 0;
      const progression = response?.data?.progressionActions ?? [];
      let message = response?.message || `Auto-filled ${filled} match result(s).`;
      if (progression.length > 0) {
        message += ` ${progression.join(' · ')}`;
      }
      await showSuccess('Results auto-filled', message);
    } catch (err) {
      setError(err.message || 'Failed to auto-fill match results');
    } finally {
      setAutoFillingRound(null);
      setAutoFillingLabel('');
    }
  };

  const renderLevelAutoFillButton = (roundType, roundLabel) => {
    if (!isAdmin || matchesForRound(roundType).length === 0) return null;

    const pending = pendingCountForRound(roundType);
    const isFilling = autoFillingRound === roundType;

    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isFilling || pending === 0 || autoFillingRound != null}
        onClick={() => handleAutoFillResults(roundType, roundLabel)}
        title="Testing only: lower team ID wins each match"
      >
        {isFilling ? 'Auto-filling…' : `Auto-fill ${roundLabel}`}
      </Button>
    );
  };

  const allRoundTabs = isTierPyramid ? PYRAMID_ROUND_TABS : KNOCKOUT_ROUND_TABS;

  const visibleRoundTabs = useMemo(
    () =>
      allRoundTabs.filter((round) =>
        roundHasMatches(divisionMatches, round.value, isTierPyramid)
      ),
    [allRoundTabs, divisionMatches, isTierPyramid]
  );

  useEffect(() => {
    if (visibleRoundTabs.length === 0) return;
    if (!visibleRoundTabs.some((round) => round.value === selectedRound)) {
      setSelectedRound(visibleRoundTabs[0].value);
    }
  }, [visibleRoundTabs, selectedRound]);

  const editableRounds = isTierPyramid ? TIER_PYRAMID_SET_ROUNDS : GROUP_STAGE_SET_ROUNDS;

  const handleTierChange = (teamId, tier) => {
    setTierAssignments((prev) => ({ ...prev, [teamId]: tier }));
  };

  const handleEntrantNameChange = async (teamId, teamName) => {
    try {
      setEntrantNameSavingId(teamId);
      setError(null);
      await updateTeam(teamId, { team_name: teamName });
      setTeams((prev) =>
        prev.map((team) => (team.id === teamId ? { ...team, team_name: teamName } : team))
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update entrant name');
    } finally {
      setEntrantNameSavingId(null);
    }
  };

  const handleSaveTiers = async () => {
    try {
      setTierSaving(true);
      setError(null);
      const assignments = Object.entries(tierAssignments).map(([teamId, tier]) => ({
        teamId: Number(teamId),
        tier: Number(tier),
      }));
      const data = await assignPyramidTiers(selectedDivision, assignments, null);
      setPyramidTierState(data);
      const setup = await getTournamentSetup(selectedDivision, { timeSlotConfig, courtConfig });
      setSetupOptions(setup);
      await showSuccess('Tiers saved', `${selectedDivisionLabel} tier assignments updated.`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save tier assignments');
    } finally {
      setTierSaving(false);
    }
  };

  const handleOverrideAdvancement = async ({ updates, notes }) => {
    try {
      setPyramidAdminSaving(true);
      setError(null);
      await overridePyramidAdvancement(selectedDivision, updates, notes);
      await loadData({ silent: true });
      await loadProgressionLog(selectedDivision);
      const tierData = await getPyramidTiers(selectedDivision);
      setPyramidTierState(tierData);
      const isReplace = updates?.some((u) => u.replaceWithTeamId != null);
      await showSuccess(
        isReplace ? 'Team replaced' : 'Override applied',
        isReplace
          ? 'Teams swapped in the current tournament stage (including unfinished matches).'
          : 'Team advancement updated.'
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to override advancement');
    } finally {
      setPyramidAdminSaving(false);
    }
  };

  const handleRegenerateStage = async (fromStage) => {
    try {
      setPyramidAdminSaving(true);
      setError(null);
      const result = await regeneratePyramidStage(selectedDivision, fromStage);
      await loadData({ silent: true });
      await loadProgressionLog(selectedDivision);
      const tierData = await getPyramidTiers(selectedDivision);
      setPyramidTierState(tierData);
      const actions = result?.progression?.actions || [];
      await showSuccess(
        'Stage regenerated',
        actions.length > 0 ? actions.join(' · ') : `Downstream progression re-run from ${fromStage}.`
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to regenerate stage');
    } finally {
      setPyramidAdminSaving(false);
    }
  };

  const handleActivateLevel1B = async () => {
    try {
      setActivatingLevel1B(true);
      setError(null);
      const result = await activateLevel1B(selectedDivision);
      await loadData({ silent: true });
      const [tierData] = await Promise.all([
        getPyramidTiers(selectedDivision),
        refreshDivisionSettings(),
      ]);
      setPyramidTierState(tierData);
      await showSuccess(
        'Level 1B activated',
        result?.message || 'Cross-group matches have been scheduled.'
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to activate Level 1B');
    } finally {
      setActivatingLevel1B(false);
    }
  };

  const groupPools = useMemo(
    () =>
      isTierPyramid
        ? [...new Set(level1Matches.filter((m) => m.round_type === 'S1' && m.pool).map((m) => m.pool))].sort()
        : [...new Set(divisionMatches.filter((m) => m.round_type === 'Qualifying' && m.pool).map((m) => m.pool))].sort(),
    [isTierPyramid, level1Matches, divisionMatches]
  );
  const qualifyingMatchesByPool = useMemo(() =>
    groupPools.reduce((acc, pool) => {
      acc[pool] = filteredMatches.filter((m) =>
        isTierPyramid ? m.round_type === 'S1' && m.pool === pool : m.round_type === 'Qualifying' && m.pool === pool
      );
      return acc;
    }, {}),
    [groupPools, filteredMatches, isTierPyramid]
  );

  const handleSetConfigChange = (roundType, value) => {
    setSetConfig((prev) => ({
      ...prev,
      sets: {
        ...(prev.sets || {}),
        [roundType]: value,
      },
    }));
  };

  const handleGamePointsChange = (value) => {
    setSetConfig((prev) => ({
      ...prev,
      gamePointsPerSet: Number(value) === 21 ? 21 : 11,
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
    <div className="space-y-5">
      {autoFillingRound && (
        <LoadingOverlay
          message={`Auto-filling ${autoFillingLabel} results…`}
          submessage="Please wait while match scores are generated."
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Matches</h2>
          <p className="text-gray-600 mt-1">
            {isAdmin
              ? 'Schedule and score matches per division - each division has its own tournament flow'
              : 'Browse schedules and results per division - read-only view'}
          </p>
        </div>
      </div>

      {isAdmin && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">Match configuration</h3>
              <p className="text-sm text-gray-600 mt-1">
                Configure sets per round and game length (11 or 21 points). Saved in this browser for
                scoring and tie-break rules.
              </p>
            </div>

            <label className="flex gap-3 text-sm text-gray-700">
              <span className="block mb-1">Points per game</span>
              <select
                value={setConfig.gamePointsPerSet ?? 11}
                onChange={(e) => handleGamePointsChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {GAME_POINT_OPTIONS.map((points) => (
                  <option key={points} value={points}>
                    {points}-point games
                    {points === 11 ? ' (6-0 / 9-1 knockout)' : ' (7-0 / 11-1 knockout)'}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-6 gap-3">
            {editableRounds.map((roundType) => (
              <label key={roundType} className="text-sm text-gray-700">
                <span className="block mb-1">{getMatchSetRoundLabel(roundType)}</span>
                <input
                  type="number"
                  min="1"
                  step="2"
                  value={setConfig.sets?.[roundType] ?? ''}
                  onChange={(e) => handleSetConfigChange(roundType, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Even set counts are adjusted to the next odd value when saved. Knockout margins:
            11-point games treat 6-0 as decisive; 21-point games treat 7-0 and 11-1 as decisive.
            Defaults: Qualifying 1, QF 3, SF 5, Third Place 5, Final 9; pyramid Level 1 3, L2 5, L3 7, Third Place 5, Final 9.
          </p>
          <div className="flex gap-2 flex-row-reverse">
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
        onChange={(division) => {
          setSelectedDivision(division);
          setMatchSearchQuery('');
        }}
        counts={Object.fromEntries(
          DIVISIONS.map((d) => {
            const divisionMatches = matches.filter((m) => getDivision(m) === d.value);
            const completedCount = divisionMatches.filter((m) => m.status === 'Completed').length;
            const totalCount = divisionMatches.length;
            return [d.value, totalCount > 0 ? `${completedCount}/${totalCount}` : '0'];
          })
        )}
      />

      {divisionTeams.length === 0 && !loading && isAdmin && (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {isAdmin && (
          <>
            {isTierPyramid ? (
              <>
                {divisionTeams.length > 0 && (
                  <TierAssignmentPanel
                    teams={divisionTeams}
                    tierRequirements={pyramidTierRequirements}
                    assignments={tierAssignments}
                    onTierChange={handleTierChange}
                    onSave={handleSaveTiers}
                    saving={tierSaving}
                    isComplete={pyramidTierState?.isComplete}
                    errors={pyramidTierState?.errors || []}
                    isAdmin={isAdmin}
                    divisionLabel={selectedDivisionLabel}
                    isSingles={isSinglesDivision}
                    onTeamNameChange={handleEntrantNameChange}
                    nameSavingId={entrantNameSavingId}
                  />
                )}

                {level1Matches.length > 0 && (
                  <PyramidAdminPanel
                    teams={pyramidAdminTeams}
                    progressionLog={progressionLog}
                    logLoading={logLoading}
                    onOverrideAdvancement={handleOverrideAdvancement}
                    onRegenerateStage={handleRegenerateStage}
                    onRefreshLog={() => loadProgressionLog(selectedDivision)}
                    divisionLabel={selectedDivisionLabel}
                    tournamentStatus={pyramidStatus}
                    level1bStatus={level1bStatus}
                    saving={pyramidAdminSaving}
                  />
                )}

                {divisionTeams.length > 0 && setupReadyForDivision && (
                  <TierPyramidConfigPanel
                    setupOptions={setupOptions}
                    divisionLabel={selectedDivisionLabel}
                    saving={configSaving}
                    setSaving={setConfigSaving}
                    onConfigSaved={async () => {
                      const setup = await getTournamentSetup(selectedDivision, {
                        timeSlotConfig,
                        courtConfig,
                      });
                      setSetupOptions(setup);
                      showSuccess('Pyramid configuration saved.');
                    }}
                  />
                )}

                {divisionTeams.length > 0 && setupReadyForDivision && level1Matches.length === 0 && (
                  <TierPyramidSetupPanel
                    setupOptions={setupOptions}
                    onGenerate={handleGenerateSchedule}
                    generating={generating}
                    isAdmin={isAdmin}
                    divisionLabel={selectedDivisionLabel}
                    tiersComplete={pyramidTierState?.isComplete}
                    level1MatchCount={setupOptions?.matchCounts?.level1Total}
                    timeSlotSummary={timeSlotSummary}
                    courtSummary={courtSummary}
                    matchesPerWeekday={matchesPerWeekday}
                  />
                )}
              </>
            ) : (
              <>
                {divisionTeams.length > 0 && setupReadyForDivision && (qualifyingCount === 0 || scheduleMismatch) && (
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
              </>
            )}
          </>
        )}
      </div>

      {setupLoading && (
        <div className="text-sm text-gray-500">Loading setup for {selectedDivisionLabel}…</div>
      )}

      {/* Requirements — only when setup is invalid and no derived config is available */}
      {setupOptions && setupReadyForDivision && !setupOptions.isValid && !setupOptions.isDerived && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            <strong>Note:</strong> {setupOptions.rejectionReason}
          </p>
        </div>
      )}

      {/* Round Filter — only tabs with scheduled matches */}
      {visibleRoundTabs.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap">
            {visibleRoundTabs.map((round) => (
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

          <SearchInput
            value={matchSearchQuery}
            onChange={setMatchSearchQuery}
            placeholder={`Search ${selectedDivisionLabel} matches by team...`}
            className="w-full xl:max-w-md"
          />
        </div>
      )}

      {isTierPyramid && level1Matches.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-900 space-y-1">
          <p>
            {isAdmin
              ? ' Enter results to unlock Level 2+.'
              : ' Later levels unlock as results are entered.'} <br />
            <strong>S1</strong> (group play) and <strong>S2</strong> (Tier 1 round-robin) run in parallel.
            <br />
            Top {pyramidQualifiersPerGroup} per group advance to <strong>Level 1B</strong>, then top 4 advance to Level 2.
          </p>
          <p>
            Scheduled: <strong>{level1Summary.total}</strong>
            {level1Summary.expectedTotal
              ? ` / ${level1Summary.expectedTotal} expected`
              : ''}{' '}
            (S1: {level1Summary.s1}
            {level1Summary.expectedS1 != null ? ` / ${level1Summary.expectedS1}` : ''}, Tier 1 RR:{' '}
            {level1Summary.s2}
            {level1Summary.expectedS2 != null ? ` / ${level1Summary.expectedS2}` : ''})
          </p>
          {level1Summary.isIncomplete && (
            <p className="text-amber-800 font-medium">
              {isAdmin ? 'Schedule looks incomplete - regenerate Level 1 with a wider date range if matches are missing.'
                : 'The Level 1 schedule may still be incomplete.'}
            </p>
          )}
        </div>
      )}

      {!loading && isTierPyramid && (
        <>
          {level1aMatches.length > 0 && selectedRound === 'Level 1A' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-2xl font-bold text-gray-900">S1 - Group play</h3>
                {renderLevelAutoFillButton('Level 1A', 'S1')}
              </div>

              {groupPools.length > 0 && (
                <div className="space-y-4">
                  {groupPools.map((pool) =>
                    qualifyingMatchesByPool[pool]?.length > 0 ? (
                      <div key={pool}>
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Group {pool}</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 3xl:grid-cols-4 gap-4">
                          {qualifyingMatchesByPool[pool].map((match) => (
                            <MatchCard
                              key={match.id}
                              match={match}
                              onUpdateResult={handleUpdateResult}
                              onViewDetails={handleViewMatch}
                              isAdmin={isAdmin}
                              teamTiers={teamTierMap}
                              setConfig={setConfig}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </div>
          )}

          {selectedRound === 'S3' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-2xl font-bold text-gray-900">S2 - Tier 1 round-robin</h3>
                {renderLevelAutoFillButton('S3', 'S2')}
              </div>
              {s2RoundGroups.length > 0 ? (
                s2RoundGroups.map((round) => (
                  <div key={round.roundNumber}>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Round {round.roundNumber}</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 3xl:grid-cols-4 gap-4">
                      {round.matches.map((match) => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          onUpdateResult={handleUpdateResult}
                          onViewDetails={handleViewMatch}
                          isAdmin={isAdmin}
                          teamTiers={teamTierMap}
                          setConfig={setConfig}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No Tier 1 matches scheduled yet.</p>
              )}
            </div>
          )}

          {(selectedRound === 'Level 1B R1' || selectedRound === 'Level 1B R2') && (() => {
            const isR1 = selectedRound === 'Level 1B R1';
            const roundIndex = isR1 ? 0 : 1;
            const round = level1bRoundsView[roundIndex];

            return (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {isR1 ? 'Level 1B - Round 1' : 'Level 1B - Round 2'}
                    </h3>
                    {round?.subtitle && (
                      <p className="text-sm text-gray-600 mt-1">{round.subtitle}</p>
                    )}
                  </div>
                  {round?.matches?.length > 0 &&
                    renderLevelAutoFillButton(selectedRound, selectedRound)}
                </div>

                {isR1 &&
                  (level1bStatus === 'waiting' || level1bStatus === 'ready') &&
                  level1bMatches.length === 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-amber-900 font-medium">
                        {level1bStatus === 'waiting'
                          ? 'Complete all S1 groups to unlock Level 1B.'
                          : 'S1 is complete - Level 1B is ready to activate.'}
                      </p>
                      {level1bStatus === 'ready' && isAdmin && (
                        <Button
                          className="mt-3"
                          variant="primary"
                          onClick={handleActivateLevel1B}
                          disabled={activatingLevel1B}
                        >
                          {activatingLevel1B ? 'Activating…' : 'Activate Level 1B'}
                        </Button>
                      )}
                    </div>
                  )}

                {!isR1 && (!round || round.matches.length === 0) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-amber-900 font-medium">
                      Round 2 appears after all Round 1 cross-group matches are completed.
                    </p>
                    <p className="text-amber-800 text-sm mt-1">
                      Pairings: Winner (A1·B4) vs Winner (C1·D4), and matching slots for A2·B3, A3·B2, A4·B1.
                    </p>
                  </div>
                )}

                {round?.matches?.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 3xl:grid-cols-4 gap-6">
                    {round.matches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        pairingHint={match.pairingHint}
                        onUpdateResult={handleUpdateResult}
                        onViewDetails={handleViewMatch}
                        isAdmin={isAdmin}
                        teamTiers={teamTierMap}
                        setConfig={setConfig}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

        </>
      )}

      {/* Generate first knockout round (QF, SF, or Final depending on format) */}
      {!isTierPyramid && selectedRound === 'Qualifying' && canGenerateFirstKnockout && (
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
                  : isAdmin
                    ? 'Top 2 teams from each group are ready. Generate Quarter Finals to proceed.'
                    : 'Top 2 teams from each group are ready — knockout rounds will be scheduled next.'}
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
      {!isTierPyramid && selectedRound === 'Quarter Final' &&
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
                  {isAdmin
                    ? 'Top 4 teams are ready. Generate Semi Finals to proceed.'
                    : 'Top 4 teams are ready — Semi Finals will be scheduled next.'}
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
      {!isTierPyramid && canGenerateFinal &&
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
                    ? isAdmin
                      ? 'Top 2 teams are ready. Generate the Final (this division skips Semi Finals).'
                      : 'Top 2 teams are ready — the Final will be scheduled next (this division skips Semi Finals).'
                    : isAdmin
                      ? 'Top 2 teams are ready. Generate Final to determine the champion.'
                      : 'Top 2 teams are ready — the Final will be scheduled next.'}
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
            {isAdmin
              ? 'Click "Generate Schedule" to create the tournament schedule'
              : 'Matches will appear here once the tournament schedule is published'}
          </p>
        </div>
      )}

      {/* Group-stage qualifying — show by pool */}
      {!loading && !isTierPyramid && selectedRound === 'Qualifying' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-2xl font-bold text-gray-900">Qualifying Round</h3>
            {renderLevelAutoFillButton('Qualifying', 'Qualifying')}
          </div>

          <div className={`grid grid-cols-1 gap-6`}>
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
                        onViewDetails={handleViewMatch}
                        isAdmin={isAdmin}
                        teamTiers={teamTierMap}
                        setConfig={setConfig}
                      />
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* Knockout & pyramid rounds L2+ (flat list) */}
      {!loading &&
        !['Qualifying', 'Level 1', 'Level 1A', 'Level 1B R1', 'Level 1B R2', 'S3'].includes(selectedRound) &&
        filteredMatches.length > 0 && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="text-2xl font-bold text-gray-900">
                {selectedRound === 'Level 2' && 'Level 2 - Qualifying Matches'}
                {selectedRound === 'Level 3' && 'Level 3 - Crossover Matches'}
                {selectedRound === 'Quarter Final' && 'Quarter Final Matches'}
                {selectedRound === 'Semi Final' && 'Semi Final Matches'}
                {selectedRound === 'Third Place' && 'Third Place Match'}
                {selectedRound === 'Final' && 'Final Match'}
              </h3>
              {renderLevelAutoFillButton(selectedRound, selectedRound)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onUpdateResult={handleUpdateResult}
                  onViewDetails={handleViewMatch}
                  isAdmin={isAdmin}
                  teamTiers={teamTierMap}
                  setConfig={setConfig}
                />
              ))}
            </div>
          </div>
        )}

      {/* No matches matched the active search */}
      {!loading &&
        normalizedMatchQuery &&
        filteredMatches.length === 0 &&
        divisionMatches.length > 0 &&
        visibleRoundTabs.some((round) => round.value === selectedRound) && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-600 text-lg mb-2">
              No matches for "{matchSearchQuery.trim()}" in this round
            </p>
            <p className="text-gray-500 text-sm">Try a different team name or clear the search.</p>
          </div>
        )}

      {/* No matches for selected round (should be rare once empty tabs are hidden) */}
      {!loading &&
        !normalizedMatchQuery &&
        filteredMatches.length === 0 &&
        divisionMatches.length > 0 &&
        visibleRoundTabs.some((round) => round.value === selectedRound) && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <div className="text-6xl mb-4">🏓</div>
            <p className="text-gray-600 text-lg mb-2">No {selectedRound} matches yet</p>
            <p className="text-gray-500 text-sm">
              {!isTierPyramid && selectedRound === 'Quarter Final' && 'Complete all qualifying matches to generate Quarter Finals.'}
              {!isTierPyramid && selectedRound === 'Semi Final' && 'Complete all Quarter Final matches to generate Semi Finals.'}
              {!isTierPyramid && selectedRound === 'Final' && 'Complete prior rounds to generate the Final.'}
              {isTierPyramid && selectedRound === 'Semi Final' && 'Complete Level 3 to generate Semi Finals.'}
              {isTierPyramid && selectedRound === 'Final' && 'Complete Semi Finals to generate the Final.'}
              {isTierPyramid && selectedRound === 'Level 1B R1' && level1bStatus === 'waiting' &&
                'Complete all S1 groups to unlock Level 1B.'}
              {isTierPyramid && selectedRound === 'Level 1B R1' && level1bStatus === 'ready' &&
                'S1 is complete - an admin must activate Level 1B.'}
              {isTierPyramid && selectedRound === 'Level 1B R2' &&
                'Complete all Round 1 Level 1B matches to unlock Round 2.'}
              {isTierPyramid &&
                !['Semi Final', 'Final', 'Level 1B R1', 'Level 1B R2'].includes(selectedRound) &&
                'Complete earlier pyramid stages to unlock this round.'}
            </p>
          </div>
        )}

      <Modal
        open={showResultForm && !!selectedMatch}
        onClose={closeMatchModal}
        title="Update Match"
        footer={
          selectedMatch && (
            <div className="flex gap-3 flex-row-reverse">
              <Button type="submit" form="match-result-form" variant="primary">
                Save Changes
              </Button>

              <Button type="button" variant="outline" onClick={closeMatchModal}>
                Cancel
              </Button>
            </div>
          )
        }
      >
        {selectedMatch && (
          <MatchResultForm
            embedded
            formId="match-result-form"
            match={selectedMatch}
            onSubmit={handleSaveResult}
            setConfig={setConfig}
            onCancel={closeMatchModal}
            onWinnerChange={handleWinnerChange}
          />
        )}
      </Modal>

      <Modal
        open={showMatchDetail && !!selectedMatch}
        onClose={closeMatchModal}
        title="Match details"
        footer={
          <div className="flex gap-3 flex-row-reverse">
            <Button type="button" variant="outline" onClick={closeMatchModal}>
              Close
            </Button>
          </div>
        }
      >
        {selectedMatch && (
          <MatchDetailPanel match={selectedMatch} setConfig={setConfig} />
        )}
      </Modal>

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


