import { create } from 'zustand';
import type { Ticker, Market } from '../types';

interface MarketState {
  markets: Market[];
  tickers: Map<string, Ticker>;
  selectedMarket: string | null;

  setMarkets: (markets: Market[]) => void;
  updateTicker: (ticker: Ticker) => void;
  updateTickers: (tickers: Ticker[]) => void;
  setSelectedMarket: (market: string | null) => void;
  getTicker: (market: string) => Ticker | undefined;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  markets: [],
  tickers: new Map(),
  selectedMarket: null,

  setMarkets: (markets) => set({ markets }),

  updateTicker: (ticker) =>
    set((state) => {
      const newTickers = new Map(state.tickers);
      newTickers.set(ticker.market, ticker);
      return { tickers: newTickers };
    }),

  updateTickers: (tickers) =>
    set((state) => {
      const newTickers = new Map(state.tickers);
      tickers.forEach((t) => newTickers.set(t.market, t));
      return { tickers: newTickers };
    }),

  setSelectedMarket: (market) => set({ selectedMarket: market }),

  getTicker: (market) => get().tickers.get(market),
}));
