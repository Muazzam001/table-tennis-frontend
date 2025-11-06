// API service functions for statistics operations
import api from '../utils/api.js';

// Get dashboard statistics (overview stats)
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/statistics/dashboard');
    return response.data || {};
  } catch (error) {
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

