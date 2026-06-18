import api from '@/utils/api.js';

export const getTournamentHistory = async (division) => {
  const params = division ? `?division=${encodeURIComponent(division)}` : '';
  const response = await api.get(`/tournament/history${params}`);
  return response.data;
};

export const getTournamentHistoryDetail = async (id) => {
  const response = await api.get(`/tournament/history/${id}`);
  return response.data;
};

export const archiveTournament = async (division) => {
  const response = await api.post(`/tournament/archive?division=${encodeURIComponent(division)}`);
  return response;
};
