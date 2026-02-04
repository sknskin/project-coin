import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { announcementApi } from '../api/announcement.api';
import { useAuthStore } from '../store/authStore';
import Loading from '../components/common/Loading';
import ConfirmModal from '../components/common/ConfirmModal';

export default function AnnouncementForm() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const isEdit = !!id && id !== 'new';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SYSTEM';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const { data: existingData, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['announcement', id],
    queryFn: () => announcementApi.getAnnouncementById(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingData?.data) {
      setTitle(existingData.data.title);
      setContent(existingData.data.content);
      setIsPinned(existingData.data.isPinned);
    }
  }, [existingData]);

  const createMutation = useMutation({
    mutationFn: (data: {
      title: string;
      content: string;
      isPinned?: boolean;
      files?: File[];
    }) => announcementApi.createAnnouncement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcement', id] });
      navigate('/announcements')
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: {
      title?: string;
      content?: string;
      isPinned?: boolean;
      files?: File[];
    }) => announcementApi.updateAnnouncement(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcement', id] });
      navigate(`/announcements/${id}`)
    },
  });

  const handleCreateOrUpdateConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      setIsUpdateModalOpen(true);
    } else {
      setIsCreateModalOpen(true);
    }
  }

  const handleSubmit = () => {
    const payload = {
      title,
      content,
      isPinned,
      files: files.length > 0 ? files : undefined,
    };
    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles].slice(0, 5));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  if (!isAdmin) {
    navigate('/announcements');
    return null;
  }

  if (isEdit && isLoadingExisting) {
    return (
      <div className="flex justify-center py-16">
        <Loading size="lg" />
      </div>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {isEdit ? t('announcement.edit') : t('announcement.create')}
      </h1>

      <form
        onSubmit={handleCreateOrUpdateConfirm}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4"
      >
        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('announcement.titleLabel')}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('announcement.titlePlaceholder')}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* 내용 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('announcement.contentLabel')}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('announcement.contentPlaceholder')}
            required
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-y focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* 상단 고정 */}
        <div className="flex">
          <label htmlFor="isPinned" className="inline-flex items-center cursor-pointer select-none group">
            <div className="relative">
              <input
                type="checkbox"
                id="isPinned"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-4 h-4 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 peer-checked:bg-primary-600 peer-checked:border-primary-600 transition-colors peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:ring-offset-1 dark:peer-focus:ring-offset-gray-800">
                <svg
                  className={`w-4 h-4 text-white ${isPinned ? 'opacity-100' : 'opacity-0'} transition-opacity`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
              {t('announcement.pinnedLabel')}
            </span>
          </label>
        </div>

        {/* 파일 첨부 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('announcement.fileUpload')}
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {t('announcement.fileUploadHint')}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900 dark:file:text-primary-300"
          />
          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded"
                >
                  <span>
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-red-500 hover:text-red-700 text-sm ml-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 수정 시 기존 첨부파일 표시 */}
          {isEdit && existingData?.data?.attachments && existingData.data.attachments.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {t('announcement.attachments')} ({existingData.data.attachments.length})
              </p>
              {existingData.data.attachments.map((url, index) => (
                <div
                  key={index}
                  className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded mt-1"
                >
                  {url.split('/').pop()}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isPending || !title.trim() || !content.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isPending
              ? t('auth.processing')
              : isEdit
                ? t('announcement.update')
                : t('announcement.submit')}
          </button>
        </div>
      </form>

      {/* 공지 등록 확인 모달 */}
      <ConfirmModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onConfirm={handleSubmit}
        title={t('announcement.create')}
        message={t('announcement.createConfirm')}
      />

      {/* 공지 수정 확인 모달 */}
      <ConfirmModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onConfirm={handleSubmit}
        title={t('announcement.update')}
        message={t('announcement.updateConfirm')}
      />
    </div>
  );
}
