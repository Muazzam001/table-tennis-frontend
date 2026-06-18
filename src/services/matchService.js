// API service functions for match operations
import api from '@/utils/api.js';

// Get all matches (optionally filtered by division)
export const getMatches = async (division = null) => {
  try {
    const params = division ? `?division=${encodeURIComponent(division)}` : '';
    const response = await api.get(`/matches${params}`);
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
export const getTeamStandings = async (pool = null, roundType = null, division = null) => {
  try {
    const params = new URLSearchParams();
    if (pool) params.append('pool', pool);
    if (roundType) params.append('roundType', roundType);
    if (division) params.append('division', division);

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

// Create multiple matches at once (optional division scopes and validates inserts)
export const createMultipleMatches = async (matches, division = null) => {
  try {
    const response = await api.post('/matches/multiple', { matches, division });
    return response.data || response;
  } catch (error) {
    throw error;
  }
};

// Generate match schedule
export const generateMatchSchedule = async (startDate, endDate, venue, division, options = {}) => {
  try {
    const { format = 'groups', groupCount, replaceExisting, timeSlotConfig, courtConfig } = options;
    const response = await api.post('/matches/generate-schedule', {
      startDate,
      endDate: endDate || null,
      venue: venue || 'Main Court',
      division,
      format,
      groupCount,
      replaceExisting: Boolean(replaceExisting),
      timeSlotConfig: timeSlotConfig || null,
      courtConfig: courtConfig || null,
    });
    const payload = response.data || response;
    const matches = payload.matches ?? response.data?.matches ?? [];
    const config = payload.config ?? response.data?.config;
    return {
      matches,
      config,
      groups: payload.groups ?? response.data?.groups,
      expectedMatchCount: payload.expectedMatchCount ?? response.data?.expectedMatchCount,
      division: payload.division ?? response.data?.division ?? division,
    };
  } catch (error) {
    throw error;
  }
};

// Generate Third Place match
export const generateThirdPlace = async (startDate, venue, division, timeSlotConfig = null, courtConfig = null) => {
  try {
    const response = await api.post('/matches/generate-third-place', {
      startDate,
      venue: venue || 'Main Court',
      division,
      timeSlotConfig,
      courtConfig,
    });
    return response;
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
export const generateQuarterFinals = async (startDate, venue, division, timeSlotConfig = null, courtConfig = null) => {
  try {
    const response = await api.post('/matches/generate-quarter-finals', {
      startDate,
      venue: venue || 'Main Court',
      division,
      timeSlotConfig,
      courtConfig,
    });
    // API interceptor already returns response.data, so response is the data object
    console.log('generateQuarterFinals response:', response);
    return response;
  } catch (error) {
    throw error;
  }
};

// Generate Semi Finals
export const generateSemiFinals = async (startDate, venue, division, timeSlotConfig = null, courtConfig = null) => {
  try {
    const response = await api.post('/matches/generate-semi-finals', {
      startDate,
      venue: venue || 'Main Court',
      division,
      timeSlotConfig,
      courtConfig,
    });
    // API interceptor already returns response.data, so response is the data object
    return response;
  } catch (error) {
    throw error;
  }
};

// Generate Final
export const generateFinal = async (startDate, venue, division, timeSlotConfig = null, courtConfig = null) => {
  try {
    const response = await api.post('/matches/generate-final', {
      startDate,
      venue: venue || 'Main Court',
      division,
      timeSlotConfig,
      courtConfig,
    });
    // API interceptor already returns response.data, so response is the data object
    return response;
  } catch (error) {
    throw error;
  }
};


