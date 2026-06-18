export const DIVISIONS = [
  { value: 'Expert', label: 'Expert Division' },
  { value: 'Intermediate', label: 'Intermediate Division' },
  { value: 'Women', label: 'Women Division' },
];

export const COMPETITION_FORMATS = [
  { value: 'doubles', label: 'Doubles (2-player teams)' },
  { value: 'singles', label: 'Singles (individual players)' },
];

export const getCompetitionFormatLabel = (format) =>
  COMPETITION_FORMATS.find((f) => f.value === format)?.label || format;
