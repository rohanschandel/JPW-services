import axios from 'axios';

const rawBaseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const baseURL = rawBaseURL.replace(/\/+$/, '');

const API = axios.create({
  baseURL: baseURL,
});

// Auto-attach JWT Token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('jpw_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle unauthorized expired tokens
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('jpw_token');
      localStorage.removeItem('jpw_user');
      if (window.location.pathname !== '/auth' && window.location.pathname !== '/') {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);

export default API;