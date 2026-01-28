export interface RealTimeStats {
  activeVisitors: number;
  todayVisitors: number;
  todayLogins: number;
  todayRegistrations: number;
  todayPageViews: number;
  totalUsers: number;
}

export interface DailyStatistics {
  id: string;
  date: string;
  visitorCount: number;
  loginCount: number;
  registerCount: number;
  pageViewCount: number;
  activeUserCount: number;
}

export interface DateRangeStats {
  date: string;
  count: number;
}
