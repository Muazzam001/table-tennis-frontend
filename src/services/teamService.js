// API service functions for team operations
// This file contains all functions that communicate with the backend API for teams

import api from '../utils/api.js';

// Get all teams with player information
export const getTeams = async () => {
  try {
    const response = await api.get('/teams');
    return response.data || []; // Returns array of teams
  } catch (error) {
    throw error;
  }
};

// Get a single team by ID
export const getTeamById = async (id) => {
  try {
    const response = await api.get(`/teams/${id}`);
    return response.data; // Returns team object
  } catch (error) {
    throw error;
  }
};

// Create a new team manually
export const createTeam = async (teamData) => {
  try {
    const response = await api.post('/teams', teamData);
    return response.data || response;
  } catch (error) {
    throw error;
  }
};

// Update an existing team
export const updateTeam = async (id, teamData) => {
  try {
    const response = await api.put(`/teams/${id}`, teamData);
    return response;
  } catch (error) {
    throw error;
  }
};

// Delete a team
export const deleteTeam = async (id) => {
  try {
    const response = await api.delete(`/teams/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Generate random teams automatically
// Pairs one Intermediate + one Expert per team
export const generateRandomTeams = async () => {
  try {
    const response = await api.post('/teams/generate');
    return response.data || response; // Returns generated teams
  } catch (error) {
    throw error;
  }
};

