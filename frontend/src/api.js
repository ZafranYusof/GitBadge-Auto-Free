import axios from 'axios';

// If VITE_API_BASE is set (e.g. Vercel deploy), use it. Otherwise relative paths (bundled Render deploy)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '',
  withCredentials: true,
});

export default api;
