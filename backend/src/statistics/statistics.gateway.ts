import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { StatisticsService } from './statistics.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/statistics',
})
export class StatisticsGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('StatisticsGateway');
  private updateInterval: ReturnType<typeof setInterval>;

  constructor(private statisticsService: StatisticsService) {}

  afterInit() {
    this.logger.log('Statistics Gateway initialized');

    // Broadcast stats every 30 seconds
    this.updateInterval = setInterval(async () => {
      try {
        const stats = await this.statisticsService.getRealTimeStats();
        this.server.emit('stats:realtime', stats);
      } catch (error) {
        this.logger.error('Failed to broadcast stats:', error);
      }
    }, 30000);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from statistics: ${client.id}`);
  }

  @SubscribeMessage('stats:subscribe')
  async handleSubscribe(client: Socket) {
    try {
      const stats = await this.statisticsService.getRealTimeStats();
      client.emit('stats:realtime', stats);
    } catch (error) {
      this.logger.error('Failed to send initial stats:', error);
    }
  }
}
