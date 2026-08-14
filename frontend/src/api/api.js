/**
 * A fetch wrapper for making API calls to the backend.
 * Automatically includes credentials (cookies) with every request.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cipra-gms.onrender.com/api';
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const api = {
  async get(endpoint) {
    return await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
    });
  },

  async post(endpoint, body) {
    return await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });
  },

  async put(endpoint, body) {
    return await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });
  },

  async delete(endpoint) {
    return await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
    });
  },

  async upload(endpoint, formData) {
    return await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
  }
};

export default api;