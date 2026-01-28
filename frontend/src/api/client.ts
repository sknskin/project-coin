import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import i18n from '../i18n';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// 서버 에러 메시지를 i18n 키로 매핑
const errorMessageMap: Record<string, string> = {
  '회원가입 승인 대기 중입니다. 관리자 승인 후 로그인이 가능합니다.': 'auth.loginPendingApproval',
  '회원가입이 거절되었습니다. 관리자에게 문의해주세요.': 'auth.loginRejected',
  '비활성화된 계정입니다. 관리자에게 문의해주세요.': 'auth.loginInactive',
  '이메일/아이디 또는 비밀번호가 올바르지 않습니다.': 'auth.loginInvalidCredentials',
  '이미 사용 중인 이메일입니다.': 'auth.emailTaken',
  '이미 사용 중인 아이디입니다.': 'auth.usernameTaken',
  '이미 사용 중인 닉네임입니다.': 'auth.nicknameTaken',
};

function getLocalizedErrorMessage(serverMessage: string): string {
  const i18nKey = errorMessageMap[serverMessage];
  if (i18nKey) {
    return i18n.t(i18nKey);
  }
  // 서버 메시지를 그대로 반환
  return serverMessage;
}

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle token refresh and localize errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string | string[] }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 로그인/회원가입 요청은 토큰 갱신 시도하지 않음
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const { accessToken } = response.data;
        useAuthStore.getState().updateAccessToken(accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    // 에러 메시지 로컬라이즈
    if (error.response?.data?.message) {
      const serverMessage = Array.isArray(error.response.data.message)
        ? error.response.data.message[0]
        : error.response.data.message;

      const localizedMessage = getLocalizedErrorMessage(serverMessage);

      // 새로운 에러 객체 생성
      const localizedError = new Error(localizedMessage) as Error & {
        response?: typeof error.response
      };
      localizedError.response = error.response;
      return Promise.reject(localizedError);
    }

    // 응답이 있지만 message가 없는 경우 일반적인 에러 메시지
    if (error.response) {
      const fallbackMessage = i18n.t('auth.error');
      const fallbackError = new Error(fallbackMessage) as Error & {
        response?: typeof error.response
      };
      fallbackError.response = error.response;
      return Promise.reject(fallbackError);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
