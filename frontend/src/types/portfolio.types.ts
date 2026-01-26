export interface Holding {
  currency: string;
  balance: number;
  avgBuyPrice: number;
  currentPrice: number;
  evalAmount: number;
  buyAmount: number;
  profitLoss: number;
  profitLossRate: number;
}

export interface Portfolio {
  totalBuyPrice: number;
  totalEvalPrice: number;
  profitLoss: number;
  profitLossRate: number;
  holdings: Holding[];
}

export interface ConnectUpbitRequest {
  accessKey: string;
  secretKey: string;
}
