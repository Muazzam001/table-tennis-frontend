import axios from 'axios';

// Get API base URL from environment variable (set in .env file)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - runs before every API request
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - processes API responses
api.interceptors.response.use(
  (response) => {
    // Return the data from response (backend sends { success: true, data: ... })
    return response.data;
  },
  (error) => {
    // Extract error message from response or use default
    const message = error.response?.data?.error?.message 
      || error.response?.data?.message 
      || error.message 
      || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;

