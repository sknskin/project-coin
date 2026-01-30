import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatPrice, formatPercent } from '../../utils/format';
import type { Holding } from '../../types';

interface HoldingsListProps {
  holdings: Holding[];
}

export default function HoldingsList({ holdings }: HoldingsListProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('portfolio.holdings', '보유 자산')}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {t('portfolio.coin', '코인')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {t('portfolio.quantity', '보유수량')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {t('portfolio.avgBuyPrice', '매수평균가')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {t('portfolio.currentPrice', '현재가')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {t('portfolio.evalAmount', '평가금액')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {t('portfolio.profitLoss', '손익')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {holdings.map((holding) => {
              const isProfit = holding.profitLoss >= 0;
              const profitColor = isProfit ? 'text-rise' : 'text-fall';

              return (
                <tr key={holding.currency} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      to={`/coin/KRW-${holding.currency}`}
                      className="font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      {holding.currency}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-white">
                    {holding.balance.toFixed(8)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-white">
                    {formatPrice(holding.avgBuyPrice)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-white">
                    {formatPrice(holding.currentPrice)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-white">
                    {formatPrice(holding.evalAmount)}원
                  </td>
                  <td className={`px-4 py-3 text-right tabular-nums ${profitColor}`}>
                    <div className="flex flex-col items-end">
                      <span>
                        {isProfit ? '+' : ''}{formatPrice(holding.profitLoss)}원
                      </span>
                      <span className="text-xs">
                        {formatPercent(holding.profitLossRate / 100)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
