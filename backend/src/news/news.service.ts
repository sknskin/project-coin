import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface ScrapedNews {
  title: string;
  summary?: string;
  sourceUrl: string;
  sourceName: string;
  imageUrl?: string;
  publishedAt: Date;
}

@Injectable()
export class NewsService {
  private logger = new Logger('NewsService');

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async scrapeNews() {
    this.logger.log('Starting news scraping...');

    try {
      const articles = await this.scrapeFromCoinDesk();

      let savedCount = 0;
      for (const article of articles) {
        try {
          await this.prisma.cryptoNews.upsert({
            where: { sourceUrl: article.sourceUrl },
            update: {
              title: article.title,
              summary: article.summary,
              imageUrl: article.imageUrl,
              scrapedAt: new Date(),
            },
            create: article,
          });
          savedCount++;
        } catch (err) {
          // Skip duplicate entries
        }
      }

      this.logger.log(`Scraped and saved ${savedCount} news articles`);
    } catch (error) {
      this.logger.error(`News scraping failed: ${error.message}`);
    }
  }

  private async scrapeFromCoinDesk(): Promise<ScrapedNews[]> {
    const articles: ScrapedNews[] = [];

    try {
      // Using CoinDesk RSS or web scraping
      const response = await axios.get(
        'https://www.coindesk.com/arc/outboundfeeds/rss/',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; CryptoNewsBot/1.0)',
          },
          timeout: 10000,
        },
      );

      const $ = cheerio.load(response.data, { xmlMode: true });

      $('item').each((_, el) => {
        const title = $(el).find('title').text().trim();
        const sourceUrl = $(el).find('link').text().trim();
        const summary = $(el).find('description').text().trim();
        const pubDateStr = $(el).find('pubDate').text().trim();
        const imageUrl = $(el).find('media\\:content, content').attr('url');

        if (title && sourceUrl) {
          articles.push({
            title,
            summary: summary?.substring(0, 500),
            sourceUrl,
            sourceName: 'CoinDesk',
            imageUrl,
            publishedAt: pubDateStr ? new Date(pubDateStr) : new Date(),
          });
        }
      });
    } catch (error) {
      this.logger.warn(`CoinDesk scraping failed: ${error.message}`);
    }

    // Also try Korean news source
    try {
      const krResponse = await axios.get(
        'https://api.blockmedia.co.kr/news/rss',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; CryptoNewsBot/1.0)',
          },
          timeout: 10000,
        },
      );

      const $kr = cheerio.load(krResponse.data, { xmlMode: true });

      $kr('item').each((_, el) => {
        const title = $kr(el).find('title').text().trim();
        const sourceUrl = $kr(el).find('link').text().trim();
        const summary = $kr(el).find('description').text().trim();
        const pubDateStr = $kr(el).find('pubDate').text().trim();

        if (title && sourceUrl) {
          articles.push({
            title,
            summary: summary?.substring(0, 500),
            sourceUrl,
            sourceName: 'BlockMedia',
            publishedAt: pubDateStr ? new Date(pubDateStr) : new Date(),
          });
        }
      });
    } catch (error) {
      this.logger.warn(`BlockMedia scraping failed: ${error.message}`);
    }

    return articles;
  }

  async getNews(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [news, total] = await Promise.all([
      this.prisma.cryptoNews.findMany({
        where: { isActive: true },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.cryptoNews.count({ where: { isActive: true } }),
    ]);

    return {
      news,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getNewsById(id: string) {
    return this.prisma.cryptoNews.findUnique({ where: { id } });
  }
}
