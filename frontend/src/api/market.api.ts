import apiClient from './client';
import type { Market, Candle } from '../types';

export interface UpbitTicker {
  market: string;
  trade_price: number;
  opening_price: number;
  high_price: number;
  low_price: number;
  prev_closing_price: number;
  change: 'RISE' | 'EVEN' | 'FALL';
  change_price: number;
  change_rate: number;
  signed_change_price: number;
  signed_change_rate: number;
  trade_volume: number;
  acc_trade_price_24h: number;
  acc_trade_volume_24h: number;
  highest_52_week_price: number;
  highest_52_week_date: string;
  lowest_52_week_price: number;
  lowest_52_week_date: string;
  timestamp: number;
}

export const marketApi = {
  getMarkets: async (): Promise<Market[]> => {
    const response = await apiClient.get<Market[]>('/markets');
    return response.data;
  },

  getTicker: async (marketCode: string): Promise<UpbitTicker> => {
    const response = await apiClient.get<UpbitTicker>(`/markets/${marketCode}/ticker`);
    return response.data;
  },

  getCandles: async (
    marketCode: string,
    options: {
      type?: 'minutes' | 'days' | 'weeks' | 'months';
      unit?: number;
      count?: number;
      to?: string;
    } = {},
  ): Promise<Candle[]> => {
    const { type = 'minutes', unit = 1, count = 200, to } = options;
    const params = new URLSearchParams({
      type,
      unit: String(unit),
      count: String(count),
    });
    if (to) {
      params.append('to', to);
    }
    const response = await apiClient.get<Candle[]>(
      `/markets/${marketCode}/candles?${params.toString()}`,
    );
    return response.data;
  },
};
