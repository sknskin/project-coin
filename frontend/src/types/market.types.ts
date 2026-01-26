export interface Market {
  market: string;
  korean_name: string;
  english_name: string;
  market_warning?: string;
}

export interface Ticker {
  market: string;
  tradePrice: number;
  openingPrice: number;
  highPrice: number;
  lowPrice: number;
  prevClosingPrice: number;
  change: 'RISE' | 'EVEN' | 'FALL';
  changePrice: number;
  changeRate: number;
  signedChangePrice: number;
  signedChangeRate: number;
  tradeVolume: number;
  accTradePrice24h: number;
  accTradeVolume24h: number;
  highest52WeekPrice: number;
  highest52WeekDate: string;
  lowest52WeekPrice: number;
  lowest52WeekDate: string;
  timestamp: number;
}

export interface Candle {
  market: string;
  candle_date_time_utc: string;
  candle_date_time_kst: string;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  timestamp: number;
  candle_acc_trade_price: number;
  candle_acc_trade_volume: number;
  unit?: number;
}

export interface MarketWithTicker extends Market {
  ticker?: Ticker;
}
