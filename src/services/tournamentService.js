import api from '../utils/api.js';

export const getTournamentOverview = async (league) => {
  const response = await api.get(`/tournament/overview?league=${encodeURIComponent(league)}`);
  return response.data;
};

export const getLeagueGroups = async (league) => {
  const response = await api.get(`/tournament/groups?league=${encodeURIComponent(league)}`);
  return response.data;
};

export const getTournamentSetup = async (league, options = {}) => {
  const params = new URLSearchParams({ league });
  if (options.startDate) params.append('startDate', options.startDate);
  if (options.groupCount) params.append('groupCount', String(options.groupCount));
  const response = await api.get(`/tournament/setup?${params.toString()}`);
  return response.data;
};
