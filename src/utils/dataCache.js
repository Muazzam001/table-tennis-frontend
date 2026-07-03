// Session-scoped, in-memory stale-while-revalidate cache shared across pages.
//
// Lives at module scope so it survives component unmount/remount within a single
// page-load session (cleared on a full browser reload). Pages seed their initial
// state from the cache to paint instantly, then revalidate in the background.
//
// Keys are plain strings. Prefer shared keys (e.g. 'teams:all') so different pages
// that fetch the same resource reuse each other's data.

const store = new Map();

/** Well-known cache keys shared across pages. */
export const CACHE_KEYS = {
  playersAll: 'players:all',
  teamsAll: 'teams:all',
  matchesAll: 'matches:all',
  divisionSettings: 'division:settings',
  tournamentOverview: (division) => `tournament:overview:${division}`,
  divisionGroups: (division) => `tournament:groups:${division}`,
};

/** @returns cached value, or undefined if absent. */
export const getCached = (key) => store.get(key);

/** @returns true if a value (even null/[]) is cached for key. */
export const hasCached = (key) => store.has(key);

/** Store a value and return it (convenient for inline use in async flows). */
export const setCached = (key, value) => {
  store.set(key, value);
  return value;
};

/** Clear one key, or the entire cache when called with no argument. */
export const clearCached = (key) => {
  if (key === undefined) store.clear();
  else store.delete(key);
};
