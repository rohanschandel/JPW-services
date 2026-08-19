import axios from 'axios';

const rawBaseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const baseURL = rawBaseURL.replace(/\/+$/, '');

const API = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto attach JWT token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('jpw_token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unified Dual-Layer Persistence (Server + Local Mirror)
API.interceptors.response.use(
  (response) => {
    const url = response.config?.url || '';
    const method = response.config?.method?.toLowerCase();

    // Cache sync on successful GET
    if (method === 'get' && Array.isArray(response.data) && response.data.length > 0) {
      if (url.includes('hr')) localStorage.setItem('jpw_perm_hr', JSON.stringify(response.data));
      if (url.includes('project')) localStorage.setItem('jpw_perm_projects', JSON.stringify(response.data));
      if (url.includes('assignment') || url.includes('deadline') || url.includes('exam')) {
        localStorage.setItem('jpw_perm_deadlines', JSON.stringify(response.data));
      }
    }

    // Cache sync on successful POST
    if (method === 'post' && response.data) {
      const item = response.data;
      if (url.includes('hr')) {
        const list = JSON.parse(localStorage.getItem('jpw_perm_hr') || '[]');
        const updated = [item, ...list.filter(i => i.id !== item.id)];
        localStorage.setItem('jpw_perm_hr', JSON.stringify(updated));
      }
      if (url.includes('project')) {
        const list = JSON.parse(localStorage.getItem('jpw_perm_projects') || '[]');
        const updated = [item, ...list.filter(i => i.id !== item.id)];
        localStorage.setItem('jpw_perm_projects', JSON.stringify(updated));
      }
      if (url.includes('assignment') || url.includes('deadline') || url.includes('exam')) {
        const list = JSON.parse(localStorage.getItem('jpw_perm_deadlines') || '[]');
        const updated = [item, ...list.filter(i => i.id !== item.id)];
        localStorage.setItem('jpw_perm_deadlines', JSON.stringify(updated));
      }
    }

    return response;
  },
  (error) => {
    const config = error.config || {};
    const url = config.url || '';
    const method = config.method?.toLowerCase();

    // Instant offline/restart fallback if server resets
    if (method === 'get') {
      if (url.includes('hr')) {
        const cached = JSON.parse(localStorage.getItem('jpw_perm_hr') || '[]');
        return Promise.resolve({ data: cached });
      }
      if (url.includes('project')) {
        const cached = JSON.parse(localStorage.getItem('jpw_perm_projects') || '[]');
        return Promise.resolve({ data: cached });
      }
      if (url.includes('assignment') || url.includes('deadline') || url.includes('exam')) {
        const cached = JSON.parse(localStorage.getItem('jpw_perm_deadlines') || '[]');
        return Promise.resolve({ data: cached });
      }
    }

    if (method === 'post') {
      let body = {};
      try {
        body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      } catch (e) {
        body = {};
      }
      body.id = body.id || Date.now();

      if (url.includes('hr')) {
        const list = JSON.parse(localStorage.getItem('jpw_perm_hr') || '[]');
        list.unshift(body);
        localStorage.setItem('jpw_perm_hr', JSON.stringify(list));
        return Promise.resolve({ data: body });
      }
      if (url.includes('project')) {
        const list = JSON.parse(localStorage.getItem('jpw_perm_projects') || '[]');
        list.unshift(body);
        localStorage.setItem('jpw_perm_projects', JSON.stringify(list));
        return Promise.resolve({ data: body });
      }
      if (url.includes('assignment') || url.includes('deadline') || url.includes('exam')) {
        const list = JSON.parse(localStorage.getItem('jpw_perm_deadlines') || '[]');
        list.unshift(body);
        localStorage.setItem('jpw_perm_deadlines', JSON.stringify(list));
        return Promise.resolve({ data: body });
      }
    }

    if (method === 'delete') {
      const id = url.split('/').filter(Boolean).pop();
      if (url.includes('hr')) {
        const list = JSON.parse(localStorage.getItem('jpw_perm_hr') || '[]');
        localStorage.setItem('jpw_perm_hr', JSON.stringify(list.filter(i => String(i.id) !== String(id))));
      }
      if (url.includes('project')) {
        const list = JSON.parse(localStorage.getItem('jpw_perm_projects') || '[]');
        localStorage.setItem('jpw_perm_projects', JSON.stringify(list.filter(i => String(i.id) !== String(id))));
      }
      if (url.includes('assignment') || url.includes('deadline') || url.includes('exam')) {
        const list = JSON.parse(localStorage.getItem('jpw_perm_deadlines') || '[]');
        localStorage.setItem('jpw_perm_deadlines', JSON.stringify(list.filter(i => String(i.id) !== String(id))));
      }
      return Promise.resolve({ data: { status: 'deleted', id } });
    }

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('jpw_token');
      localStorage.removeItem('token');
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