export interface CryptoNews {
  id: string;
  title: string;
  summary: string | null;
  sourceUrl: string;
  sourceName: string;
  imageUrl: string | null;
  publishedAt: string;
  scrapedAt: string;
}

export interface NewsResponse {
  news: CryptoNews[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
