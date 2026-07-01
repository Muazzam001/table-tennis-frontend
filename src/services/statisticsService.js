// API service functions for statistics operations
import api from '@/utils/api.js';

// Get dashboard statistics (overview stats)
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/statistics/dashboard');
    console.log('📡 statisticsService - Raw response from API:', response);
    
    // API interceptor returns response.data from axios
    // Backend sends: { success: true, data: { totalPlayers: ..., ... } }
    // So response is: { success: true, data: { totalPlayers: ..., ... } }
    // We need to extract the nested data field
    if (response && response.success && response.data) {
      console.log('📡 statisticsService - Extracted data:', response.data);
      return response.data; // Return { totalPlayers: ..., totalTeams: ..., ... }
    }
    // If response is already the data object (direct structure), return it
    if (response && (response.totalPlayers !== undefined || response.totalTeams !== undefined)) {
      console.log('📡 statisticsService - Using direct response:', response);
      return response;
    }
    // Fallback: return empty object
    console.warn('📡 statisticsService - No valid data found, returning empty object');
    return {};
  } catch (error) {
    console.error('📡 statisticsService - Error:', error);
    throw error;
  }
};

// Get all statistics
export const getAllStatistics = async () => {
  try {
    const response = await api.get('/statistics');
    return response.data || [];
  } catch (error) {
    throw error;
  }
};

// Get statistics by player ID
export const getPlayerStatistics = async (playerId) => {
  try {
    const response = await api.get(`/statistics/player/${playerId}`);
    return response.data || [];
  } catch (error) {
    throw error;
  }
};

// Get statistics by team ID
export const getTeamStatistics = async (teamId) => {
  try {
    const response = await api.get(`/statistics/team/${teamId}`);
    return response.data || [];
  } catch (error) {
    throw error;
  }
};


