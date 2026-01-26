import { formatPrice, formatPercent } from '../../utils/format';
import type { Portfolio } from '../../types';

interface PortfolioSummaryProps {
  portfolio: Portfolio;
}

export default function PortfolioSummary({ portfolio }: PortfolioSummaryProps) {
  const isProfit = portfolio.profitLoss >= 0;
  const profitColor = isProfit ? 'text-rise' : 'text-fall';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">포트폴리오 요약</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-gray-500">총 매수금액</p>
          <p className="text-xl font-semibold tabular-nums">
            {formatPrice(portfolio.totalBuyPrice)}원
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">총 평가금액</p>
          <p className="text-xl font-semibold tabular-nums">
            {formatPrice(portfolio.totalEvalPrice)}원
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">총 손익</p>
          <p className={`text-xl font-semibold tabular-nums ${profitColor}`}>
            {isProfit ? '+' : ''}{formatPrice(portfolio.profitLoss)}원
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">수익률</p>
          <p className={`text-xl font-semibold tabular-nums ${profitColor}`}>
            {formatPercent(portfolio.profitLossRate / 100)}
          </p>
        </div>
      </div>
    </div>
  );
}
