// API service functions for match operations
import api from '../utils/api.js';

// Get all matches
export const getMatches = async () => {
  try {
    const response = await api.get('/matches');
    return response.data || [];
  } catch (error) {
    throw error;
  }
};

// Get matches by round type
export const getMatchesByRound = async (roundType) => {
  try {
    const response = await api.get(`/matches/round/${roundType}`);
    return response.data || [];
  } catch (error) {
    throw error;
  }
};

// Get team standings
export const getTeamStandings = async (pool = null, roundType = null) => {
  try {
    const params = new URLSearchParams();
    if (pool) params.append('pool', pool);
    if (roundType) params.append('roundType', roundType);
    
    const response = await api.get(`/matches/standings?${params.toString()}`);
    return response.data || [];
  } catch (error) {
    throw error;
  }
};

// Get match by ID
export const getMatchById = async (id) => {
  try {
    const response = await api.get(`/matches/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create a single match
export const createMatch = async (matchData) => {
  try {
    const response = await api.post('/matches', matchData);
    return response.data || response;
  } catch (error) {
    throw error;
  }
};

// Create multiple matches at once
export const createMultipleMatches = async (matches) => {
  try {
    const response = await api.post('/matches/multiple', { matches });
    return response.data || response;
  } catch (error) {
    throw error;
  }
};

// Generate match schedule
export const generateMatchSchedule = async (startDate, endDate, venue) => {
  try {
    const response = await api.post('/matches/generate-schedule', {
      startDate,
      endDate: endDate || null,
      venue: venue || 'Main Court',
      daysBetweenRounds: 1
    });
    return response.data || response;
  } catch (error) {
    throw error;
  }
};

// Update match result
export const updateMatchResult = async (id, resultData) => {
  try {
    const response = await api.put(`/matches/${id}/result`, resultData);
    return response;
  } catch (error) {
    throw error;
  }
};

// Generate Quarter Finals
export const generateQuarterFinals = async (startDate, venue) => {
  try {
    const response = await api.post('/matches/generate-quarter-finals', {
      startDate,
      venue: venue || 'Main Court'
    });
    return response.data || response;
  } catch (error) {
    throw error;
  }
};

// Generate Semi Finals
export const generateSemiFinals = async (startDate, venue) => {
  try {
    const response = await api.post('/matches/generate-semi-finals', {
      startDate,
      venue: venue || 'Main Court'
    });
    return response.data || response;
  } catch (error) {
    throw error;
  }
};

// Generate Final
export const generateFinal = async (startDate, venue) => {
  try {
    const response = await api.post('/matches/generate-final', {
      startDate,
      venue: venue || 'Main Court'
    });
    return response.data || response;
  } catch (error) {
    throw error;
  }
};

