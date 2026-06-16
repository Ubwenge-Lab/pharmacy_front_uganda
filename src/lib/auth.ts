// frontend/src/lib/auth.ts - Auth Helpers
// UPDATED VERSION - Added BRANCH_MANAGER, PHARMACIST, CASHIER, NURSE roles

import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

import { User, DecodedToken } from '@/types';

export const setAuthTokens = (accessToken: string, refreshToken: string) => {
  Cookies.set('accessToken', accessToken, { expires: 1/48 }); // 30 min
  Cookies.set('refreshToken', refreshToken, { expires: 7 }); // 7 days

  const decoded = jwtDecode<DecodedToken>(accessToken);
  Cookies.set('userRole', decoded.role, { expires: 7, sameSite: 'lax' });
};

export const removeAuthTokens = () => {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
  Cookies.remove('userRole');
  Cookies.remove('user');
};

export const getAccessToken = () => Cookies.get('accessToken');
export const getRefreshToken = () => Cookies.get('refreshToken');

export const isAuthenticated = () => !!getAccessToken();

export const cacheUserData = (user: User): void => {
  Cookies.set('user', JSON.stringify(user), { expires: 7 });
};

export const getCachedUser = (): User | null => {
  const userData = Cookies.get('user');
  if (!userData) return null;
  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
};

export const clearUserCache = (): void => {
  Cookies.remove('user');
};

export const getUserFromToken = (): User | null => {
  const token = getAccessToken();
  if (!token) {
    if (typeof window !== 'undefined') {
      clearUserCache();
    }
    return null;
  }

  const cachedUser = getCachedUser();
  if (cachedUser) return cachedUser;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      isVerified: decoded.isVerified || true,
      pharmacyStatus: decoded.pharmacyStatus,
    };
  } catch {
    return null;
  }
};