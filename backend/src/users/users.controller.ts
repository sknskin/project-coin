import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('watchlist')
  async getWatchlist(@CurrentUser() user: { id: string }) {
    return this.usersService.getWatchlist(user.id);
  }

  @Post('watchlist/:marketCode')
  async addToWatchlist(
    @CurrentUser() user: { id: string },
    @Param('marketCode') marketCode: string,
  ) {
    return this.usersService.addToWatchlist(user.id, marketCode);
  }

  @Delete('watchlist/:marketCode')
  async removeFromWatchlist(
    @CurrentUser() user: { id: string },
    @Param('marketCode') marketCode: string,
  ) {
    await this.usersService.removeFromWatchlist(user.id, marketCode);
    return { success: true };
  }
}
