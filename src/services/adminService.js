import api from '../utils/api.js';

export const resetApplicationData = async () => {
  const response = await api.post('/admin/reset');
  return response;
};
