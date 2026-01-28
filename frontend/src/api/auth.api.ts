import apiClient from './client';
import type { AuthResponse, LoginRequest, RegisterRequest, RegisterResponse, User } from '../types';

export const authApi = {
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  refresh: async (): Promise<{ accessToken: string }> => {
    const response = await apiClient.post<{ accessToken: string }>('/auth/refresh');
    return response.data;
  },

  checkEmail: async (email: string): Promise<{ available: boolean }> => {
    const response = await apiClient.get<{ available: boolean }>('/auth/check/email', {
      params: { email },
    });
    return response.data;
  },

  checkUsername: async (username: string): Promise<{ available: boolean }> => {
    const response = await apiClient.get<{ available: boolean }>('/auth/check/username', {
      params: { username },
    });
    return response.data;
  },

  checkNickname: async (nickname: string): Promise<{ available: boolean }> => {
    const response = await apiClient.get<{ available: boolean }>('/auth/check/nickname', {
      params: { nickname },
    });
    return response.data;
  },
};
