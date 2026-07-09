import { getLevel1BRoundMatches } from '@shared/tournament/formats/tierPyramid/advancement.js';

const S1_SOURCE_RE = /^S1-([A-Z])-(\d+)$/;

/**
 * @param {string | null | undefined} source
 * @returns {string | null}
 */
export function formatS1QualifierLabel(source) {
  const match = source?.match(S1_SOURCE_RE);
  if (!match) return null;
  return `${match[1]}${match[2]}`;
}

/**
 * @param {Map<number, object>} entrantById
 * @param {number} teamId
 */
function qualifierLabelForTeam(entrantById, teamId) {
  return formatS1QualifierLabel(entrantById.get(teamId)?.advancement_source);
}

/**
 * @param {object} r1Match
 * @param {Map<number, object>} entrantById
 */
export function getR1SlotPairingLabel(r1Match, entrantById) {
  const l1 = qualifierLabelForTeam(entrantById, r1Match.team1_id);
  const l2 = qualifierLabelForTeam(entrantById, r1Match.team2_id);
  if (l1 && l2) return `${l1}·${l2}`;
  return `Match ${(r1Match.stage_sequence ?? 0) + 1}`;
}

/**
 * Human-readable pairing hint for a Level 1B match.
 * @param {object} match
 * @param {{ entrants?: object[], r1Matches?: object[] }} [options]
 */
export function getLevel1BPairingHint(match, { entrants = [], r1Matches = [] } = {}) {
  const entrantById = new Map(entrants.map((e) => [e.id, e]));

  const direct1 = qualifierLabelForTeam(entrantById, match.team1_id);
  const direct2 = qualifierLabelForTeam(entrantById, match.team2_id);
  if (direct1 && direct2) {
    return `${direct1} vs ${direct2}`;
  }

  if (r1Matches.length > 0) {
    const half = Math.floor(r1Matches.length / 2);
    const r2Index = (match.stage_sequence ?? 0) - r1Matches.length;
    if (r2Index >= 0 && r2Index < half) {
      const slot1 = getR1SlotPairingLabel(r1Matches[r2Index], entrantById);
      const slot2 = getR1SlotPairingLabel(r1Matches[r2Index + half], entrantById);
      return `Winner (${slot1}) vs Winner (${slot2})`;
    }
  }

  return match.label || null;
}

/**
 * @param {object[]} matches — Level 1B matches only
 * @param {object[]} [entrants]
 */
export function buildLevel1BRoundsView(matches, entrants = []) {
  const l1b = matches
    .filter((m) => m.round_type === 'Level 1B')
    .sort((a, b) => (a.stage_sequence ?? 0) - (b.stage_sequence ?? 0));
  const rounds = getLevel1BRoundMatches(l1b);
  const r1Matches = rounds[0] || [];

  return rounds.map((roundMatches, roundIndex) => ({
    roundIndex,
    roundNumber: roundIndex + 1,
    title:
      roundIndex === 0
        ? 'Round 1 — Cross-group'
        : `Round ${roundIndex + 1} — Winners' crossover`,
    subtitle:
      roundIndex === 0
        ? '(A,B): A1·B4, A2·B3… · (C,D): C1·D4, C2·D3…'
        : 'Winners from matching (A,B) and (C,D) slots',
    matches: roundMatches.map((m) => ({
      ...m,
      pairingHint: getLevel1BPairingHint(m, { entrants, r1Matches }),
    })),
  }));
}
