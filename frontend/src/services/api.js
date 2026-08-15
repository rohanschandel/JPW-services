import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Token Automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Safe Data Extraction
API.interceptors.response.use(
  (response) => {
    // Agar response.data array ya object hai toh direct return
    return response.data;
  },
  (error) => {
    console.error('API Call Error:', error?.response || error);
    // Unhandled crash rokne ke liye empty array fallback
    return Promise.resolve([]);
  }
);

export default API;