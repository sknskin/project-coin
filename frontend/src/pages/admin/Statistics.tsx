import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { statisticsApi } from '../../api/statistics.api';
import { io, Socket } from 'socket.io-client';
import type { RealTimeStats, DailyStatistics } from '../../types/statistics.types';
import '../../styles/admin/Statistics.css';

export default function Statistics() {
  const { t } = useTranslation();
  const [realTimeStats, setRealTimeStats] = useState<RealTimeStats | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  });

  // Fetch real-time stats
  const { data: initialRealTimeData } = useQuery({
    queryKey: ['realtime-stats'],
    queryFn: () => statisticsApi.getRealTime(),
  });

  // Fetch historical stats
  const { data: historicalData, isLoading } = useQuery({
    queryKey: ['historical-stats', dateRange],
    queryFn: () =>
      statisticsApi.getHistorical(dateRange.startDate, dateRange.endDate),
  });

  // WebSocket for real-time updates
  useEffect(() => {
    const socket: Socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3000', {
      path: '/socket.io',
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      socket.emit('joinStatistics');
    });

    socket.on('statisticsUpdate', (data: RealTimeStats) => {
      setRealTimeStats(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (initialRealTimeData?.data) {
      setRealTimeStats(initialRealTimeData.data);
    }
  }, [initialRealTimeData]);

  const chartData = historicalData?.data.map((stat: DailyStatistics) => ({
    date: format(new Date(stat.date), 'MM/dd'),
    visitors: stat.visitorCount,
    logins: stat.loginCount,
    registrations: stat.registerCount,
    pageViews: stat.pageViewCount,
  })) || [];

  return (
    <div className="statistics-container">
      <h1 className="page-title">{t('admin.statistics')}</h1>

      {/* Real-time Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon visitors"></div>
          <div className="stat-content">
            <span className="stat-value">
              {realTimeStats?.activeVisitors || 0}
            </span>
            <span className="stat-label">{t('stats.activeVisitors')}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon logins"></div>
          <div className="stat-content">
            <span className="stat-value">
              {realTimeStats?.todayLogins || 0}
            </span>
            <span className="stat-label">{t('stats.todayLogins')}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon registrations"></div>
          <div className="stat-content">
            <span className="stat-value">
              {realTimeStats?.todayRegistrations || 0}
            </span>
            <span className="stat-label">{t('stats.todayRegistrations')}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pageviews"></div>
          <div className="stat-content">
            <span className="stat-value">
              {realTimeStats?.todayPageViews || 0}
            </span>
            <span className="stat-label">{t('stats.todayPageViews')}</span>
          </div>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="date-range-selector">
        <label>{t('stats.dateRange')}</label>
        <div className="date-inputs">
          <input
            type="date"
            value={format(dateRange.startDate, 'yyyy-MM-dd')}
            onChange={(e) =>
              setDateRange((prev) => ({
                ...prev,
                startDate: new Date(e.target.value),
              }))
            }
          />
          <span>~</span>
          <input
            type="date"
            value={format(dateRange.endDate, 'yyyy-MM-dd')}
            onChange={(e) =>
              setDateRange((prev) => ({
                ...prev,
                endDate: new Date(e.target.value),
              }))
            }
          />
        </div>
      </div>

      {isLoading ? (
        <div className="loading">{t('common.loading')}</div>
      ) : (
        <div className="charts-container">
          {/* Visitors & Page Views Chart */}
          <div className="chart-card">
            <h3>{t('stats.visitorsChart')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #333',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="visitors"
                  stroke="#3498db"
                  name={t('stats.visitors')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="pageViews"
                  stroke="#9b59b6"
                  name={t('stats.pageViews')}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Logins & Registrations Chart */}
          <div className="chart-card">
            <h3>{t('stats.usersChart')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #333',
                  }}
                />
                <Legend />
                <Bar
                  dataKey="logins"
                  fill="#2ecc71"
                  name={t('stats.logins')}
                />
                <Bar
                  dataKey="registrations"
                  fill="#e74c3c"
                  name={t('stats.registrations')}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
