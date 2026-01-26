import { useQuery } from '@tanstack/react-query';
import { marketApi } from '../api/market.api';
import { useMarketStore } from '../store/marketStore';
import type { TimeframeType } from '../utils/constants';

export function useMarkets() {
  const setMarkets = useMarketStore((state) => state.setMarkets);

  return useQuery({
    queryKey: ['markets'],
    queryFn: async () => {
      const markets = await marketApi.getMarkets();
      setMarkets(markets);
      return markets;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTicker(marketCode: string) {
  return useQuery({
    queryKey: ['ticker', marketCode],
    queryFn: () => marketApi.getTicker(marketCode),
    enabled: !!marketCode,
    staleTime: 10 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useCandles(
  marketCode: string,
  options: {
    type?: TimeframeType;
    unit?: number;
    count?: number;
  } = {},
) {
  const { type = 'minutes', unit = 1, count = 200 } = options;

  return useQuery({
    queryKey: ['candles', marketCode, type, unit, count],
    queryFn: () => marketApi.getCandles(marketCode, { type, unit, count }),
    enabled: !!marketCode,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}
