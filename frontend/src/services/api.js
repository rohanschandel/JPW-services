import axios from 'axios';

const rawBaseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const baseURL = rawBaseURL.replace(/\/+$/, '');

const API = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-attach JWT Token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('jpw_token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle unauthorized expired tokens & robust LocalStorage Fallback for Serverless Persistence
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('jpw_token');
      localStorage.removeItem('token');
      localStorage.removeItem('jpw_user');
      if (window.location.pathname !== '/auth' && window.location.pathname !== '/') {
        window.location.href = '/auth';
      }
      return Promise.reject(error);
    }

    const config = error.config || {};
    const url = config.url || '';

    // LocalStorage Fallback Layer to ensure data never vanishes on refresh/restart
    if (config.method === 'get') {
      if (url.includes('hr')) {
        const data = JSON.parse(localStorage.getItem('jpw_hr') || '[]');
        return Promise.resolve({ data });
      }
      if (url.includes('projects')) {
        const data = JSON.parse(localStorage.getItem('jpw_projects') || '[]');
        return Promise.resolve({ data });
      }
      if (url.includes('exams') || url.includes('assignments') || url.includes('deadline')) {
        const data = JSON.parse(localStorage.getItem('jpw_exams') || '[]');
        return Promise.resolve({ data });
      }
      if (url.includes('todos') || url.includes('task')) {
        const data = JSON.parse(localStorage.getItem('jpw_todos') || '[]');
        return Promise.resolve({ data });
      }
      if (url.includes('bookmarks') || url.includes('portal')) {
        const data = JSON.parse(localStorage.getItem('jpw_bookmarks') || '[]');
        return Promise.resolve({ data });
      }
    }

    if (config.method === 'post') {
      let body = {};
      try {
        body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      } catch (e) {
        body = {};
      }
      body.id = Date.now();

      if (url.includes('hr')) {
        const list = JSON.parse(localStorage.getItem('jpw_hr') || '[]');
        list.unshift(body);
        localStorage.setItem('jpw_hr', JSON.stringify(list));
        return Promise.resolve({ data: body });
      }
      if (url.includes('projects')) {
        const list = JSON.parse(localStorage.getItem('jpw_projects') || '[]');
        list.unshift(body);
        localStorage.setItem('jpw_projects', JSON.stringify(list));
        return Promise.resolve({ data: body });
      }
      if (url.includes('exams') || url.includes('assignments') || url.includes('deadline')) {
        const list = JSON.parse(localStorage.getItem('jpw_exams') || '[]');
        list.unshift(body);
        localStorage.setItem('jpw_exams', JSON.stringify(list));
        return Promise.resolve({ data: body });
      }
      if (url.includes('todos') || url.includes('task')) {
        const list = JSON.parse(localStorage.getItem('jpw_todos') || '[]');
        list.unshift(body);
        localStorage.setItem('jpw_todos', JSON.stringify(list));
        return Promise.resolve({ data: body });
      }
      if (url.includes('bookmarks') || url.includes('portal')) {
        const list = JSON.parse(localStorage.getItem('jpw_bookmarks') || '[]');
        list.unshift(body);
        localStorage.setItem('jpw_bookmarks', JSON.stringify(list));
        return Promise.resolve({ data: body });
      }
    }

    return Promise.reject(error);
  }
);

export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);

export default API;