const STORAGE_KEY = 'tournamentCourtConfig';

export const DEFAULT_COURT_COUNT = 2;
export const DEFAULT_VENUE_BASE = 'Main Court';

const normalizeCourtCount = (value, fallback) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 16) return fallback;
  return parsed;
};

export const getDefaultCourtConfig = () => ({
  courtCount: DEFAULT_COURT_COUNT,
  venueBase: DEFAULT_VENUE_BASE,
});

export const getCourtConfig = () => {
  if (typeof window === 'undefined') return getDefaultCourtConfig();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultCourtConfig();

    const parsed = JSON.parse(raw);
    return {
      courtCount: normalizeCourtCount(parsed?.courtCount, DEFAULT_COURT_COUNT),
      venueBase: String(parsed?.venueBase ?? DEFAULT_VENUE_BASE).trim() || DEFAULT_VENUE_BASE,
    };
  } catch {
    return getDefaultCourtConfig();
  }
};

export const saveCourtConfig = (config) => {
  const sanitized = {
    courtCount: normalizeCourtCount(config?.courtCount, DEFAULT_COURT_COUNT),
    venueBase: String(config?.venueBase ?? DEFAULT_VENUE_BASE).trim() || DEFAULT_VENUE_BASE,
  };

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  }

  return sanitized;
};

export const resetCourtConfig = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return getDefaultCourtConfig();
};

export const getCourtSummary = (config = null) => {
  const active = config || getCourtConfig();
  return {
    ...active,
    courtLabel:
      active.courtCount > 1
        ? `${active.courtCount} courts (${active.venueBase} 1–${active.courtCount})`
        : active.venueBase,
  };
};

export const sanitizeCourtConfig = (config) => ({
  courtCount: normalizeCourtCount(config?.courtCount, DEFAULT_COURT_COUNT),
  venueBase: String(config?.venueBase ?? DEFAULT_VENUE_BASE).trim() || DEFAULT_VENUE_BASE,
});

export const validateCourtConfig = (config) => {
  const errors = {};
  const parsed = parseInt(config?.courtCount, 10);

  if (Number.isNaN(parsed) || parsed < 1 || parsed > 16) {
    errors.courtCount = 'Court count must be between 1 and 16.';
  }

  const venueBase = String(config?.venueBase ?? '').trim();
  if (!venueBase) {
    errors.venueBase = 'Venue name is required.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    config: sanitizeCourtConfig(config),
    summary: getCourtSummary(sanitizeCourtConfig(config)),
  };
};
