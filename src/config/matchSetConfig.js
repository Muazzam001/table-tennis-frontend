const STORAGE_KEY = 'matchSetConfig';

const DEFAULT_MATCH_SET_CONFIG = {
  Qualifying: 1,
  'Quarter Final': 3,
  'Semi Final': 5,
  'Third Place': 5,
  Final: 7,
};

const normalizeToOdd = (value, fallback) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  if (parsed % 2 === 0) return parsed + 1;
  return parsed;
};

export const getDefaultMatchSetConfig = () => ({ ...DEFAULT_MATCH_SET_CONFIG });

export const getMatchSetConfig = () => {
  if (typeof window === 'undefined') return getDefaultMatchSetConfig();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultMatchSetConfig();

    const parsed = JSON.parse(raw);
    return Object.keys(DEFAULT_MATCH_SET_CONFIG).reduce((acc, roundType) => {
      acc[roundType] = normalizeToOdd(parsed?.[roundType], DEFAULT_MATCH_SET_CONFIG[roundType]);
      return acc;
    }, {});
  } catch {
    return getDefaultMatchSetConfig();
  }
};

export const saveMatchSetConfig = (config) => {
  if (typeof window === 'undefined') return getDefaultMatchSetConfig();
  const sanitized = Object.keys(DEFAULT_MATCH_SET_CONFIG).reduce((acc, roundType) => {
    acc[roundType] = normalizeToOdd(config?.[roundType], DEFAULT_MATCH_SET_CONFIG[roundType]);
    return acc;
  }, {});
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  return sanitized;
};

export const resetMatchSetConfig = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return getDefaultMatchSetConfig();
};

export const getSetCountForRound = (roundType, config = null) => {
  const activeConfig = config || getMatchSetConfig();
  return activeConfig[roundType] || DEFAULT_MATCH_SET_CONFIG[roundType] || 1;
};
