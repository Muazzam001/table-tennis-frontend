// API service functions for seeding operations
import api from '../utils/api.js';

// Seed players, teams and matches for demo purposes
// Database setup is handled automatically
export const seedTeamsAndMatches = async (startDate, endDate, venue, clearExisting = true, seedPlayers = true) => {
  try {
    const response = await api.post('/seed/teams-and-matches', {
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || null,
      venue: venue || 'Main Court',
      clearExisting: clearExisting,
      seedPlayers: seedPlayers
    });
    return response.data || response;
  } catch (error) {
    throw error;
  }
};

