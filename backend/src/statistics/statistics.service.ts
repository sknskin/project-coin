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
      todayAnnouncements,
      todayComments,
      todayMessages,
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
      this.prisma.announcement.count({
        where: { createdAt: { gte: todayStart } },
      }),
      this.prisma.announcementComment.count({
        where: { createdAt: { gte: todayStart } },
      }),
      this.prisma.message.count({
        where: { createdAt: { gte: todayStart }, isDeleted: false },
      }),
    ]);

    return {
      activeVisitors,
      todayVisitors,
      todayLogins,
      todayRegistrations,
      todayPageViews: todayPageViewsResult._sum.pageViews || 0,
      totalUsers,
      todayAnnouncements,
      todayComments,
      todayMessages,
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

  async getHistoricalByPeriod(
    startDate: Date,
    endDate: Date,
    period: 'hourly' | 'daily' | 'monthly' | 'yearly',
  ) {
    if (period === 'hourly') {
      return this.getHourlyStats(startDate, endDate);
    }
    if (period === 'daily') {
      return this.getHistoricalStats(startDate, endDate);
    }
    return this.aggregateByPeriod(startDate, endDate, period, {
      visitor_count: 'visitorCount',
      login_count: 'loginCount',
      register_count: 'registerCount',
      page_view_count: 'pageViewCount',
      active_user_count: 'activeUserCount',
      new_announcement_count: 'newAnnouncementCount',
      announcement_comment_count: 'announcementCommentCount',
      announcement_like_count: 'announcementLikeCount',
      message_count: 'messageCount',
      active_conversation_count: 'activeConversationCount',
      notification_count: 'notificationCount',
      notification_read_count: 'notificationReadCount',
    });
  }

  /**
   * 시간별 통계 조회 (실시간 데이터 기반)
   */
  private async getHourlyStats(startDate: Date, endDate: Date) {
    // 시간별로 그룹화된 방문자 통계
    const visitorStats: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT
        to_char(started_at, 'YYYY-MM-DD HH24:00') as date,
        COUNT(*)::int as "visitorCount",
        COALESCE(SUM(page_views), 0)::int as "pageViewCount"
      FROM visitor_sessions
      WHERE started_at >= $1 AND started_at <= $2
      GROUP BY to_char(started_at, 'YYYY-MM-DD HH24:00')
      ORDER BY 1 ASC`,
      startDate,
      endDate,
    );

    // 시간별 로그인 통계
    const loginStats: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT
        to_char(login_at, 'YYYY-MM-DD HH24:00') as date,
        COUNT(*)::int as "loginCount"
      FROM login_histories
      WHERE login_at >= $1 AND login_at <= $2 AND is_success = true
      GROUP BY to_char(login_at, 'YYYY-MM-DD HH24:00')
      ORDER BY 1 ASC`,
      startDate,
      endDate,
    );

    // 시간별 가입 통계
    const registerStats: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT
        to_char(created_at, 'YYYY-MM-DD HH24:00') as date,
        COUNT(*)::int as "registerCount"
      FROM users
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY to_char(created_at, 'YYYY-MM-DD HH24:00')
      ORDER BY 1 ASC`,
      startDate,
      endDate,
    );

    // 결과 병합
    const hourMap = new Map<string, any>();

    // 시작~종료 사이의 모든 시간대 초기화
    const current = new Date(startDate);
    current.setMinutes(0, 0, 0);
    const maxIterations = 168; // 최대 7일 (168시간)
    let iterations = 0;
    while (current <= endDate && iterations < maxIterations) {
      const displayKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')} ${String(current.getHours()).padStart(2, '0')}:00`;
      hourMap.set(displayKey, {
        date: displayKey,
        visitorCount: 0,
        loginCount: 0,
        registerCount: 0,
        pageViewCount: 0,
        activeUserCount: 0,
        newAnnouncementCount: 0,
        announcementCommentCount: 0,
        announcementLikeCount: 0,
        messageCount: 0,
        activeConversationCount: 0,
        notificationCount: 0,
        notificationReadCount: 0,
      });
      current.setHours(current.getHours() + 1);
      iterations++;
    }

    // 방문자/페이지뷰 데이터 병합
    visitorStats.forEach((stat) => {
      if (hourMap.has(stat.date)) {
        const entry = hourMap.get(stat.date);
        entry.visitorCount = stat.visitorCount;
        entry.pageViewCount = stat.pageViewCount;
      }
    });

    // 로그인 데이터 병합
    loginStats.forEach((stat) => {
      if (hourMap.has(stat.date)) {
        hourMap.get(stat.date).loginCount = stat.loginCount;
      }
    });

    // 가입 데이터 병합
    registerStats.forEach((stat) => {
      if (hourMap.has(stat.date)) {
        hourMap.get(stat.date).registerCount = stat.registerCount;
      }
    });

    return Array.from(hourMap.values());
  }

  async getAnnouncementStats(
    startDate: Date,
    endDate: Date,
    period: 'hourly' | 'daily' | 'monthly' | 'yearly',
  ) {
    if (period === 'hourly') {
      return this.getHourlyAnnouncementStats(startDate, endDate);
    }
    if (period === 'daily') {
      const rows = await this.prisma.dailyStatistics.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' },
        select: {
          date: true,
          newAnnouncementCount: true,
          announcementCommentCount: true,
          announcementLikeCount: true,
        },
      });
      return rows.map((r) => ({
        date: r.date.toISOString().split('T')[0],
        announcements: r.newAnnouncementCount,
        comments: r.announcementCommentCount,
        likes: r.announcementLikeCount,
      }));
    }
    const raw = await this.aggregateByPeriod(startDate, endDate, period, {
      new_announcement_count: 'announcements',
      announcement_comment_count: 'comments',
      announcement_like_count: 'likes',
    });
    return raw;
  }

  private async getHourlyAnnouncementStats(startDate: Date, endDate: Date) {
    const [announcements, comments, likes] = await Promise.all([
      this.prisma.$queryRawUnsafe<any[]>(
        `SELECT to_char(created_at, 'YYYY-MM-DD HH24:00') as date, COUNT(*)::int as count
         FROM announcements WHERE created_at >= $1 AND created_at <= $2
         GROUP BY to_char(created_at, 'YYYY-MM-DD HH24:00') ORDER BY 1`,
        startDate, endDate,
      ),
      this.prisma.$queryRawUnsafe<any[]>(
        `SELECT to_char(created_at, 'YYYY-MM-DD HH24:00') as date, COUNT(*)::int as count
         FROM announcement_comments WHERE created_at >= $1 AND created_at <= $2
         GROUP BY to_char(created_at, 'YYYY-MM-DD HH24:00') ORDER BY 1`,
        startDate, endDate,
      ),
      this.prisma.$queryRawUnsafe<any[]>(
        `SELECT to_char(created_at, 'YYYY-MM-DD HH24:00') as date, COUNT(*)::int as count
         FROM announcement_likes WHERE created_at >= $1 AND created_at <= $2
         GROUP BY to_char(created_at, 'YYYY-MM-DD HH24:00') ORDER BY 1`,
        startDate, endDate,
      ),
    ]);

    const hourMap = this.initHourMap(startDate, endDate);
    announcements.forEach((r) => { if (hourMap.has(r.date)) hourMap.get(r.date).announcements = r.count; });
    comments.forEach((r) => { if (hourMap.has(r.date)) hourMap.get(r.date).comments = r.count; });
    likes.forEach((r) => { if (hourMap.has(r.date)) hourMap.get(r.date).likes = r.count; });

    return Array.from(hourMap.values()).map((v) => ({
      date: v.date,
      announcements: v.announcements || 0,
      comments: v.comments || 0,
      likes: v.likes || 0,
    }));
  }

  private initHourMap(startDate: Date, endDate: Date): Map<string, any> {
    const hourMap = new Map<string, any>();
    const current = new Date(startDate);
    current.setMinutes(0, 0, 0);
    const maxIterations = 168; // 최대 7일 (168시간)
    let iterations = 0;
    while (current <= endDate && iterations < maxIterations) {
      const displayKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')} ${String(current.getHours()).padStart(2, '0')}:00`;
      hourMap.set(displayKey, { date: displayKey });
      current.setHours(current.getHours() + 1);
      iterations++;
    }
    return hourMap;
  }

  async getAnnouncementTotals() {
    const [totalAnnouncements, totalComments, totalLikes, totalViews] =
      await Promise.all([
        this.prisma.announcement.count(),
        this.prisma.announcementComment.count(),
        this.prisma.announcementLike.count(),
        this.prisma.announcement.aggregate({ _sum: { viewCount: true } }),
      ]);

    return {
      totalAnnouncements,
      totalComments,
      totalLikes,
      totalViews: totalViews._sum.viewCount || 0,
    };
  }

  async getChatStats(
    startDate: Date,
    endDate: Date,
    period: 'hourly' | 'daily' | 'monthly' | 'yearly',
  ) {
    if (period === 'hourly') {
      return this.getHourlyChatStats(startDate, endDate);
    }
    if (period === 'daily') {
      const rows = await this.prisma.dailyStatistics.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' },
        select: {
          date: true,
          messageCount: true,
          activeConversationCount: true,
        },
      });
      return rows.map((r) => ({
        date: r.date.toISOString().split('T')[0],
        messages: r.messageCount,
        activeConversations: r.activeConversationCount,
      }));
    }
    const raw = await this.aggregateByPeriod(startDate, endDate, period, {
      message_count: 'messages',
      active_conversation_count: 'activeConversations',
    });
    return raw;
  }

  private async getHourlyChatStats(startDate: Date, endDate: Date) {
    const [messages, conversations] = await Promise.all([
      this.prisma.$queryRawUnsafe<any[]>(
        `SELECT to_char(created_at, 'YYYY-MM-DD HH24:00') as date, COUNT(*)::int as count
         FROM messages WHERE created_at >= $1 AND created_at <= $2 AND is_deleted = false
         GROUP BY to_char(created_at, 'YYYY-MM-DD HH24:00') ORDER BY 1`,
        startDate, endDate,
      ),
      this.prisma.$queryRawUnsafe<any[]>(
        `SELECT to_char(m.created_at, 'YYYY-MM-DD HH24:00') as date, COUNT(DISTINCT m.conversation_id)::int as count
         FROM messages m WHERE m.created_at >= $1 AND m.created_at <= $2
         GROUP BY to_char(m.created_at, 'YYYY-MM-DD HH24:00') ORDER BY 1`,
        startDate, endDate,
      ),
    ]);

    const hourMap = this.initHourMap(startDate, endDate);
    messages.forEach((r) => { if (hourMap.has(r.date)) hourMap.get(r.date).messages = r.count; });
    conversations.forEach((r) => { if (hourMap.has(r.date)) hourMap.get(r.date).activeConversations = r.count; });

    return Array.from(hourMap.values()).map((v) => ({
      date: v.date,
      messages: v.messages || 0,
      activeConversations: v.activeConversations || 0,
    }));
  }

  async getChatTotals() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [totalMessages, totalConversations, activeConversations] =
      await Promise.all([
        this.prisma.message.count({ where: { isDeleted: false } }),
        this.prisma.conversation.count(),
        this.prisma.conversation.count({
          where: {
            messages: {
              some: { createdAt: { gte: sevenDaysAgo } },
            },
          },
        }),
      ]);

    return { totalMessages, totalConversations, activeConversations };
  }

  async getUserDetailStats() {
    const [roleDistribution, approvalDistribution, totalUsers] =
      await Promise.all([
        this.prisma.user.groupBy({
          by: ['role'],
          _count: true,
        }),
        this.prisma.user.groupBy({
          by: ['approvalStatus'],
          _count: true,
        }),
        this.prisma.user.count(),
      ]);

    return {
      totalUsers,
      roleDistribution: roleDistribution.map((r) => ({
        role: r.role,
        count: r._count,
      })),
      approvalDistribution: approvalDistribution.map((r) => ({
        status: r.approvalStatus,
        count: r._count,
      })),
    };
  }

  async getNotificationStats(
    startDate: Date,
    endDate: Date,
    period: 'hourly' | 'daily' | 'monthly' | 'yearly',
  ) {
    if (period === 'hourly') {
      return this.getHourlyNotificationStats(startDate, endDate);
    }
    if (period === 'daily') {
      const rows = await this.prisma.dailyStatistics.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' },
        select: {
          date: true,
          notificationCount: true,
          notificationReadCount: true,
        },
      });
      return rows.map((r) => ({
        date: r.date.toISOString().split('T')[0],
        sent: r.notificationCount,
        read: r.notificationReadCount,
        readRate:
          r.notificationCount > 0
            ? Math.round(
                (r.notificationReadCount / r.notificationCount) * 100,
              )
            : 0,
      }));
    }
    const raw = await this.aggregateByPeriod(startDate, endDate, period, {
      notification_count: 'sent',
      notification_read_count: 'read',
    });
    return (raw as any[]).map((r) => ({
      ...r,
      readRate:
        Number(r.sent) > 0
          ? Math.round((Number(r.read) / Number(r.sent)) * 100)
          : 0,
    }));
  }

  private async getHourlyNotificationStats(startDate: Date, endDate: Date) {
    const [sent, read] = await Promise.all([
      this.prisma.$queryRawUnsafe<any[]>(
        `SELECT to_char(created_at, 'YYYY-MM-DD HH24:00') as date, COUNT(*)::int as count
         FROM notifications WHERE created_at >= $1 AND created_at <= $2
         GROUP BY to_char(created_at, 'YYYY-MM-DD HH24:00') ORDER BY 1`,
        startDate, endDate,
      ),
      this.prisma.$queryRawUnsafe<any[]>(
        `SELECT to_char(created_at, 'YYYY-MM-DD HH24:00') as date, COUNT(*)::int as count
         FROM notifications WHERE created_at >= $1 AND created_at <= $2 AND is_read = true
         GROUP BY to_char(created_at, 'YYYY-MM-DD HH24:00') ORDER BY 1`,
        startDate, endDate,
      ),
    ]);

    const hourMap = this.initHourMap(startDate, endDate);
    sent.forEach((r) => { if (hourMap.has(r.date)) hourMap.get(r.date).sent = r.count; });
    read.forEach((r) => { if (hourMap.has(r.date)) hourMap.get(r.date).read = r.count; });

    return Array.from(hourMap.values()).map((v) => {
      const sentCount = v.sent || 0;
      const readCount = v.read || 0;
      return {
        date: v.date,
        sent: sentCount,
        read: readCount,
        readRate: sentCount > 0 ? Math.round((readCount / sentCount) * 100) : 0,
      };
    });
  }

  private async aggregateByPeriod(
    startDate: Date,
    endDate: Date,
    period: 'monthly' | 'yearly',
    columnMap: Record<string, string>,
  ) {
    const dateFormat = period === 'monthly' ? 'YYYY-MM' : 'YYYY';
    const columns = Object.keys(columnMap);
    const sumClauses = columns
      .map((c) => `COALESCE(SUM(${c}), 0)::int as "${columnMap[c]}"`)
      .join(', ');

    const results: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT to_char(date, '${dateFormat}') as date, ${sumClauses}
       FROM daily_statistics
       WHERE date >= $1 AND date <= $2
       GROUP BY to_char(date, '${dateFormat}')
       ORDER BY 1 ASC`,
      startDate,
      endDate,
    );

    return results;
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

    const [
      visitorCount,
      loginCount,
      registerCount,
      pageViewCount,
      activeUserCount,
      newAnnouncementCount,
      announcementCommentCount,
      announcementLikeCount,
      messageCount,
      activeConversationGroups,
      notificationCount,
      notificationReadCount,
    ] = await Promise.all([
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
      this.prisma.announcement.count({
        where: { createdAt: { gte: yesterday, lte: dayEnd } },
      }),
      this.prisma.announcementComment.count({
        where: { createdAt: { gte: yesterday, lte: dayEnd } },
      }),
      this.prisma.announcementLike.count({
        where: { createdAt: { gte: yesterday, lte: dayEnd } },
      }),
      this.prisma.message.count({
        where: {
          createdAt: { gte: yesterday, lte: dayEnd },
          isDeleted: false,
        },
      }),
      this.prisma.message.groupBy({
        by: ['conversationId'],
        where: { createdAt: { gte: yesterday, lte: dayEnd } },
      }),
      this.prisma.notification.count({
        where: { createdAt: { gte: yesterday, lte: dayEnd } },
      }),
      this.prisma.notification.count({
        where: {
          createdAt: { gte: yesterday, lte: dayEnd },
          isRead: true,
        },
      }),
    ]);

    const data = {
      visitorCount,
      loginCount,
      registerCount,
      pageViewCount: pageViewCount._sum.pageViews || 0,
      activeUserCount,
      newAnnouncementCount,
      announcementCommentCount,
      announcementLikeCount,
      messageCount,
      activeConversationCount: activeConversationGroups.length,
      notificationCount,
      notificationReadCount,
    };

    await this.prisma.dailyStatistics.upsert({
      where: { date: yesterday },
      update: data,
      create: { date: yesterday, ...data },
    });

    this.logger.log(
      `Aggregated daily statistics for ${yesterday.toISOString().split('T')[0]}`,
    );
  }
}
