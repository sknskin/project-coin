import { Module } from '@nestjs/common';
import { UpbitService } from './upbit.service';
import { UpbitController } from './upbit.controller';
import { UpbitWebSocketService } from './upbit-websocket.service';

@Module({
  controllers: [UpbitController],
  providers: [UpbitService, UpbitWebSocketService],
  exports: [UpbitService, UpbitWebSocketService],
})
export class UpbitModule {}
