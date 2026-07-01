export const TOURNAMENT_FORMATS = [
  { value: 'groups', label: 'Groups + Knockout', description: 'Classic round-robin groups then knockout bracket' },
  {
    value: 'tier-pyramid',
    label: 'Tier Pyramid',
    description: '32-player tier format with S1/S2 parallel play and crossover levels',
  },
];

export const DEFAULT_TOURNAMENT_FORMAT = 'groups';

export const getTournamentFormatLabel = (format) =>
  TOURNAMENT_FORMATS.find((f) => f.value === format)?.label || format;

export const isTierPyramidFormat = (format) => format === 'tier-pyramid';
