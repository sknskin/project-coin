import { Module } from '@nestjs/common';
import { MarketGateway } from './websocket.gateway';
import { UpbitModule } from '../upbit/upbit.module';

@Module({
  imports: [UpbitModule],
  providers: [MarketGateway],
})
export class WebsocketModule {}
