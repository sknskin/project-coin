import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nickname: true,
        createdAt: true,
      },
    });
  }

  async getWatchlist(userId: string) {
    return this.prisma.watchlist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addToWatchlist(userId: string, marketCode: string) {
    return this.prisma.watchlist.create({
      data: {
        userId,
        marketCode,
      },
    });
  }

  async removeFromWatchlist(userId: string, marketCode: string) {
    return this.prisma.watchlist.delete({
      where: {
        userId_marketCode: {
          userId,
          marketCode,
        },
      },
    });
  }
}
