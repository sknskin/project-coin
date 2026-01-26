import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { ConnectUpbitDto } from './dto/connect-upbit.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('portfolio')
@UseGuards(JwtAuthGuard)
export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

  @Post('connect')
  async connectUpbit(
    @CurrentUser() user: { id: string },
    @Body() dto: ConnectUpbitDto,
  ) {
    return this.portfolioService.connectUpbit(
      user.id,
      dto.accessKey,
      dto.secretKey,
    );
  }

  @Delete('disconnect')
  async disconnectUpbit(@CurrentUser() user: { id: string }) {
    await this.portfolioService.disconnectUpbit(user.id);
    return { success: true };
  }

  @Get()
  async getPortfolio(@CurrentUser() user: { id: string }) {
    return this.portfolioService.getPortfolio(user.id);
  }

  @Get('status')
  async getConnectionStatus(@CurrentUser() user: { id: string }) {
    const isConnected = await this.portfolioService.isUpbitConnected(user.id);
    return { isConnected };
  }
}
