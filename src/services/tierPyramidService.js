import api from '@/utils/api.js';

export const getPyramidTiers = async (division) => {
  const response = await api.get(`/tournament/pyramid/tiers?division=${encodeURIComponent(division)}`);
  return response.data;
};

export const getPyramidSetup = async (division) => {
  const response = await api.get(`/tournament/pyramid/setup?division=${encodeURIComponent(division)}`);
  return response.data;
};

export const assignPyramidTiers = async (division, assignments, formatConfig = null) => {
  const response = await api.post('/tournament/pyramid/assign-tiers', {
    division,
    assignments,
    format_config: formatConfig,
  });
  return response.data;
};

export const getPyramidProgressionLog = async (division, limit = 100) => {
  const response = await api.get(
    `/tournament/pyramid/progression-log?division=${encodeURIComponent(division)}&limit=${limit}`
  );
  return response.data;
};

export const overridePyramidAdvancement = async (division, updates, notes = null) => {
  const response = await api.post('/tournament/pyramid/override-advancement', {
    division,
    updates,
    notes,
  });
  return response.data;
};

export const regeneratePyramidStage = async (division, fromStage) => {
  const response = await api.post('/tournament/pyramid/regenerate-stage', {
    division,
    fromStage,
  });
  return response.data;
};
