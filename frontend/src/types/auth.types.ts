export type UserRole = 'USER' | 'ADMIN' | 'SYSTEM';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  username: string;
  nickname: string | null;
  name: string;
  phone?: string;
  address?: string;
  role: UserRole;
  status: UserStatus;
  approvalStatus: ApprovalStatus;
  isApproved: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  nickname?: string;
  name: string;
  phone: string;
  address: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

// 역할별 세션 시간 (초)
export const SESSION_DURATION_BY_ROLE: Record<UserRole, number> = {
  USER: 30 * 60,      // 30분
  ADMIN: 60 * 60,     // 60분
  SYSTEM: 240 * 60,   // 240분
};
