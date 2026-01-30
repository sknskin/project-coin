import { useTranslation } from 'react-i18next';
import { formatPrice, formatPercent } from '../../utils/format';
import type { Portfolio } from '../../types';

interface PortfolioSummaryProps {
  portfolio: Portfolio;
}

export default function PortfolioSummary({ portfolio }: PortfolioSummaryProps) {
  const { t } = useTranslation();
  const isProfit = portfolio.profitLoss >= 0;
  const profitColor = isProfit ? 'text-rise' : 'text-fall';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('portfolio.summary', '포트폴리오 요약')}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('portfolio.totalBuyPrice', '총 매수금액')}</p>
          <p className="text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
            {formatPrice(portfolio.totalBuyPrice)}원
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('portfolio.totalEvalPrice', '총 평가금액')}</p>
          <p className="text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
            {formatPrice(portfolio.totalEvalPrice)}원
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('portfolio.totalProfitLoss', '총 손익')}</p>
          <p className={`text-xl font-semibold tabular-nums ${profitColor}`}>
            {isProfit ? '+' : ''}{formatPrice(portfolio.profitLoss)}원
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('portfolio.profitRate', '수익률')}</p>
          <p className={`text-xl font-semibold tabular-nums ${profitColor}`}>
            {formatPercent(portfolio.profitLossRate / 100)}
          </p>
        </div>
      </div>
    </div>
  );
}
