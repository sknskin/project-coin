import api from './client';
import type { User } from '../types/auth.types';

export interface UpdateProfileDto {
  nickname?: string;
  email?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export const mypageApi = {
  getProfile: () => api.get<User>('/mypage/profile'),

  updateProfile: (data: UpdateProfileDto) =>
    api.patch<User>('/mypage/profile', data),

  changePassword: (data: ChangePasswordDto) =>
    api.post('/mypage/password', data),
};
