import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { NewsService } from './news.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('news')
export class NewsController {
  constructor(private newsService: NewsService) {}

  @Get()
  getNews(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.newsService.getNews(parseInt(page), parseInt(limit));
  }

  @Get(':id')
  getNewsById(@Param('id') id: string) {
    return this.newsService.getNewsById(id);
  }

  @Post('scrape')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async manualScrape() {
    await this.newsService.scrapeNews();
    return { success: true, message: 'News scraping completed' };
  }
}
