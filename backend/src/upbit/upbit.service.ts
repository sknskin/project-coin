import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export interface UpbitMarket {
  market: string;
  korean_name: string;
  english_name: string;
  market_warning?: string;
}

export interface UpbitTicker {
  market: string;
  trade_date: string;
  trade_time: string;
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
  acc_trade_price: number;
  acc_trade_price_24h: number;
  acc_trade_volume: number;
  acc_trade_volume_24h: number;
  highest_52_week_price: number;
  highest_52_week_date: string;
  lowest_52_week_price: number;
  lowest_52_week_date: string;
  timestamp: number;
}

export interface UpbitCandle {
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

interface UpbitErrorResponse {
  error: {
    name: string;
    message: string;
  };
}

@Injectable()
export class UpbitService {
  private readonly logger = new Logger(UpbitService.name);
  private readonly baseUrl = 'https://api.upbit.com/v1';

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async getMarkets(): Promise<UpbitMarket[]> {
    const response = await fetch(`${this.baseUrl}/market/all?isDetails=true`);
    const data = await response.json();

    if (!response.ok || !Array.isArray(data)) {
      this.logger.error(`Failed to fetch markets: ${JSON.stringify(data)}`);
      throw new BadRequestException('Failed to fetch markets from Upbit');
    }

    return data;
  }

  async getKrwMarkets(): Promise<UpbitMarket[]> {
    const markets = await this.getMarkets();
    return markets.filter((m) => m.market.startsWith('KRW-'));
  }

  async getTicker(markets: string[]): Promise<UpbitTicker[]> {
    if (!markets || markets.length === 0) {
      return [];
    }

    const marketParam = markets.join(',');
    const response = await fetch(`${this.baseUrl}/ticker?markets=${marketParam}`);
    const data = await response.json();

    // 에러 응답 처리
    if (!response.ok) {
      const errorData = data as UpbitErrorResponse;
      this.logger.error(`Upbit ticker API error: ${JSON.stringify(errorData)}`);
      throw new BadRequestException(
        errorData.error?.message || 'Failed to fetch ticker from Upbit',
      );
    }

    // 응답이 배열인지 확인
    if (!Array.isArray(data)) {
      this.logger.error(`Unexpected ticker response: ${JSON.stringify(data)}`);
      throw new BadRequestException('Unexpected response from Upbit ticker API');
    }

    return data;
  }

  async getMinuteCandles(
    market: string,
    unit: 1 | 3 | 5 | 15 | 30 | 60 | 240 = 1,
    count: number = 200,
    to?: string,
  ): Promise<UpbitCandle[]> {
    let url = `${this.baseUrl}/candles/minutes/${unit}?market=${market}&count=${count}`;
    if (to) {
      url += `&to=${to}`;
    }
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || !Array.isArray(data)) {
      this.logger.error(`Failed to fetch minute candles: ${JSON.stringify(data)}`);
      return [];
    }

    return data;
  }

  async getDayCandles(
    market: string,
    count: number = 200,
    to?: string,
  ): Promise<UpbitCandle[]> {
    let url = `${this.baseUrl}/candles/days?market=${market}&count=${count}`;
    if (to) {
      url += `&to=${to}`;
    }
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || !Array.isArray(data)) {
      this.logger.error(`Failed to fetch day candles: ${JSON.stringify(data)}`);
      return [];
    }

    return data;
  }

  async getWeekCandles(
    market: string,
    count: number = 200,
    to?: string,
  ): Promise<UpbitCandle[]> {
    let url = `${this.baseUrl}/candles/weeks?market=${market}&count=${count}`;
    if (to) {
      url += `&to=${to}`;
    }
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || !Array.isArray(data)) {
      this.logger.error(`Failed to fetch week candles: ${JSON.stringify(data)}`);
      return [];
    }

    return data;
  }

  async getMonthCandles(
    market: string,
    count: number = 200,
    to?: string,
  ): Promise<UpbitCandle[]> {
    let url = `${this.baseUrl}/candles/months?market=${market}&count=${count}`;
    if (to) {
      url += `&to=${to}`;
    }
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || !Array.isArray(data)) {
      this.logger.error(`Failed to fetch month candles: ${JSON.stringify(data)}`);
      return [];
    }

    return data;
  }

  async syncMarkets(): Promise<void> {
    const markets = await this.getKrwMarkets();

    for (const market of markets) {
      await this.prisma.market.upsert({
        where: { marketCode: market.market },
        update: {
          koreanName: market.korean_name,
          englishName: market.english_name,
          marketWarning: market.market_warning,
        },
        create: {
          marketCode: market.market,
          koreanName: market.korean_name,
          englishName: market.english_name,
          marketWarning: market.market_warning,
        },
      });
    }

    this.logger.log(`Synced ${markets.length} markets`);
  }
}
