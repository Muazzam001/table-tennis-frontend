export const PLAYER_DIVISIONS = [
  {
    value: 'expert',
    label: 'Expert League (Men)',
    expertise_level: 'Expert',
    category: 'Men',
  },
  {
    value: 'intermediate',
    label: 'Intermediate League (Men)',
    expertise_level: 'Intermediate',
    category: 'Men',
  },
  {
    value: 'women',
    label: 'Women League',
    expertise_level: 'Expert',
    category: 'Women',
  },
];

/**
 * @param {string} division
 */
export function divisionToPlayerFields(division) {
  const match = PLAYER_DIVISIONS.find((d) => d.value === division);
  if (!match) {
    return { expertise_level: 'Expert', category: 'Men' };
  }
  return {
    expertise_level: match.expertise_level,
    category: match.category,
  };
}

/**
 * @param {{ expertise_level?: string, category?: string }} player
 */
export function playerToDivision(player) {
  if (player?.category === 'Women') {
    return 'women';
  }
  if (player?.expertise_level === 'Intermediate') {
    return 'intermediate';
  }
  return 'expert';
}

/**
 * @param {{ expertise_level?: string, category?: string }} player
 */
export function getPlayerDivisionLabel(player) {
  if (player?.category === 'Women') {
    return 'Women League';
  }
  if (player?.expertise_level === 'Intermediate') {
    return 'Intermediate';
  }
  return 'Expert';
}
