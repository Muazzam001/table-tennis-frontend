import {
  getLevel3Matches,
  getPyramidSemiFinalMatches,
} from '@shared/tournament/formats/tierPyramid/roundFilters.js';
import { getLevel1BRoundMatches } from '@shared/tournament/formats/tierPyramid/advancement.js';
import { buildLevel1BRoundsView } from './level1bPairingLabels.js';

const STAGE_META = {
  S1: { label: 'Level 1A (S1)', subtitle: 'Tier 2 & 3 groups', accent: 'border-green-300 bg-green-50' },
  L1B: { label: 'Level 1B (S1)', subtitle: '16 → 4 cross-group', accent: 'border-teal-300 bg-teal-50' },
  S2: { label: 'Level 1C (S2)', subtitle: 'Tier 1 round-robin', accent: 'border-blue-300 bg-blue-50' },
  L2: { label: 'Level 2', subtitle: 'Qualifying', accent: 'border-amber-300 bg-amber-50' },
  L3: { label: 'Level 3', subtitle: 'Crossover', accent: 'border-red-300 bg-red-50' },
  SF: { label: 'Semi Finals', subtitle: '4 → 2', accent: 'border-orange-300 bg-orange-50' },
  ThirdPlace: {
    label: 'Third Place',
    subtitle: 'Semi-final losers',
    accent: 'border-amber-300 bg-amber-50',
  },
  Final: { label: 'Final', subtitle: 'Championship', accent: 'border-purple-300 bg-purple-50' },
};

/**
 * Build pyramid bracket view model from overview + matches.
 * @param {object} overview
 */
export function buildPyramidBracketView(overview) {
  const matches = overview?.matches || [];
  const entrants = overview?.pyramid?.entrants || [];
  const entrantMap = Object.fromEntries(entrants.map((e) => [e.id, e]));

  const s1Matches = matches.filter((m) => m.round_type === 'S1');
  const l1bMatches = matches
    .filter((m) => m.round_type === 'Level 1B')
    .sort((a, b) => (a.stage_sequence ?? 0) - (b.stage_sequence ?? 0));
  const s2Matches = matches.filter((m) => m.round_type === 'S2');
  const l2Matches = matches
    .filter((m) => m.round_type === 'Level 2')
    .sort((a, b) => (a.stage_sequence ?? 0) - (b.stage_sequence ?? 0));
  const l3Matches = getLevel3Matches(matches).sort(
    (a, b) => (a.stage_sequence ?? 0) - (b.stage_sequence ?? 0)
  );
  const semiFinals = getPyramidSemiFinalMatches(matches).sort(
    (a, b) => (a.stage_sequence ?? 0) - (b.stage_sequence ?? 0)
  );
  const thirdPlaceMatch = matches.find((m) => m.round_type === 'Third Place') || null;
  const finalMatch = matches.find((m) => m.round_type === 'Final') || null;

  const s1Pools = [...new Set(s1Matches.map((m) => m.pool).filter(Boolean))].sort();
  const s1Groups = s1Pools.map((poolId) => ({
    id: poolId,
    matches: s1Matches.filter((m) => m.pool === poolId),
  }));

  const enrich = (match) => ({
    ...match,
    team1_tier: entrantMap[match.team1_id]?.tier,
    team2_tier: entrantMap[match.team2_id]?.tier,
    team1_source: entrantMap[match.team1_id]?.advancement_source,
    team2_source: entrantMap[match.team2_id]?.advancement_source,
  });

  const l1bRounds = buildLevel1BRoundsView(l1bMatches, entrants).map((round) => ({
    ...round,
    matches: round.matches.map(enrich),
  }));

  return {
    stages: STAGE_META,
    s1: { groups: s1Groups, matches: s1Matches.map(enrich) },
    l1b: {
      matches: l1bMatches.map(enrich),
      rounds: l1bRounds,
      roundCount: getLevel1BRoundMatches(l1bMatches).length,
      standings: overview?.pyramid?.l1bStandings || [],
    },
    s2: { matches: s2Matches.map(enrich), standings: overview?.pyramid?.s2Standings || [] },
    l2: { matches: l2Matches.map(enrich) },
    l3: { matches: l3Matches.map(enrich) },
    semiFinals: semiFinals.map(enrich),
    thirdPlace: thirdPlaceMatch ? enrich(thirdPlaceMatch) : null,
    final: finalMatch ? enrich(finalMatch) : null,
    entrants,
  };
}

export { STAGE_META };
