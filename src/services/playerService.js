// API service functions for player operations
// This file contains all functions that communicate with the backend API for players

import api from '../utils/api.js';

// Get all active players
export const getPlayers = async () => {
  try {
    // Backend returns: { success: true, data: [...] }
    // API interceptor extracts response.data, so we get: { success: true, data: [...] }
    const response = await api.get('/players');
    return response.data || []; // Return the data array
  } catch (error) {
    throw error;
  }
};

// Get a single player by ID
export const getPlayerById = async (id) => {
  try {
    const response = await api.get(`/players/${id}`);
    return response.data; // Returns player object
  } catch (error) {
    throw error;
  }
};

// Create a new player
export const createPlayer = async (playerData) => {
  try {
    const response = await api.post('/players', playerData);
    // Backend returns: { success: true, message: '...', data: {...} }
    return response.data || response; // Return the created player data
  } catch (error) {
    throw error;
  }
};

// Update an existing player
export const updatePlayer = async (id, playerData) => {
  try {
    const response = await api.put(`/players/${id}`, playerData);
    // Backend returns: { success: true, message: '...' }
    return response; // Return the response
  } catch (error) {
    throw error;
  }
};

// Delete a player (soft delete)
export const deletePlayer = async (id) => {
  try {
    const response = await api.delete(`/players/${id}`);
    // Backend returns: { success: true, message: '...' }
    return response; // Return the response
  } catch (error) {
    throw error;
  }
};

