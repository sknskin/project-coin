import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto, ChangePasswordDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MyPageService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        nickname: true,
        name: true,
        phone: true,
        address: true,
        ssnFirst: true,
        ssnGender: true,
        role: true,
        status: true,
        isApproved: true,
        approvalStatus: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    // 주민등록번호 마스킹 처리 (앞자리-뒷자리첫번째******)
    if (user) {
      return {
        ...user,
        ssnMasked: user.ssnFirst && user.ssnGender
          ? `${user.ssnFirst}-${user.ssnGender}******`
          : null,
      };
    }
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        nickname: dto.nickname,
        name: dto.name,
        phone: dto.phone,
        address: dto.address,
      },
      select: {
        id: true,
        email: true,
        username: true,
        nickname: true,
        name: true,
        phone: true,
        address: true,
        role: true,
        status: true,
        approvalStatus: true,
        isApproved: true,
        updatedAt: true,
      },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Password changed successfully' };
  }
}
