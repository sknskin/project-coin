import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { marketApi } from '../../api/market.api';
import { formatPrice, formatPercent } from '../../utils/format';
import { useChartColors } from '../statistics/useChartColors';
import { useScrollLock } from '../../hooks/useScrollLock';
import type { Holding } from '../../types/portfolio.types';

interface HoldingDetailModalProps {
  holding: Holding;
  onClose: () => void;
}

type TimeFrame = 'minutes60' | 'days' | 'weeks';

export default function HoldingDetailModal({ holding, onClose }: HoldingDetailModalProps) {
  const { t } = useTranslation();
  const chartColors = useChartColors();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('days');
  const market = `KRW-${holding.currency}`;

  const isProfit = holding.profitLoss >= 0;
  const profitColor = isProfit ? 'text-rise' : 'text-fall';

  const { data: candleData, isLoading } = useQuery({
    queryKey: ['candles', market, timeFrame],
    queryFn: () => {
      switch (timeFrame) {
        case 'minutes60':
          return marketApi.getCandles(market, { type: 'minutes', unit: 60, count: 48 });
        case 'weeks':
          return marketApi.getCandles(market, { type: 'weeks', count: 12 });
        default:
          return marketApi.getCandles(market, { type: 'days', count: 30 });
      }
    },
  });

  const chartData = candleData
    ? [...candleData]
        .reverse()
        .map((candle) => ({
          date: format(
            new Date(candle.candle_date_time_kst),
            timeFrame === 'minutes60' ? 'MM/dd HH:mm' : 'MM/dd',
          ),
          price: candle.trade_price,
          high: candle.high_price,
          low: candle.low_price,
        }))
    : [];

  // 배경 스크롤 방지
  useScrollLock(true);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {holding.currency}
            </h2>
            <Link
              to={`/coin/${market}`}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              {t('portfolio.viewChart')}
            </Link>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Investment Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('portfolio.quantity')}
              </p>
              <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                {holding.balance.toFixed(8)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('portfolio.avgBuyPrice')}
              </p>
              <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                {formatPrice(holding.avgBuyPrice)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('portfolio.currentPrice')}
              </p>
              <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                {formatPrice(holding.currentPrice)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('portfolio.priceChange')}
              </p>
              <p className={`text-lg font-semibold tabular-nums ${profitColor}`}>
                {formatPercent((holding.currentPrice - holding.avgBuyPrice) / holding.avgBuyPrice)}
              </p>
            </div>
          </div>

          {/* Investment Details */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
              {t('portfolio.investmentDetail')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t('portfolio.buyAmount')}
                </span>
                <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-white">
                  {formatPrice(holding.buyAmount)}원
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t('portfolio.evalAmount')}
                </span>
                <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-white">
                  {formatPrice(holding.evalAmount)}원
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t('portfolio.profitLoss')}
                </span>
                <span className={`text-sm font-medium tabular-nums ${profitColor}`}>
                  {isProfit ? '+' : ''}{formatPrice(holding.profitLoss)}원
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t('portfolio.profitRate')}
                </span>
                <span className={`text-sm font-medium tabular-nums ${profitColor}`}>
                  {formatPercent(holding.profitLossRate / 100)}
                </span>
              </div>
            </div>
          </div>

          {/* Price Chart */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('portfolio.priceChart')}
              </h3>
              <div className="flex gap-1">
                {[
                  { key: 'minutes60' as TimeFrame, label: '1H' },
                  { key: 'days' as TimeFrame, label: '1D' },
                  { key: 'weeks' as TimeFrame, label: '1W' },
                ].map((tf) => (
                  <button
                    key={tf.key}
                    onClick={() => setTimeFrame(tf.key)}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      timeFrame === tf.key
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={isProfit ? '#22c55e' : '#ef4444'}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={isProfit ? '#22c55e' : '#ef4444'}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis
                    dataKey="date"
                    stroke={chartColors.axis}
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke={chartColors.axis}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => formatPrice(value)}
                    domain={['dataMin', 'dataMax']}
                  />
                  <Tooltip
                    formatter={(value) => [`${formatPrice(value as number)}원`, t('portfolio.price')]}
                    contentStyle={{
                      backgroundColor: chartColors.tooltipBg,
                      border: `1px solid ${chartColors.tooltipBorder}`,
                      borderRadius: '8px',
                      color: chartColors.tooltipText,
                    }}
                    labelStyle={{ color: chartColors.tooltipText }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={isProfit ? '#22c55e' : '#ef4444'}
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">{t('coinDetail.noChartData')}</p>
              </div>
            )}
          </div>

          {/* Average Buy Price Line Indicator */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>{t('portfolio.buyPriceNote')}:</strong>{' '}
              {t('portfolio.buyPriceNoteDesc', { price: formatPrice(holding.avgBuyPrice) })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
