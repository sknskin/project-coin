import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import { formatPrice, formatPercent } from '../../utils/format';
import { useChartColors } from '../statistics/useChartColors';
import type { Portfolio } from '../../types/portfolio.types';

interface OverviewTabProps {
  portfolio: Portfolio;
}

const COLORS = [
  '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#34495e', '#16a085', '#c0392b',
  '#8e44ad', '#27ae60', '#d35400', '#2980b9', '#f1c40f',
];

export default function OverviewTab({ portfolio }: OverviewTabProps) {
  const { t } = useTranslation();
  const chartColors = useChartColors();
  const isProfit = portfolio.profitLoss >= 0;
  const profitColor = isProfit ? 'text-rise' : 'text-fall';

  // Prepare pie chart data (memoized)
  const pieData = useMemo(() =>
    portfolio.holdings.map((holding, index) => ({
      name: holding.currency,
      value: holding.evalAmount,
      color: COLORS[index % COLORS.length],
    })),
    [portfolio.holdings]
  );

  const renderCustomLabel = useCallback((props: {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    percent?: number;
    name?: string;
  }) => {
    const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0, name = '' } = props;
    if (percent < 0.05) return null; // Don't show labels for small slices
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {name}
      </text>
    );
  }, []);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('portfolio.summary')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('portfolio.totalBuyPrice')}
            </p>
            <p className="text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
              {formatPrice(portfolio.totalBuyPrice)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('portfolio.totalEvalPrice')}
            </p>
            <p className="text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
              {formatPrice(portfolio.totalEvalPrice)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('portfolio.totalProfitLoss')}
            </p>
            <p className={`text-xl font-semibold tabular-nums ${profitColor}`}>
              {isProfit ? '+' : ''}{formatPrice(portfolio.profitLoss)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('portfolio.profitRate')}
            </p>
            <p className={`text-xl font-semibold tabular-nums ${profitColor}`}>
              {formatPercent(portfolio.profitLossRate / 100)}
            </p>
          </div>
        </div>
      </div>

      {/* Pie Chart - Portfolio Distribution */}
      {portfolio.holdings.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('portfolio.distribution')}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={120}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${formatPrice(value as number)}원`}
                    contentStyle={{
                      backgroundColor: chartColors.tooltipBg,
                      border: `1px solid ${chartColors.tooltipBorder}`,
                      borderRadius: '8px',
                      color: chartColors.tooltipText,
                    }}
                    labelStyle={{ color: chartColors.tooltipText }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                {t('portfolio.distributionDetail')}
              </h3>
              {portfolio.holdings
                .sort((a, b) => b.evalAmount - a.evalAmount)
                .map((holding, index) => {
                  const percentage = (holding.evalAmount / portfolio.totalEvalPrice) * 100;
                  return (
                    <div
                      key={holding.currency}
                      className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {holding.currency}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm tabular-nums text-gray-900 dark:text-white">
                          {formatPrice(holding.evalAmount)}원
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
