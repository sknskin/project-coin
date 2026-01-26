import { Link } from 'react-router-dom';
import { formatPrice, formatPercent } from '../../utils/format';
import type { Holding } from '../../types';

interface HoldingsListProps {
  holdings: Holding[];
}

export default function HoldingsList({ holdings }: HoldingsListProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">보유 자산</h2>
      </div>
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              코인
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              보유수량
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              매수평균가
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              현재가
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              평가금액
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              손익
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {holdings.map((holding) => {
            const isProfit = holding.profitLoss >= 0;
            const profitColor = isProfit ? 'text-rise' : 'text-fall';

            return (
              <tr key={holding.currency} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    to={`/coin/KRW-${holding.currency}`}
                    className="font-medium text-gray-900 hover:text-primary-600"
                  >
                    {holding.currency}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {holding.balance.toFixed(8)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatPrice(holding.avgBuyPrice)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatPrice(holding.currentPrice)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
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
  );
}
