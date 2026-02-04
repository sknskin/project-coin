import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { announcementApi } from '../api/announcement.api';
import { useAuthStore } from '../store/authStore';
import Loading from '../components/common/Loading';
import ConfirmModal from '../components/common/ConfirmModal';

export default function AnnouncementDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [commentContent, setCommentContent] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SYSTEM';
  const isSystem = user?.role === 'SYSTEM';

  const canDeleteComment = (commentAuthorRole: string, commentUserId: string) => {
    if (commentUserId === user?.id) return true;
    if (commentAuthorRole === 'SYSTEM' && !isSystem) return false;
    if (commentAuthorRole === 'ADMIN' && !isAdmin) return false;
    return isAdmin;
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['announcement', id],
    queryFn: () => announcementApi.getAnnouncementById(id!),
    enabled: !!id,
  });

  const announcement = data?.data;

  const likeMutation = useMutation({
    mutationFn: () => announcementApi.toggleLike(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcement', id] });
    },
  });

  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const commentMutation = useMutation({
    mutationFn: (data: { content: string; parentId?: string }) =>
      announcementApi.createComment(id!, data.content, data.parentId),
    onSuccess: () => {
      setCommentContent('');
      setReplyContent('');
      setReplyToId(null);
      queryClient.invalidateQueries({ queryKey: ['announcement', id] });
    },
  });

  const commentLikeMutation = useMutation({
    mutationFn: (commentId: string) =>
      announcementApi.toggleCommentLike(id!, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcement', id] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) =>
      announcementApi.deleteComment(id!, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcement', id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => announcementApi.deleteAnnouncement(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      navigate('/announcements');
    },
  });

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate();
    setIsDeleteModalOpen(false);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentContent.trim()) {
      commentMutation.mutate({ content: commentContent.trim() });
    }
  };

  const handleReplySubmit = (parentId: string) => {
    if (replyContent.trim()) {
      commentMutation.mutate({ content: replyContent.trim(), parentId });
    }
  };

  const handleCommentDelete = (commentId: string) => {
    setDeleteCommentId(commentId);
  };

  const handleCommentDeleteConfirm = () => {
    if (deleteCommentId) {
      deleteCommentMutation.mutate(deleteCommentId);
      setDeleteCommentId(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_URL || 'http://localhost:3001';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loading size="lg" />
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="text-center py-16 text-red-600">
        {t('announcement.loadError')}
      </div>
    );
  }

  const authorName = announcement.author.nickname || announcement.author.name;

  // 권한 체크: SYSTEM 작성 → SYSTEM만, ADMIN 작성 → ADMIN/SYSTEM
  const canEditOrDelete = isAdmin && (
    announcement.author.role !== 'SYSTEM' || isSystem
  );

  return (
    <div>
      {/* 상단 네비게이션 */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/announcements"
          className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('announcement.backToList')}
        </Link>
        {canEditOrDelete && (
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/announcements/${id}/edit`)}
              className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {t('announcement.edit')}
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {t('announcement.delete')}
            </button>
          </div>
        )}
      </div>

      {/* 본문 카드 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        {announcement.isPinned && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 mb-3">
            {t('announcement.pinned')}
          </span>
        )}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {announcement.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <span>{authorName}</span>
          <span>{formatDateTime(announcement.createdAt)}</span>
          <span>
            {t('announcement.views')} {announcement.viewCount}
          </span>
        </div>

        {/* 내용 */}
        <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed mb-6 min-h-[120px]">
          {announcement.content}
        </div>

        {/* 첨부파일 */}
        {announcement.attachments.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('announcement.attachments')} ({announcement.attachments.length})
            </h3>
            <div className="space-y-1">
              {announcement.attachments.map((url, index) => {
                const fileName = url.split('/').pop() || `file-${index + 1}`;
                return (
                  <a
                    key={index}
                    href={`${getApiBaseUrl()}${url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    <svg
                      className="w-4 h-4 flex-shrink-0"
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
                    {fileName}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* 좋아요 버튼 */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <button
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              announcement.isLiked
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <svg
              className="w-5 h-5"
              fill={announcement.isLiked ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            {announcement.isLiked
              ? t('announcement.liked')
              : t('announcement.likeToggle')}{' '}
            {announcement._count.likes}
          </button>
        </div>
      </div>

      {/* 댓글 섹션 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('announcement.comments')} ({announcement._count.comments})
        </h2>

        {/* 댓글 입력 */}
        <form onSubmit={handleCommentSubmit} className="mb-6">
          <textarea
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder={t('announcement.commentPlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={!commentContent.trim() || commentMutation.isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {t('announcement.commentSubmit')}
            </button>
          </div>
        </form>

        {/* 댓글 목록 */}
        <div className="space-y-4">
          {announcement.comments.map((comment) => (
            <div
              key={comment.id}
              className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-b-0"
            >
              {/* 댓글 헤더 */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {comment.user.nickname || comment.user.name}
                  </span>
                  {(comment.user.role === 'ADMIN' ||
                    comment.user.role === 'SYSTEM') && (
                    <span className="px-1.5 py-0.5 text-xs rounded bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                      {comment.user.role === 'SYSTEM' ? 'System' : 'Admin'}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {formatDateTime(comment.createdAt)}
                  </span>
                </div>
                {canDeleteComment(comment.user.role, comment.userId) && (
                  <button
                    onClick={() => handleCommentDelete(comment.id)}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    {t('announcement.commentDelete')}
                  </button>
                )}
              </div>
              {/* 댓글 본문 */}
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {comment.content}
              </p>
              {/* 댓글 액션 (좋아요 + 답글) */}
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => commentLikeMutation.mutate(comment.id)}
                  disabled={commentLikeMutation.isPending}
                  className={`flex items-center gap-1 text-xs transition-colors ${
                    comment.isLiked
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
                  }`}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill={comment.isLiked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  {comment._count?.likes || 0}
                </button>
                <button
                  onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {t('announcement.reply')}
                </button>
              </div>

              {/* 답글 목록 */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 ml-6 space-y-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                  {comment.replies.map((reply) => (
                    <div key={reply.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {reply.user.nickname || reply.user.name}
                          </span>
                          {(reply.user.role === 'ADMIN' ||
                            reply.user.role === 'SYSTEM') && (
                            <span className="px-1.5 py-0.5 text-xs rounded bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                              {reply.user.role === 'SYSTEM' ? 'System' : 'Admin'}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {formatDateTime(reply.createdAt)}
                          </span>
                        </div>
                        {canDeleteComment(reply.user.role, reply.userId) && (
                          <button
                            onClick={() => handleCommentDelete(reply.id)}
                            className="text-xs text-red-500 hover:text-red-700 transition-colors"
                          >
                            {t('announcement.commentDelete')}
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {reply.content}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <button
                          onClick={() => commentLikeMutation.mutate(reply.id)}
                          disabled={commentLikeMutation.isPending}
                          className={`flex items-center gap-1 text-xs transition-colors ${
                            reply.isLiked
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
                          }`}
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill={reply.isLiked ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                          {reply._count?.likes || 0}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 답글 입력 폼 */}
              {replyToId === comment.id && (
                <div className="mt-3 ml-6 border-l-2 border-primary-200 dark:border-primary-700 pl-4">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={t('announcement.replyPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => { setReplyToId(null); setReplyContent(''); }}
                      className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReplySubmit(comment.id)}
                      disabled={!replyContent.trim() || commentMutation.isPending}
                      className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-xs font-medium disabled:opacity-50 transition-colors"
                    >
                      {t('announcement.replySubmit')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 공지 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={t('announcement.delete')}
        message={t('announcement.deleteConfirm')}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* 댓글 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={!!deleteCommentId}
        onClose={() => setDeleteCommentId(null)}
        onConfirm={handleCommentDeleteConfirm}
        title={t('announcement.commentDelete')}
        message={t('announcement.commentDeleteConfirm')}
        variant="danger"
        isLoading={deleteCommentMutation.isPending}
      />
    </div>
  );
}
