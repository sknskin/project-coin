import api from './client';
import type {
  AdminUser,
  UserFilter,
  AdminStatsSummary,
  UserRole,
  UserStatus,
} from '../types/admin.types';

export const adminApi = {
  getUsers: (filter?: UserFilter) =>
    api.get<AdminUser[]>('/admin/users', { params: filter }),

  getUserDetail: (id: string) => api.get<AdminUser>(`/admin/users/${id}`),

  approveUser: (id: string, role?: UserRole) =>
    api.post<AdminUser>(`/admin/users/${id}/approve`, { role }),

  rejectUser: (id: string, reason?: string) =>
    api.post<AdminUser>(`/admin/users/${id}/reject`, { reason }),

  updateUserStatus: (id: string, status: UserStatus) =>
    api.patch<AdminUser>(`/admin/users/${id}/status`, { status }),

  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

  getStatsSummary: () => api.get<AdminStatsSummary>('/admin/stats/summary'),
};
