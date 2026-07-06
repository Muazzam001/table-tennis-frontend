import { buildRoundRobinRounds } from '@shared/tournament/roundRobinScheduling.js';
import { isLevel1PyramidRound } from '@/config/matchSetConfig';

function pairKey(a, b) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

/**
 * Group completed round-robin matches into circle-method rounds for display.
 * @param {object[]} matches
 * @returns {{ roundNumber: number, matches: object[] }[]}
 */
export function groupMatchesByRoundRobinRounds(matches) {
  if (!matches?.length) return [];

  const teamIds = [...new Set(matches.flatMap((m) => [m.team1_id, m.team2_id]))];
  const rounds = buildRoundRobinRounds(teamIds);
  const byKey = new Map(matches.map((m) => [pairKey(m.team1_id, m.team2_id), m]));

  return rounds
    .map((round, index) => ({
      roundNumber: index + 1,
      matches: round
        .map((pair) => byKey.get(pairKey(pair.team1_id, pair.team2_id)))
        .filter(Boolean),
    }))
    .filter((round) => round.matches.length > 0);
}

/**
 * @param {object} match
 * @returns {{ primary: string, secondary?: string }}
 */
export function getPyramidMatchStageLabel(match) {
  if (match.round_type === 'S1') {
    return {
      primary: 'Level 1A',
      secondary: match.pool ? `Group ${match.pool}` : 'S1',
    };
  }
  if (match.round_type === 'Level 1B') {
    return { primary: 'Level 1B', secondary: 'Cross-group' };
  }
  if (match.round_type === 'S2' || match.round_type === 'S3') {
    return { primary: 'S3', secondary: 'Tier 1' };
  }
  return { primary: match.round_type, secondary: null };
}

export function isPyramidLevel1Match(match) {
  return isLevel1PyramidRound(match.round_type);
}

/**
 * @param {object[]} level1Matches
 * @param {{ level1Total?: number, s1?: number, s2?: number }} [expected]
 */
export function summarizeLevel1Schedule(level1Matches, expected = {}) {
  const s1 = level1Matches.filter((m) => m.round_type === 'S1').length;
  const s2 = level1Matches.filter(
    (m) => m.round_type === 'S2' || m.round_type === 'S3'
  ).length;
  const total = s1 + s2;
  const expectedTotal = expected.level1Total ?? (expected.s1 ?? 0) + (expected.s2 ?? 0);

  return {
    s1,
    s2,
    total,
    expectedTotal: expectedTotal || null,
    isIncomplete: expectedTotal > 0 && total < expectedTotal,
    expectedS1: expected.s1 ?? null,
    expectedS2: expected.s2 ?? null,
  };
}
