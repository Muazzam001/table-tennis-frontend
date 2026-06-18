import api from '@/utils/api.js';

export const getDivisionSettings = async () => {
  const response = await api.get('/divisions');
  return response.data || [];
};

export const getDivisionSetting = async (division) => {
  const response = await api.get(`/divisions/${encodeURIComponent(division)}`);
  return response.data;
};

export const updateDivisionFormat = async (division, competitionFormat) => {
  const response = await api.put(`/divisions/${encodeURIComponent(division)}`, {
    competition_format: competitionFormat,
  });
  return response.data;
};
