export type UserRole = 'USER' | 'ADMIN' | 'SYSTEM';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  nickname: string | null;
  role: UserRole;
  status: UserStatus;
  approvalStatus: ApprovalStatus;
  lastLoginAt?: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nickname?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}
