import { create } from 'zustand';
import type { Menu } from '../types/menu.types';
import { menuApi } from '../api/menu.api';

interface MenuState {
  menus: Menu[];
  isLoading: boolean;
  error: string | null;
  fetchMenus: () => Promise<void>;
  clearMenus: () => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  menus: [],
  isLoading: false,
  error: null,

  fetchMenus: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await menuApi.getMenus();
      set({ menus: response.data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch menus', isLoading: false });
    }
  },

  clearMenus: () => {
    set({ menus: [], error: null });
  },
}));
