import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSessionStore } from '../store/sessionStore';
import { useAuth } from './useAuth';
import { authApi } from '../api/auth.api';

const WARNING_THRESHOLDS = [10 * 60, 5 * 60, 1 * 60]; // 10min, 5min, 1min (seconds)

export function useSessionManager() {
  const { isAuthenticated, accessToken } = useAuthStore();
  const {
    sessionExpiresAt,
    remainingSeconds,
    isSessionWarningOpen,
    lastWarningThreshold,
    startSession,
    endSession,
    updateRemainingTime,
    openSessionWarning,
    closeSessionWarning,
    setLastWarningThreshold,
  } = useSessionStore();
  const { logout } = useAuth();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initializedRef = useRef(false);

  // Start session on login
  useEffect(() => {
    if (isAuthenticated && accessToken && !initializedRef.current) {
      startSession(accessToken);
      initializedRef.current = true;
    } else if (!isAuthenticated) {
      initializedRef.current = false;
    }
  }, [isAuthenticated, accessToken, startSession]);

  // End session on logout
  useEffect(() => {
    if (!isAuthenticated) {
      endSession();
    }
  }, [isAuthenticated, endSession]);

  // Timer setup
  useEffect(() => {
    if (!isAuthenticated || !sessionExpiresAt) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Update remaining time every second
    timerRef.current = setInterval(() => {
      updateRemainingTime();
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isAuthenticated, sessionExpiresAt, updateRemainingTime]);

  // Show warning modal and handle session expiry
  useEffect(() => {
    if (!isAuthenticated || !sessionExpiresAt) return;

    // Session expired
    if (remainingSeconds === 0 && sessionExpiresAt && Date.now() >= sessionExpiresAt) {
      logout();
      endSession();
      return;
    }

    // Check warning thresholds
    for (const threshold of WARNING_THRESHOLDS) {
      if (
        remainingSeconds <= threshold &&
        remainingSeconds > threshold - 1 &&
        lastWarningThreshold !== threshold
      ) {
        openSessionWarning();
        setLastWarningThreshold(threshold);
        break;
      }
    }
  }, [remainingSeconds, isAuthenticated, sessionExpiresAt, lastWarningThreshold, logout, endSession, openSessionWarning, setLastWarningThreshold]);

  const handleExtend = useCallback(async () => {
    try {
      const response = await authApi.refresh();
      if (response.accessToken) {
        useAuthStore.getState().updateAccessToken(response.accessToken);
        startSession(response.accessToken);
      }
      closeSessionWarning();
    } catch (error) {
      console.error('Failed to extend session:', error);
      logout();
    }
  }, [startSession, closeSessionWarning, logout]);

  const handleDismiss = useCallback(() => {
    closeSessionWarning();
  }, [closeSessionWarning]);

  return {
    remainingSeconds,
    isSessionWarningOpen,
    handleExtend,
    handleDismiss,
  };
}
