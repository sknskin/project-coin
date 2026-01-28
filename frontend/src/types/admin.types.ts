export type UserRole = 'USER' | 'ADMIN' | 'SYSTEM';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AdminUser {
  id: string;
  email: string;
  nickname: string | null;
  name: string | null;
  phone: string | null;
  address?: string | null;
  role: UserRole;
  status: UserStatus;
  approvalStatus: ApprovalStatus;
  isApproved: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  rejectedAt?: string | null;
  rejectedBy?: string | null;
  rejectReason?: string | null;
  deactivatedAt?: string | null;
  deactivatedBy?: string | null;
  loginHistories?: LoginHistory[];
}

export interface LoginHistory {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  loginAt: string;
  isSuccess: boolean;
}

export interface UserFilter {
  status?: UserStatus;
  approvalStatus?: ApprovalStatus;
  role?: UserRole;
  search?: string;
}

export interface AdminStatsSummary {
  totalUsers: number;
  pendingUsers: number;
  activeUsers: number;
  todayRegistrations: number;
}
