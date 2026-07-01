import { parseTournamentDivision } from '@shared/tournament/divisions.js';

/**
 * @param {string} expertise_level
 */
export function getExpertiseBadgeVariant(expertise_level) {
  if (expertise_level === 'Expert') return 'expert';
  if (expertise_level === 'Intermediate') return 'intermediate';
  return 'secondary';
}

/**
 * @param {string} division
 */
export function getDivisionBadgeVariant(division) {
  const { expertise_level } = parseTournamentDivision(division);
  return getExpertiseBadgeVariant(expertise_level);
}
