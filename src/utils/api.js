import axios from 'axios';

/** Absolute URLs get https:// if missing; relative paths (e.g. /api) are left as-is for Vercel proxy. */
function normalizeApiBaseUrl(url) {
  if (!url) return url;
  const trimmed = String(url).trim().replace(/\/+$/, '');
  if (trimmed.startsWith('/')) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

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
    // Add token to request if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
    // Handle network errors (backend unreachable or CORS blocked)
    if (!error.response) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        const isLocalDev =
          window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1';
        const message = isLocalDev
          ? 'Backend server is not running. Please start the backend server on port 3000.'
          : 'Unable to reach the API server. Check that the backend is deployed on Vercel and CORS_ORIGIN matches this site.';
        return Promise.reject(new Error(message));
      }
    }
    
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      // Clear token and redirect to login if not already there
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(new Error('Session expired. Please login again.'));
    }

    // Handle 403 Forbidden - admin access required
    if (error.response?.status === 403) {
      return Promise.reject(new Error('Admin access required. You do not have permission to perform this action.'));
    }
    
    // Extract error message from response or use default
    const responseData = error.response?.data;
    let message =
      (typeof responseData === 'string' ? responseData.split('\n')[0].trim() : null)
      || responseData?.error?.message
      || responseData?.message
      || error.message
      || 'An error occurred';
    
    // Sanitize error messages - remove database/table names
    message = sanitizeErrorMessage(message);
    
    return Promise.reject(new Error(message));
  }
);

// Helper function to sanitize error messages - remove database/table names
const sanitizeErrorMessage = (message) => {
  if (!message) return 'An error occurred';
  
  // Remove database names (e.g., "table_tennis_tournament")
  message = message.replace(/table_tennis_tournament/gi, 'database');
  
  // Remove DB table names in SQL errors only (keep plain English e.g. "42 matches")
  message = message.replace(/\b(players|teams|statistics|match_details)\b/gi, 'table');
  
  // Remove common MySQL error patterns with table names
  message = message.replace(/Table\s+['"]?[\w_]+['"]?\s+doesn't exist/gi, 'Required table does not exist');
  message = message.replace(/Unknown column\s+['"]?[\w_]+['"]?\s+in/gi, 'Unknown column in');
  message = message.replace(/Table\s+['"]?[\w_]+['"]?\s+already exists/gi, 'Table already exists');
  
  // Remove specific error codes that might expose structure
  message = message.replace(/ER_\w+/g, '');
  message = message.replace(/\s+/g, ' ').trim();
  
  return message;
};

export default api;

