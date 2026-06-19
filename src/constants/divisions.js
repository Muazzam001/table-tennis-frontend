export {
  TOURNAMENT_DIVISIONS as DIVISIONS,
  VALID_DIVISIONS,
  GENDERS,
  EXPERTISE_LEVELS,
  DEFAULT_TOURNAMENT_DIVISION,
  getTournamentDivisionLabel,
  parseTournamentDivision,
  filterPlayersForDivision,
  buildDivisionMap,
  countPlayersByDivision,
} from '@shared/tournament/divisions.js';

export const COMPETITION_FORMATS = [
  { value: 'doubles', label: 'Doubles (2-player teams)' },
  { value: 'singles', label: 'Singles (individual players)' },
];

export const getCompetitionFormatLabel = (format) =>
  COMPETITION_FORMATS.find((f) => f.value === format)?.label || format;
