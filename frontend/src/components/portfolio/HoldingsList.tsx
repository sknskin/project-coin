import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatPrice, formatPercent } from '../../utils/format';
import HoldingDetailModal from './HoldingDetailModal';
import type { Holding } from '../../types';

interface HoldingsListProps {
  holdings: Holding[];
}

export default function HoldingsList({ holdings }: HoldingsListProps) {
  const { t } = useTranslation();
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('portfolio.holdings')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('portfolio.clickForDetail')}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {t('portfolio.coin')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {t('portfolio.quantity')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {t('portfolio.avgBuyPrice')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {t('portfolio.currentPrice')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {t('portfolio.evalAmount')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {t('portfolio.profitLoss')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {holdings.map((holding) => {
                const isProfit = holding.profitLoss >= 0;
                const profitColor = isProfit ? 'text-rise' : 'text-fall';

                return (
                  <tr
                    key={holding.currency}
                    onClick={() => setSelectedHolding(holding)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400">
                        {holding.currency}
                      </span>
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

      {/* Holding Detail Modal */}
      {selectedHolding && (
        <HoldingDetailModal
          holding={selectedHolding}
          onClose={() => setSelectedHolding(null)}
        />
      )}
    </>
  );
}
