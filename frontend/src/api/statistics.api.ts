import api from './client';
import type {
  RealTimeStats,
  DailyStatistics,
  DateRangeStats,
} from '../types/statistics.types';

export const statisticsApi = {
  getRealTime: () => api.get<RealTimeStats>('/statistics/realtime'),

  getHistorical: (startDate: Date, endDate: Date) =>
    api.get<DailyStatistics[]>('/statistics/historical', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    }),

  getLoginStats: (startDate: Date, endDate: Date) =>
    api.get<DateRangeStats[]>('/statistics/logins', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    }),

  getRegistrationStats: (startDate: Date, endDate: Date) =>
    api.get<DateRangeStats[]>('/statistics/registrations', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    }),

  trackVisitor: (sessionId: string) =>
    api.post('/statistics/track', { sessionId }),
};
