import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { UpbitWebSocketService, TickerData } from '../upbit/upbit-websocket.service';

interface SubscribePayload {
  markets: string[];
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/market',
})
export class MarketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(MarketGateway.name);
  private clientSubscriptions = new Map<string, Set<string>>();

  @WebSocketServer()
  server: Server;

  constructor(private upbitWsService: UpbitWebSocketService) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');

    // Subscribe to Upbit ticker updates and broadcast to clients
    this.upbitWsService.ticker$.subscribe((ticker: TickerData) => {
      const formattedTicker = this.formatTicker(ticker);
      this.server.to(`market:${ticker.code}`).emit('ticker:update', formattedTicker);
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.clientSubscriptions.set(client.id, new Set());
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const subscriptions = this.clientSubscriptions.get(client.id);
    if (subscriptions) {
      subscriptions.forEach((market) => {
        client.leave(`market:${market}`);
      });
    }
    this.clientSubscriptions.delete(client.id);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SubscribePayload,
  ) {
    const { markets } = data;

    if (!markets || !Array.isArray(markets)) {
      return { error: 'Invalid markets array' };
    }

    const clientSubs = this.clientSubscriptions.get(client.id) || new Set();

    markets.forEach((market) => {
      client.join(`market:${market}`);
      clientSubs.add(market);
    });

    this.clientSubscriptions.set(client.id, clientSubs);

    // Subscribe to Upbit WebSocket
    this.upbitWsService.subscribeToMarkets(markets);

    this.logger.log(`Client ${client.id} subscribed to: ${markets.join(', ')}`);

    return { event: 'subscribed', data: { markets } };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SubscribePayload,
  ) {
    const { markets } = data;

    if (!markets || !Array.isArray(markets)) {
      return { error: 'Invalid markets array' };
    }

    const clientSubs = this.clientSubscriptions.get(client.id);
    if (clientSubs) {
      markets.forEach((market) => {
        client.leave(`market:${market}`);
        clientSubs.delete(market);
      });
    }

    this.logger.log(`Client ${client.id} unsubscribed from: ${markets.join(', ')}`);

    return { event: 'unsubscribed', data: { markets } };
  }

  private formatTicker(ticker: TickerData) {
    return {
      market: ticker.code,
      tradePrice: ticker.trade_price,
      openingPrice: ticker.opening_price,
      highPrice: ticker.high_price,
      lowPrice: ticker.low_price,
      prevClosingPrice: ticker.prev_closing_price,
      change: ticker.change,
      changePrice: ticker.change_price,
      changeRate: ticker.change_rate,
      signedChangePrice: ticker.signed_change_price,
      signedChangeRate: ticker.signed_change_rate,
      tradeVolume: ticker.trade_volume,
      accTradePrice24h: ticker.acc_trade_price_24h,
      accTradeVolume24h: ticker.acc_trade_volume_24h,
      highest52WeekPrice: ticker.highest_52_week_price,
      highest52WeekDate: ticker.highest_52_week_date,
      lowest52WeekPrice: ticker.lowest_52_week_price,
      lowest52WeekDate: ticker.lowest_52_week_date,
      timestamp: ticker.timestamp,
    };
  }
}
