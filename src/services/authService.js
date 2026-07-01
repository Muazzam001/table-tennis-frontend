// API service functions for authentication
import api from '@/utils/api.js';

// Login
export const login = async (username, password) => {
  try {
    const response = await api.post('/auth/login', {
      username,
      password
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Get current user info
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response;
  } catch (error) {
    throw error;
  }
};

// Logout
export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    // Ignore logout errors
    console.error('Logout error:', error);
  }
};

