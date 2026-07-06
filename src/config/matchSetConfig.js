import {
  DEFAULT_GAME_POINTS_PER_SET,
  GAME_POINT_OPTIONS,
  normalizeGamePointsPerSet,
} from '@shared/tournament/gamePointRules.js';
import {
  DEFAULT_SET_COUNTS,
  getSetCountForRound as sharedGetSetCountForRound,
  resolveSetConfigKey,
  sanitizeSetCounts,
} from '@shared/tournament/matchSetDefaults.js';

const STORAGE_KEY = 'matchSetConfig';

export const MATCH_SET_ROUND_LABELS = {
  Qualifying: 'Qualifying',
  'Quarter Final': 'Quarter Final',
  'Semi Final': 'Semi Final',
  'Third Place': 'Third Place',
  Final: 'Final',
  'Level 1': 'Level 1 (S1 Groups + S2 Tier 1)',
  'Level 1B': 'Level 1B',
  'Level 2': 'Level 2',
  'Level 3': 'Level 3',
};

export const GROUP_STAGE_SET_ROUNDS = [
  'Qualifying',
  'Quarter Final',
  'Semi Final',
  'Third Place',
  'Final',
];

export const TIER_PYRAMID_SET_ROUNDS = ['Level 1', 'Level 1B', 'Level 2', 'Level 3', 'Semi Final', 'Third Place', 'Final'];

export { GAME_POINT_OPTIONS, DEFAULT_GAME_POINTS_PER_SET, DEFAULT_SET_COUNTS, resolveSetConfigKey };

const migrateLevel1SetKeys = (sets) => {
  const migrated = { ...sets };
  const level1Sources = [
    migrated['Level 1'],
    migrated.S1,
    migrated.S2,
    migrated.S3,
    migrated['Level 1 - S1'],
    migrated['Level 1 - S2'],
  ].filter((value) => value != null);

  if (level1Sources.length > 0) {
    migrated['Level 1'] = level1Sources[0];
  }

  delete migrated.S1;
  delete migrated.S2;
  delete migrated.S3;
  delete migrated['Level 1 - S1'];
  delete migrated['Level 1 - S2'];
  delete migrated['Level 1 - S3'];

  return migrated;
};

const isLegacyFlatConfig = (parsed) =>
  parsed &&
  typeof parsed === 'object' &&
  !parsed.sets &&
  Object.keys(parsed).some((key) => key in DEFAULT_SET_COUNTS);

const migrateStoredConfig = (parsed) => {
  if (!parsed || typeof parsed !== 'object') {
    return {
      gamePointsPerSet: DEFAULT_GAME_POINTS_PER_SET,
      sets: { ...DEFAULT_SET_COUNTS },
    };
  }

  if (isLegacyFlatConfig(parsed)) {
    return {
      gamePointsPerSet: normalizeGamePointsPerSet(parsed.gamePointsPerSet),
      sets: migrateLevel1SetKeys(parsed),
    };
  }

  return {
    gamePointsPerSet: normalizeGamePointsPerSet(parsed.gamePointsPerSet),
    sets: migrateLevel1SetKeys(parsed.sets || {}),
  };
};

const sanitizeConfig = (config) => ({
  gamePointsPerSet: normalizeGamePointsPerSet(config?.gamePointsPerSet),
  sets: sanitizeSetCounts(config?.sets),
});

export const getDefaultMatchSetConfig = () => sanitizeConfig(migrateStoredConfig({}));

export const getMatchSetConfig = () => {
  if (typeof window === 'undefined') return getDefaultMatchSetConfig();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultMatchSetConfig();

    const parsed = migrateStoredConfig(JSON.parse(raw));
    return sanitizeConfig(parsed);
  } catch {
    return getDefaultMatchSetConfig();
  }
};

export const saveMatchSetConfig = (config) => {
  if (typeof window === 'undefined') return getDefaultMatchSetConfig();
  const migrated = migrateStoredConfig(config);
  const sanitized = sanitizeConfig(migrated);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  return sanitized;
};

export const resetMatchSetConfig = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return getDefaultMatchSetConfig();
};

export const getSetCountForRound = (roundType, config = null) =>
  sharedGetSetCountForRound(roundType, config || getMatchSetConfig());

export const getGamePointsPerSet = (config = null) => {
  const activeConfig = config || getMatchSetConfig();
  return normalizeGamePointsPerSet(activeConfig.gamePointsPerSet);
};

export const getMatchSetRoundLabel = (roundType) =>
  MATCH_SET_ROUND_LABELS[roundType] || roundType;

export const isLevel1PyramidRound = (roundType) =>
  roundType === 'Level 1' || roundType === 'S1' || roundType === 'S2' || roundType === 'S3';
