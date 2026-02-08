import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { marketApi } from '../../api/market.api';
import { formatPrice, formatPercent } from '../../utils/format';
import { useChartColors } from '../statistics/useChartColors';
import type { Portfolio, Holding } from '../../types/portfolio.types';

interface AnalysisTabProps {
  portfolio: Portfolio;
}

// Individual coin analysis card component
function CoinAnalysisCard({ holding, chartColors }: { holding: Holding; chartColors: ReturnType<typeof useChartColors> }) {
  const { t } = useTranslation();
  const market = `KRW-${holding.currency}`;
  const isProfit = holding.profitLoss >= 0;
  const profitColor = isProfit ? 'text-rise' : 'text-fall';
  const profitBgColor = isProfit ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20';

  // Fetch 7-day candle data for mini chart
  const { data: candleData } = useQuery({
    queryKey: ['candles-mini', market],
    queryFn: () => marketApi.getCandles(market, { type: 'days', count: 7 }),
    staleTime: 60 * 1000,
  });

  const chartData = candleData
    ? [...candleData].reverse().map((candle) => ({
        date: format(new Date(candle.candle_date_time_kst), 'MM/dd'),
        price: candle.trade_price,
      }))
    : [];

  // Calculate price change percentage from 7 days ago
  const priceChange7d = chartData.length >= 2
    ? ((chartData[chartData.length - 1].price - chartData[0].price) / chartData[0].price) * 100
    : 0;

  return (
    <div className={`rounded-lg shadow p-4 ${profitBgColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{holding.currency}</h3>
        <span className={`text-lg font-semibold ${profitColor}`}>
          {formatPercent(holding.profitLossRate / 100)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Stats */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('portfolio.buyAmount')}</span>
            <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-white">
              {formatPrice(holding.buyAmount)}원
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('portfolio.evalAmount')}</span>
            <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-white">
              {formatPrice(holding.evalAmount)}원
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('portfolio.profitLoss')}</span>
            <span className={`text-sm font-medium tabular-nums ${profitColor}`}>
              {isProfit ? '+' : ''}{formatPrice(holding.profitLoss)}원
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('portfolio.avgBuyPrice')}</span>
            <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-white">
              {formatPrice(holding.avgBuyPrice)}원
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('portfolio.currentPrice')}</span>
            <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-white">
              {formatPrice(holding.currentPrice)}원
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('portfolio.quantity')}</span>
            <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-white">
              {holding.balance.toFixed(4)}
            </span>
          </div>
        </div>

        {/* Right: Mini Chart */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('portfolio.priceChart7d')}</span>
            <span className={`text-xs font-medium ${priceChange7d >= 0 ? 'text-rise' : 'text-fall'}`}>
              {priceChange7d >= 0 ? '+' : ''}{priceChange7d.toFixed(2)}%
            </span>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`gradient-${holding.currency}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isProfit ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isProfit ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis hide domain={['dataMin', 'dataMax']} />
                <Tooltip
                  formatter={(value) => [`${formatPrice(value as number)}원`, t('portfolio.price')]}
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    border: `1px solid ${chartColors.tooltipBorder}`,
                    borderRadius: '8px',
                    color: chartColors.tooltipText,
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: chartColors.tooltipText }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={isProfit ? '#22c55e' : '#ef4444'}
                  fill={`url(#gradient-${holding.currency})`}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[100px] flex items-center justify-center text-xs text-gray-400">
              Loading...
            </div>
          )}
        </div>
      </div>

      {/* Progress bar showing profit/loss ratio */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>{t('portfolio.investmentRatio')}</span>
          <span>{((holding.evalAmount / holding.buyAmount) * 100).toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isProfit ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(Math.max((holding.evalAmount / holding.buyAmount) * 100, 0), 200)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function AnalysisTab({ portfolio }: AnalysisTabProps) {
  const { t } = useTranslation();
  const chartColors = useChartColors();
  const [sortBy, setSortBy] = useState<'profitLoss' | 'profitLossRate' | 'evalAmount'>('profitLossRate');

  // Sort holdings based on selected criteria
  const sortedHoldings = [...portfolio.holdings].sort((a, b) => {
    switch (sortBy) {
      case 'profitLoss':
        return b.profitLoss - a.profitLoss;
      case 'evalAmount':
        return b.evalAmount - a.evalAmount;
      default:
        return b.profitLossRate - a.profitLossRate;
    }
  });

  // Calculate statistics
  const profitableCoins = portfolio.holdings.filter((h) => h.profitLoss >= 0);
  const losingCoins = portfolio.holdings.filter((h) => h.profitLoss < 0);
  const totalProfit = profitableCoins.reduce((sum, h) => sum + h.profitLoss, 0);
  const totalLoss = losingCoins.reduce((sum, h) => sum + h.profitLoss, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('portfolio.profitableCoins')}</p>
          <p className="text-2xl font-semibold text-rise">{profitableCoins.length}</p>
          <p className="text-xs text-rise mt-1">+{formatPrice(totalProfit)}원</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('portfolio.losingCoins')}</p>
          <p className="text-2xl font-semibold text-fall">{losingCoins.length}</p>
          <p className="text-xs text-fall mt-1">{formatPrice(totalLoss)}원</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('portfolio.totalProfitLoss')}</p>
          <p className={`text-2xl font-semibold ${portfolio.profitLoss >= 0 ? 'text-rise' : 'text-fall'}`}>
            {portfolio.profitLoss >= 0 ? '+' : ''}{formatPrice(portfolio.profitLoss)}원
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('portfolio.profitRate')}</p>
          <p className={`text-2xl font-semibold ${portfolio.profitLossRate >= 0 ? 'text-rise' : 'text-fall'}`}>
            {formatPercent(portfolio.profitLossRate / 100)}
          </p>
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">{t('portfolio.sortBy')}:</span>
        <div className="flex gap-1">
          {[
            { key: 'profitLossRate' as const, label: t('portfolio.profitRate') },
            { key: 'profitLoss' as const, label: t('portfolio.profitLoss') },
            { key: 'evalAmount' as const, label: t('portfolio.evalAmount') },
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setSortBy(option.key)}
              className={`px-3 py-1 text-xs font-medium rounded ${
                sortBy === option.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Individual Coin Analysis Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sortedHoldings.map((holding) => (
          <CoinAnalysisCard
            key={holding.currency}
            holding={holding}
            chartColors={chartColors}
          />
        ))}
      </div>
    </div>
  );
}
