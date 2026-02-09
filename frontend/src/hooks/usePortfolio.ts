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
    retry: false, // 실패 시 자동 재시도 안함
    refetchInterval: (query) => {
      // 에러 상태면 자동 갱신 안함 (다시시도 버튼으로만 재시도)
      if (query.state.error) return false;
      return 10 * 1000; // 정상일 때만 10초마다 갱신
    },
    refetchOnWindowFocus: (query) => {
      // 에러 상태면 창 포커스 시에도 갱신 안함
      return !query.state.error;
    },
  });
}

export function usePortfolioStatus() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['portfolio', 'status'],
    queryFn: portfolioApi.getStatus,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false, // 실패 시 자동 재시도 안함
    refetchOnWindowFocus: (query) => !query.state.error,
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
