import { Controller, Get, Param, Query } from '@nestjs/common';
import { NewsService } from './news.service';

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
}
