import { Controller, Get, Param, Query } from '@nestjs/common';
import { UpbitService } from './upbit.service';

@Controller('markets')
export class UpbitController {
  constructor(private upbitService: UpbitService) {}

  @Get()
  async getMarkets() {
    return this.upbitService.getKrwMarkets();
  }

  @Get(':code/ticker')
  async getTicker(@Param('code') code: string) {
    const tickers = await this.upbitService.getTicker([code]);
    return tickers[0];
  }

  @Get(':code/candles')
  async getCandles(
    @Param('code') code: string,
    @Query('unit') unit: string = '1',
    @Query('count') count: string = '200',
    @Query('to') to?: string,
    @Query('type') type: string = 'minutes',
  ) {
    const countNum = parseInt(count, 10);

    switch (type) {
      case 'days':
        return this.upbitService.getDayCandles(code, countNum, to);
      case 'weeks':
        return this.upbitService.getWeekCandles(code, countNum, to);
      case 'months':
        return this.upbitService.getMonthCandles(code, countNum, to);
      default:
        const unitNum = parseInt(unit, 10) as 1 | 3 | 5 | 15 | 30 | 60 | 240;
        return this.upbitService.getMinuteCandles(code, unitNum, countNum, to);
    }
  }
}
