import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { StatisticsService } from './statistics.service';
import { UserRole } from '@prisma/client';

class TrackVisitorDto {
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
}

@Controller('statistics')
export class StatisticsController {
  constructor(private statisticsService: StatisticsService) {}

  @Post('track')
  trackVisitor(@Body() dto: TrackVisitorDto) {
    return this.statisticsService.trackVisitor(
      dto.sessionId,
      dto.ipAddress,
      dto.userAgent,
      dto.referrer,
    );
  }

  @Get('realtime')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getRealTimeStats() {
    return this.statisticsService.getRealTimeStats();
  }

  @Get('historical')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getHistoricalStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.statisticsService.getHistoricalStats(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('logins')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getLoginStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.statisticsService.getLoginStats(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('registrations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getRegistrationStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.statisticsService.getRegistrationStats(
      new Date(startDate),
      new Date(endDate),
    );
  }
}
