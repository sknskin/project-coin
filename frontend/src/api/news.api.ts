import api from './client';
import type { NewsResponse, CryptoNews } from '../types/news.types';

export const newsApi = {
  getNews: (page = 1, limit = 20) =>
    api.get<NewsResponse>('/news', { params: { page, limit } }),

  getNewsById: (id: string) => api.get<CryptoNews>(`/news/${id}`),
};
