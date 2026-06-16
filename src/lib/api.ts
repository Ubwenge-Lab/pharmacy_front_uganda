// frontend/src/lib/api.ts 

import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Bypass ngrok warning page for API calls
  },
  withCredentials: true, // Important for CORS with credentials
  timeout: 15000, // 15 second timeout to prevent endless hanging
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = Cookies.get('refreshToken');

      if (!refreshToken) {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        Cookies.remove('user');
        Cookies.remove('userRole');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        Cookies.set('accessToken', accessToken, { expires: 1/48 }); // 30 minutes
        if (newRefreshToken) {
          Cookies.set('refreshToken', newRefreshToken, { expires: 7 }); // 7 days
        }

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        toast.error('Session expired. Redirecting to login...');
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        Cookies.remove('user');
        Cookies.remove('userRole');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API Methods
export const authApi = {
  /**
   * Login - Patient/Pharmacy/Super Admin
   */
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  /**
   * Register Patient
   */
  registerPatient: async (data: any) => {
    const response = await api.post('/auth/register/patient', data);
    return response.data;
  },

  /**
   * Register Pharmacy
   */
  registerPharmacy: async (data: any) => {
    const response = await api.post('/auth/register/pharmacy', data);
    return response.data;
  },

  /**
   * Verify email with 5-digit code
   */
  verifyEmail: async (data: { email: string; code: string }) => {
    const response = await api.post('/auth/verify-email', data);
    return response.data;
  },

  /**
   * Resend verification code
   */
  resendVerificationCode: async (data: { email: string }) => {
    const response = await api.post('/auth/resend-verification', data);
    return response.data;
  },

  /**
   * Request password reset (forgot password)
   */
  forgotPassword: async (data: { email: string }) => {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  },

  /**
   * Reset password with code
   */
  resetPassword: async (data: { 
    email: string; 
    resetCode: string; 
    newPassword: string;
    confirmPassword: string;
  }) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  /**
   * Change password (authenticated)
   */
  changePassword: async (data: { 
    currentPassword: string; 
    newPassword: string;
    confirmPassword: string;
  }) => {
    const response = await api.put('/auth/change-password', data);
    return response.data;
  },

  /**
   * Refresh access token
   */
  refreshTokens: async () => {
    const refreshToken = Cookies.get('refreshToken');
    const response = await api.post('/auth/refresh', {}, {
      headers: { Authorization: `Bearer ${refreshToken}` }
    });
    return response.data;
  },

  /**
   * Logout
   */
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

/**
 * Normalises API responses that sometimes wrap arrays in { data: [...] }
 * and sometimes return the array directly.
 */
export function unwrapData<T = unknown>(payload: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object' && Array.isArray((payload as any).data)) {
    return (payload as any).data as T[];
  }
  return fallback;
}

export default api;
