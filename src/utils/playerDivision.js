export { GENDERS, EXPERTISE_LEVELS } from '@shared/tournament/divisions.js';

/**
 * @param {{ expertise_level?: string, category?: string }} player
 */
export function getPlayerDivisionLabel(player) {
  const category = player?.category === 'Women' ? 'Women' : 'Men';
  const level = player?.expertise_level || 'Beginner';
  return `${category} · ${level}`;
}
