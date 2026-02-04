import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMarketStore } from '../../store/marketStore';
import { formatPrice, formatPercent, formatVolume, getChangeColor } from '../../utils/format';
import type { Market } from '../../types';

interface MarketTableProps {
  markets: Market[];
  page?: number;
  pageSize?: number;
}

type SortKey = 'name' | 'price' | 'change' | 'volume';
type SortDirection = 'asc' | 'desc' | 'none';

export default function MarketTable({ markets, page, pageSize }: MarketTableProps) {
  const { t, i18n } = useTranslation();
  const tickers = useMarketStore((state) => state.tickers);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('none');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      // 같은 컬럼 클릭: none -> asc -> desc -> none
      if (sortDirection === 'none') {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortDirection('none');
        setSortKey(null);
      }
    } else {
      // 다른 컬럼 클릭: asc부터 시작
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key || sortDirection === 'none') {
      return (
        <span className="ml-1 text-gray-400">
          <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </span>
      );
    }
    if (sortDirection === 'asc') {
      return (
        <span className="ml-1 text-primary-500">
          <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </span>
      );
    }
    return (
      <span className="ml-1 text-primary-500">
        <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    );
  };

  const sortedMarkets = useMemo(() => {
    const marketsWithTickers = markets.map((market) => ({
      market,
      ticker: tickers.get(market.market),
    }));

    // 정렬 없음 - 기본 거래대금 순
    if (!sortKey || sortDirection === 'none') {
      return [...marketsWithTickers].sort((a, b) => {
        const volumeA = a.ticker?.accTradePrice24h || 0;
        const volumeB = b.ticker?.accTradePrice24h || 0;
        return volumeB - volumeA;
      });
    }

    return [...marketsWithTickers].sort((a, b) => {
      let comparison = 0;

      switch (sortKey) {
        case 'name': {
          const nameA = i18n.language === 'ko' ? a.market.korean_name : a.market.english_name;
          const nameB = i18n.language === 'ko' ? b.market.korean_name : b.market.english_name;
          comparison = nameA.localeCompare(nameB, i18n.language);
          break;
        }
        case 'price': {
          const priceA = a.ticker?.tradePrice || 0;
          const priceB = b.ticker?.tradePrice || 0;
          comparison = priceA - priceB;
          break;
        }
        case 'change': {
          const changeA = a.ticker?.signedChangeRate || 0;
          const changeB = b.ticker?.signedChangeRate || 0;
          comparison = changeA - changeB;
          break;
        }
        case 'volume': {
          const volumeA = a.ticker?.accTradePrice24h || 0;
          const volumeB = b.ticker?.accTradePrice24h || 0;
          comparison = volumeA - volumeB;
          break;
        }
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [markets, tickers, sortKey, sortDirection, i18n.language]);

  const displayedMarkets = useMemo(() => {
    if (page && pageSize) {
      const start = (page - 1) * pageSize;
      return sortedMarkets.slice(start, start + pageSize);
    }
    return sortedMarkets;
  }, [sortedMarkets, page, pageSize]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <tr>
            <th
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors select-none"
              onClick={() => handleSort('name')}
            >
              {t('market.coin')}
              {getSortIcon('name')}
            </th>
            <th
              className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors select-none"
              onClick={() => handleSort('price')}
            >
              {t('market.currentPrice')}
              {getSortIcon('price')}
            </th>
            <th
              className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors select-none"
              onClick={() => handleSort('change')}
            >
              {t('market.change')}
              {getSortIcon('change')}
            </th>
            <th
              className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors select-none"
              onClick={() => handleSort('volume')}
            >
              {t('market.volume')}
              {getSortIcon('volume')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {displayedMarkets.map(({ market, ticker }) => {
            const change = ticker?.change || 'EVEN';
            const changeColor = getChangeColor(change);

            return (
              <tr
                key={market.market}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    to={`/coin/${market.market}`}
                    className="flex flex-col"
                  >
                    <span className="font-medium text-gray-900 dark:text-white">
                      {i18n.language === 'ko' ? market.korean_name : market.english_name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {market.market.replace('KRW-', '')}
                    </span>
                  </Link>
                </td>
                <td className={`px-4 py-3 text-right tabular-nums ${changeColor}`}>
                  <Link
                    to={`/coin/${market.market}`}
                    className="flex flex-col"
                  >
                  {ticker ? formatPrice(ticker.tradePrice) : '-'}
                  </Link>
                </td>
                <td className={`px-4 py-3 text-right tabular-nums ${changeColor}`}>
                  <Link
                    to={`/coin/${market.market}`}
                    className="flex flex-col"
                  >
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
                  </Link>
                </td>
                <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                  <Link
                    to={`/coin/${market.market}`}
                    className="flex flex-col"
                  >
                  {ticker ? formatVolume(ticker.accTradePrice24h) : '-'}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
