import api from '@/utils/api.js';

export const getPairingRules = async (division) => {
  const params = division ? { division } : undefined;
  const response = await api.get('/team-pairing-rules', { params });
  return response.data || [];
};

export const getBuiltInPairingRules = async () => {
  const response = await api.get('/team-pairing-rules/built-in');
  return response.data || [];
};

export const getEffectivePairingRules = async () => {
  const response = await api.get('/team-pairing-rules/effective');
  return response.data || [];
};

export const createPairingRule = async (ruleData) => {
  const response = await api.post('/team-pairing-rules', ruleData);
  return response.data;
};

export const deletePairingRule = async (id) => {
  const response = await api.delete(`/team-pairing-rules/${id}`);
  return response;
};
