import axios from 'axios';

/**
 * API Service - Centralized API client
 * Handles all backend communication with consistent error handling
 */

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    
    if (error.response) {
      // Server responded with error
      throw new Error(error.response.data.error || 'Request failed');
    } else if (error.request) {
      // No response received
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Request setup error
      throw new Error(error.message || 'Request failed');
    }
  }
);

/**
 * Contract API methods
 */
export const contractAPI = {
  // Upload new contract
  async upload(file, title) {
    const formData = new FormData();
    formData.append('contract', file);
    if (title) {
      formData.append('title', title);
    }

    const response = await api.post('/contracts/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Trigger AI analysis
  async analyze(contractId) {
    const response = await api.post(`/contracts/${contractId}/analyze`);
    return response.data;
  },

  // Get all contracts
  async list(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.riskLevel) params.append('riskLevel', filters.riskLevel);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await api.get(`/contracts?${params.toString()}`);
    return response.data;
  },

  // Get single contract
  async get(contractId) {
    const response = await api.get(`/contracts/${contractId}`);
    return response.data;
  },

  // Get dashboard stats
  async getStats() {
    const response = await api.get('/contracts/stats/dashboard');
    return response.data;
  },

  // Delete contract
  async delete(contractId) {
    const response = await api.delete(`/contracts/${contractId}`);
    return response.data;
  },
};

export default api;