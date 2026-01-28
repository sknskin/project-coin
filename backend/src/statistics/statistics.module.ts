import { Module } from '@nestjs/common';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { StatisticsGateway } from './statistics.gateway';

@Module({
  controllers: [StatisticsController],
  providers: [StatisticsService, StatisticsGateway],
  exports: [StatisticsService],
})
export class StatisticsModule {}
