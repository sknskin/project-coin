import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Subject } from 'rxjs';
import * as WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';

export interface TickerData {
  type: string;
  code: string;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  prev_closing_price: number;
  change: 'RISE' | 'EVEN' | 'FALL';
  change_price: number;
  signed_change_price: number;
  change_rate: number;
  signed_change_rate: number;
  trade_volume: number;
  acc_trade_volume: number;
  acc_trade_volume_24h: number;
  acc_trade_price: number;
  acc_trade_price_24h: number;
  trade_date: string;
  trade_time: string;
  trade_timestamp: number;
  ask_bid: string;
  acc_ask_volume: number;
  acc_bid_volume: number;
  highest_52_week_price: number;
  highest_52_week_date: string;
  lowest_52_week_price: number;
  lowest_52_week_date: string;
  market_state: string;
  is_trading_suspended: boolean;
  delisting_date: string | null;
  market_warning: string;
  timestamp: number;
  stream_type: string;
}

@Injectable()
export class UpbitWebSocketService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UpbitWebSocketService.name);
  private ws: WebSocket | null = null;
  private subscribedMarkets: Set<string> = new Set();
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly RECONNECT_DELAY = 3000;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;

  private tickerSubject = new Subject<TickerData>();
  public ticker$ = this.tickerSubject.asObservable();

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    this.disconnect();
  }

  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket('wss://api.upbit.com/websocket/v1');

      this.ws.on('open', () => {
        this.logger.log('Connected to Upbit WebSocket');
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        if (this.subscribedMarkets.size > 0) {
          this.sendSubscription([...this.subscribedMarkets]);
        }
      });

      this.ws.on('message', (data: Buffer) => {
        try {
          const parsed = JSON.parse(data.toString()) as TickerData;
          this.tickerSubject.next(parsed);
        } catch (error) {
          this.logger.error('Failed to parse WebSocket message', error);
        }
      });

      this.ws.on('close', () => {
        this.logger.warn('Upbit WebSocket connection closed');
        this.isConnecting = false;
        this.handleReconnect();
      });

      this.ws.on('error', (error) => {
        this.logger.error('Upbit WebSocket error:', error);
        this.isConnecting = false;
      });
    } catch (error) {
      this.logger.error('Failed to connect to Upbit WebSocket', error);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribeToMarkets(markets: string[]): void {
    markets.forEach((m) => this.subscribedMarkets.add(m));

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendSubscription([...this.subscribedMarkets]);
    }
  }

  unsubscribeFromMarkets(markets: string[]): void {
    markets.forEach((m) => this.subscribedMarkets.delete(m));

    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.subscribedMarkets.size > 0) {
      this.sendSubscription([...this.subscribedMarkets]);
    }
  }

  getSubscribedMarkets(): string[] {
    return [...this.subscribedMarkets];
  }

  private sendSubscription(markets: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || markets.length === 0) {
      return;
    }

    const subscribeMessage = [
      { ticket: uuidv4() },
      {
        type: 'ticker',
        codes: markets,
        isOnlyRealtime: true,
      },
      { format: 'DEFAULT' },
    ];

    this.ws.send(JSON.stringify(subscribeMessage));
    this.logger.log(`Subscribed to ${markets.length} markets`);
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.logger.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.RECONNECT_DELAY * this.reconnectAttempts;

    this.logger.log(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`,
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }
}
