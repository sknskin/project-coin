import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import type { LoginRequest, RegisterRequest, RegisterResponse } from '../types';

export function useAuth() {
  const queryClient = useQueryClient();
  const { setAuth, logout: logoutStore, isAuthenticated, user } = useAuthStore();
  const { closeAuthModal } = useUIStore();

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      setAuth(response.user, response.accessToken);
      closeAuthModal();
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    // 회원가입 성공해도 로그인하지 않음 (승인 대기)
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      logoutStore();
      queryClient.clear();
    },
    onError: () => {
      logoutStore();
      queryClient.clear();
    },
  });

  const { isLoading: isCheckingAuth } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.getMe,
    enabled: isAuthenticated,
    retry: false,
    staleTime: Infinity,
  });

  return {
    user,
    isAuthenticated,
    isCheckingAuth,
    login: loginMutation.mutate,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    registerSuccess: registerMutation.isSuccess,
    registerData: registerMutation.data as RegisterResponse | undefined,
    resetRegister: registerMutation.reset,
  };
}
