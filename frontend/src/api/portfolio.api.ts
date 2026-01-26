import apiClient from './client';
import type { Portfolio, ConnectUpbitRequest } from '../types';

export const portfolioApi = {
  connect: async (data: ConnectUpbitRequest): Promise<{ success: boolean; isValid: boolean }> => {
    const response = await apiClient.post<{ success: boolean; isValid: boolean }>(
      '/portfolio/connect',
      data,
    );
    return response.data;
  },

  disconnect: async (): Promise<void> => {
    await apiClient.delete('/portfolio/disconnect');
  },

  getPortfolio: async (): Promise<Portfolio> => {
    const response = await apiClient.get<Portfolio>('/portfolio');
    return response.data;
  },

  getStatus: async (): Promise<{ isConnected: boolean }> => {
    const response = await apiClient.get<{ isConnected: boolean }>('/portfolio/status');
    return response.data;
  },
};
