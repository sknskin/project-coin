import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { newsApi } from '../api/news.api';
import type { CryptoNews } from '../types/news.types';
import '../styles/CoinInfo.css';

export default function CoinInfo() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['news', page],
    queryFn: () => newsApi.getNews(page, limit),
  });

  const newsData = data?.data;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleNewsClick = (news: CryptoNews) => {
    window.open(news.sourceUrl, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="coin-info-container">
        <div className="loading-spinner">{t('common.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="coin-info-container">
        <div className="error-message">{t('news.loadError')}</div>
      </div>
    );
  }

  return (
    <div className="coin-info-container">
      <h1 className="page-title">{t('menu.coinInfo')}</h1>
      <p className="page-description">{t('news.description')}</p>

      <div className="news-list">
        {newsData?.news.map((news: CryptoNews) => (
          <article
            key={news.id}
            className="news-card"
            onClick={() => handleNewsClick(news)}
          >
            {news.imageUrl && (
              <div className="news-image">
                <img src={news.imageUrl} alt={news.title} />
              </div>
            )}
            <div className="news-content">
              <h2 className="news-title">{news.title}</h2>
              {news.summary && (
                <p className="news-summary">{news.summary}</p>
              )}
              <div className="news-meta">
                <span className="news-source">{news.sourceName}</span>
                <span className="news-date">{formatDate(news.publishedAt)}</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {newsData && newsData.totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="pagination-btn"
          >
            {t('common.prev')}
          </button>
          <span className="pagination-info">
            {page} / {newsData.totalPages}
          </span>
          <button
            disabled={page >= newsData.totalPages}
            onClick={() => setPage(page + 1)}
            className="pagination-btn"
          >
            {t('common.next')}
          </button>
        </div>
      )}
    </div>
  );
}
