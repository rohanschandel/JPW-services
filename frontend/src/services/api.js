import axios from 'axios';

const rawBaseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const baseURL = rawBaseURL.replace(/\/+$/, '');

const API = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('jpw_token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Cache map keys
const CACHE_KEYS = {
  hr: 'jpw_cache_hr',
  project: 'jpw_cache_projects',
  deadline: 'jpw_cache_deadlines',
  assignment: 'jpw_cache_deadlines',
  exam: 'jpw_cache_exams',
  todo: 'jpw_cache_todos',
  bookmark: 'jpw_cache_bookmarks',
};

const getCacheKey = (url) => {
  for (const [key, val] of Object.entries(CACHE_KEYS)) {
    if (url.toLowerCase().includes(key)) return val;
  }
  return null;
};

// Response interceptor with permanent offline fallback
API.interceptors.response.use(
  (response) => {
    const url = response.config?.url || '';
    const cacheKey = getCacheKey(url);
    if (cacheKey && Array.isArray(response.data)) {
      localStorage.setItem(cacheKey, JSON.stringify(response.data));
    }
    return response;
  },
  (error) => {
    const url = error.config?.url || '';
    const cacheKey = getCacheKey(url);
    if (cacheKey) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return Promise.resolve({ data: JSON.parse(cached) });
      }
    }
    return Promise.reject(error);
  }
);

export const getCachedData = (key, fallback = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    return fallback;
  }
};

export const saveCacheData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
};

export default API;