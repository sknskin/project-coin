import { create } from 'zustand';

interface UIState {
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  isUpbitConnectModalOpen: boolean;

  openAuthModal: (mode: 'login' | 'register') => void;
  closeAuthModal: () => void;
  openUpbitConnectModal: () => void;
  closeUpbitConnectModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isAuthModalOpen: false,
  authModalMode: 'login',
  isUpbitConnectModalOpen: false,

  openAuthModal: (mode) =>
    set({ isAuthModalOpen: true, authModalMode: mode }),

  closeAuthModal: () => set({ isAuthModalOpen: false }),

  openUpbitConnectModal: () => set({ isUpbitConnectModalOpen: true }),

  closeUpbitConnectModal: () => set({ isUpbitConnectModalOpen: false }),
}));
