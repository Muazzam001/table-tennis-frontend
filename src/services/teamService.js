// API service functions for team operations
// This file contains all functions that communicate with the backend API for teams

import api from '@/utils/api.js';

// Get all teams with player information (optionally filtered by division)
export const getTeams = async (division = null) => {
  try {
    const params = division ? `?division=${encodeURIComponent(division)}` : '';
    const response = await api.get(`/teams${params}`);
    return response.data || [];
  } catch (error) {
    throw error;
  }
};

// Get a single team by ID
export const getTeamById = async (id) => {
  try {
    const response = await api.get(`/teams/${id}`);
    return response.data;
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

// Delete all teams for a division (cascades to that division's matches)
export const deleteTeamsByDivision = async (division) => {
  try {
    const response = await api.delete(`/teams/division/${encodeURIComponent(division)}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Generate random teams for one division (saves directly to DB)
export const generateRandomTeams = async (division) => {
  try {
    const response = await api.post('/teams/generate', { division });
    return response.data || response;
  } catch (error) {
    throw error;
  }
};

// Save multiple teams to database for a division (replaces existing teams in that division)
export const saveTeamsForDivision = async (teams, division) => {
  try {
    const response = await api.put(`/teams/division/${encodeURIComponent(division)}`, { teams });
    return response.data?.teams || response.teams || [];
  } catch (error) {
    throw error;
  }
};

/** @deprecated Use saveTeamsForDivision */
export const saveTeams = async (teams, division = null) => {
  if (division) {
    return saveTeamsForDivision(teams, division);
  }
  const savedTeams = [];
  for (const team of teams) {
    const response = await api.post('/teams', {
      team_name: team.team_name,
      player1_id: team.player1_id,
      player2_id: team.player2_id,
    });
    savedTeams.push(response.data || response);
  }
  return savedTeams;
};
