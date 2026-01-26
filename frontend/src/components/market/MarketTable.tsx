import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMarketStore } from '../../store/marketStore';
import { formatPrice, formatPercent, formatVolume, getChangeColor } from '../../utils/format';
import type { Market } from '../../types';

interface MarketTableProps {
  markets: Market[];
}

export default function MarketTable({ markets }: MarketTableProps) {
  const tickers = useMarketStore((state) => state.tickers);

  const sortedMarkets = useMemo(() => {
    return [...markets].sort((a, b) => {
      const tickerA = tickers.get(a.market);
      const tickerB = tickers.get(b.market);
      const volumeA = tickerA?.accTradePrice24h || 0;
      const volumeB = tickerB?.accTradePrice24h || 0;
      return volumeB - volumeA;
    });
  }, [markets, tickers]);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              코인
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              현재가
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              전일대비
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              거래대금
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sortedMarkets.map((market) => {
            const ticker = tickers.get(market.market);
            const change = ticker?.change || 'EVEN';
            const changeColor = getChangeColor(change);

            return (
              <tr
                key={market.market}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    to={`/coin/${market.market}`}
                    className="flex flex-col"
                  >
                    <span className="font-medium text-gray-900">
                      {market.korean_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {market.market.replace('KRW-', '')}
                    </span>
                  </Link>
                </td>
                <td className={`px-4 py-3 text-right tabular-nums ${changeColor}`}>
                  {ticker ? formatPrice(ticker.tradePrice) : '-'}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums ${changeColor}`}>
                  {ticker ? (
                    <div className="flex flex-col items-end">
                      <span>{formatPercent(ticker.signedChangeRate)}</span>
                      <span className="text-xs">
                        {ticker.signedChangePrice > 0 ? '+' : ''}
                        {formatPrice(ticker.signedChangePrice)}
                      </span>
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-4 py-3 text-right text-gray-600 tabular-nums">
                  {ticker ? formatVolume(ticker.accTradePrice24h) : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
