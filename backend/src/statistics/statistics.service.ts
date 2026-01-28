import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatisticsService {
  private logger = new Logger('StatisticsService');

  constructor(private prisma: PrismaService) {}

  async trackVisitor(
    sessionId: string,
    ipAddress?: string,
    userAgent?: string,
    referrer?: string,
  ) {
    const existing = await this.prisma.visitorSession.findUnique({
      where: { sessionId },
    });

    if (existing) {
      return this.prisma.visitorSession.update({
        where: { sessionId },
        data: {
          lastActiveAt: new Date(),
          pageViews: { increment: 1 },
        },
      });
    }

    return this.prisma.visitorSession.create({
      data: { sessionId, ipAddress, userAgent, referrer },
    });
  }

  async getRealTimeStats() {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const [
      activeVisitors,
      todayVisitors,
      todayLogins,
      todayRegistrations,
      todayPageViewsResult,
      totalUsers,
    ] = await Promise.all([
      this.prisma.visitorSession.count({
        where: { lastActiveAt: { gte: fiveMinutesAgo } },
      }),
      this.prisma.visitorSession.count({
        where: { startedAt: { gte: todayStart } },
      }),
      this.prisma.loginHistory.count({
        where: { loginAt: { gte: todayStart }, isSuccess: true },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: todayStart } },
      }),
      this.prisma.visitorSession.aggregate({
        where: { startedAt: { gte: todayStart } },
        _sum: { pageViews: true },
      }),
      this.prisma.user.count(),
    ]);

    return {
      activeVisitors,
      todayVisitors,
      todayLogins,
      todayRegistrations,
      todayPageViews: todayPageViewsResult._sum.pageViews || 0,
      totalUsers,
    };
  }

  async getHistoricalStats(startDate: Date, endDate: Date) {
    return this.prisma.dailyStatistics.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });
  }

  async getLoginStats(startDate: Date, endDate: Date) {
    const loginHistories = await this.prisma.loginHistory.groupBy({
      by: ['loginAt'],
      where: {
        loginAt: { gte: startDate, lte: endDate },
        isSuccess: true,
      },
      _count: true,
    });

    // Group by date
    const dailyLogins = new Map<string, number>();
    loginHistories.forEach((record) => {
      const dateKey = record.loginAt.toISOString().split('T')[0];
      dailyLogins.set(dateKey, (dailyLogins.get(dateKey) || 0) + record._count);
    });

    return Array.from(dailyLogins.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  }

  async getRegistrationStats(startDate: Date, endDate: Date) {
    const users = await this.prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: true,
    });

    const dailyRegistrations = new Map<string, number>();
    users.forEach((record) => {
      const dateKey = record.createdAt.toISOString().split('T')[0];
      dailyRegistrations.set(
        dateKey,
        (dailyRegistrations.get(dateKey) || 0) + record._count,
      );
    });

    return Array.from(dailyRegistrations.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async aggregateDailyStats() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const dayEnd = new Date(yesterday);
    dayEnd.setHours(23, 59, 59, 999);

    const [visitorCount, loginCount, registerCount, pageViewCount, activeUserCount] =
      await Promise.all([
        this.prisma.visitorSession.count({
          where: { startedAt: { gte: yesterday, lte: dayEnd } },
        }),
        this.prisma.loginHistory.count({
          where: { loginAt: { gte: yesterday, lte: dayEnd }, isSuccess: true },
        }),
        this.prisma.user.count({
          where: { createdAt: { gte: yesterday, lte: dayEnd } },
        }),
        this.prisma.visitorSession.aggregate({
          where: { startedAt: { gte: yesterday, lte: dayEnd } },
          _sum: { pageViews: true },
        }),
        this.prisma.user.count({
          where: { lastLoginAt: { gte: yesterday, lte: dayEnd } },
        }),
      ]);

    await this.prisma.dailyStatistics.upsert({
      where: { date: yesterday },
      update: {
        visitorCount,
        loginCount,
        registerCount,
        pageViewCount: pageViewCount._sum.pageViews || 0,
        activeUserCount,
      },
      create: {
        date: yesterday,
        visitorCount,
        loginCount,
        registerCount,
        pageViewCount: pageViewCount._sum.pageViews || 0,
        activeUserCount,
      },
    });

    this.logger.log(`Aggregated daily statistics for ${yesterday.toISOString().split('T')[0]}`);
  }
}
