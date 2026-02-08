import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portfolioApi } from '../api/portfolio.api';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import type { ConnectUpbitRequest } from '../types';

export function usePortfolio() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['portfolio'],
    queryFn: portfolioApi.getPortfolio,
    enabled: isAuthenticated,
    staleTime: 5 * 1000, // 5초 후 stale
    refetchInterval: 10 * 1000, // 10초마다 갱신
    refetchOnWindowFocus: true, // 창 포커스 시 갱신
  });
}

export function usePortfolioStatus() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['portfolio', 'status'],
    queryFn: portfolioApi.getStatus,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

export function useConnectUpbit() {
  const queryClient = useQueryClient();
  const { closeUpbitConnectModal } = useUIStore();

  return useMutation({
    mutationFn: (data: ConnectUpbitRequest) => portfolioApi.connect(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      closeUpbitConnectModal();
    },
  });
}

export function useReconnectUpbit() {
  const queryClient = useQueryClient();
  const { closeUpbitConnectModal } = useUIStore();

  return useMutation({
    mutationFn: (data: ConnectUpbitRequest) => portfolioApi.reconnect(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      closeUpbitConnectModal();
    },
  });
}

export function useDisconnectUpbit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => portfolioApi.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
}
