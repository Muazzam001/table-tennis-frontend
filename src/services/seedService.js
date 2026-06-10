// API service functions for seeding operations
import api from '../utils/api.js';

/** Seed demo players only (teams and matches are created from the UI workflow). */
export const seedPlayers = async (clearExisting = true) => {
  const response = await api.post('/seed/players', { clearExisting });
  return response.data || response;
};

/** @deprecated Use seedPlayers */
export const seedTeamsAndMatches = async (_startDate, _endDate, _venue, clearExisting = true) =>
  seedPlayers(clearExisting);
