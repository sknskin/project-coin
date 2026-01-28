import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { UserFilterDto } from './dto/user-filter.dto';
import { ApproveUserDto, UpdateUserStatusDto } from './dto/approve-user.dto';
import { Prisma, UserRole, UserStatus, ApprovalStatus, NotificationType } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async getUsers(filter: UserFilterDto) {
    const where: Prisma.UserWhereInput = {};

    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.approvalStatus) {
      where.approvalStatus = filter.approvalStatus;
    }
    if (filter.role) {
      where.role = filter.role;
    }
    if (filter.search) {
      where.OR = [
        { email: { contains: filter.search, mode: 'insensitive' } },
        { nickname: { contains: filter.search, mode: 'insensitive' } },
        { name: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        nickname: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        approvalStatus: true,
        isApproved: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        name: true,
        phone: true,
        address: true,
        role: true,
        status: true,
        approvalStatus: true,
        isApproved: true,
        approvedAt: true,
        approvedBy: true,
        rejectedAt: true,
        rejectedBy: true,
        rejectReason: true,
        lastLoginAt: true,
        deactivatedAt: true,
        deactivatedBy: true,
        createdAt: true,
        updatedAt: true,
        loginHistories: {
          orderBy: { loginAt: 'desc' },
          take: 10,
          select: {
            id: true,
            ipAddress: true,
            userAgent: true,
            loginAt: true,
            isSuccess: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async approveUser(adminId: string, userId: string, dto: ApproveUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isApproved: true,
        approvalStatus: ApprovalStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: adminId,
        role: dto.role || UserRole.USER,
      },
    });

    await this.notificationService.create(userId, {
      type: NotificationType.SYSTEM,
      title: '가입 승인 완료',
      message: '회원가입이 승인되었습니다. 이제 로그인할 수 있습니다.',
    });

    return user;
  }

  async rejectUser(adminId: string, userId: string, reason?: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        approvalStatus: ApprovalStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedBy: adminId,
        rejectReason: reason,
      },
    });

    await this.notificationService.create(userId, {
      type: NotificationType.SYSTEM,
      title: '가입 승인 거절',
      message: reason || '회원가입이 거절되었습니다.',
    });

    return user;
  }

  async updateUserStatus(
    adminId: string,
    userId: string,
    dto: UpdateUserStatusDto,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status: dto.status,
        ...(dto.status === UserStatus.INACTIVE
          ? {
              deactivatedAt: new Date(),
              deactivatedBy: adminId,
            }
          : {
              deactivatedAt: null,
              deactivatedBy: null,
            }),
      },
    });
  }

  async deleteUser(userId: string) {
    return this.prisma.user.delete({ where: { id: userId } });
  }

  async getStatsSummary() {
    const [totalUsers, pendingUsers, activeUsers, todayRegistrations] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({
          where: { approvalStatus: ApprovalStatus.PENDING },
        }),
        this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
        this.prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
      ]);

    return { totalUsers, pendingUsers, activeUsers, todayRegistrations };
  }
}
