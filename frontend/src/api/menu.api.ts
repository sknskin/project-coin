import api from './client';
import type { Menu } from '../types/menu.types';

export const menuApi = {
  getMenus: () => api.get<Menu[]>('/menu'),
};
