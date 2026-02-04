import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { announcementApi } from '../api/announcement.api';
import { useAuthStore } from '../store/authStore';
import Pagination from '../components/common/Pagination';
import type { Announcement } from '../types/announcement.types';

export default function AnnouncementList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SYSTEM';

  const { data, isLoading, error } = useQuery({
    queryKey: ['announcements', page, limit],
    queryFn: () => announcementApi.getAnnouncements(page, limit),
  });

  const announcementData = data?.data;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getAuthorName = (announcement: Announcement) => {
    return announcement.author.nickname || announcement.author.name;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-600">{t('announcement.loadError')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('announcement.title')}
        </h1>
        <div className="flex items-center justify-between mt-1 min-h-[36px]">
          <p className="text-gray-600 dark:text-gray-400">{t('announcement.subtitle')}</p>
          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="w-36 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value={10}>{t('common.viewPerPage', { count: 10 })}</option>
              <option value={20}>{t('common.viewPerPage', { count: 20 })}</option>
              <option value={50}>{t('common.viewPerPage', { count: 50 })}</option>
            </select>
            {isAdmin && (
              <button
                onClick={() => navigate('/announcements/new')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors"
              >
                {t('announcement.create')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {!announcementData?.announcements ||
        announcementData.announcements.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            {t('announcement.noAnnouncements')}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300 w-1/2">
                  {t('announcement.titleLabel')}
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">
                  {t('announcement.author')}
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">
                  {t('announcement.date')}
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">
                  {t('announcement.views')}
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">
                  {t('announcement.likes')}
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">
                  {t('announcement.comments')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {announcementData.announcements.map((item) => (
                <tr
                  key={item.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => navigate(`/announcements/${item.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {item.isPinned && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 flex-shrink-0">
                          {t('announcement.pinned')}
                        </span>
                      )}
                      <span
                        className={`text-gray-900 dark:text-white truncate ${item.isPinned ? 'font-semibold' : ''}`}
                      >
                        {item.title}
                      </span>
                      {item.attachments.length > 0 && (
                        <svg
                          className="w-4 h-4 text-gray-400 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                          />
                        </svg>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {getAuthorName(item)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                    {item.viewCount}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                    {item._count.likes}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                    {item._count.comments}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {announcementData && (
        <Pagination
          currentPage={page}
          totalPages={announcementData.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
