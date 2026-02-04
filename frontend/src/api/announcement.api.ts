import api from './client';
import type {
  AnnouncementListResponse,
  AnnouncementDetail,
  Announcement,
  AnnouncementComment,
} from '../types/announcement.types';

export const announcementApi = {
  getAnnouncements: (page = 1, limit = 10) =>
    api.get<AnnouncementListResponse>('/announcements', {
      params: { page, limit },
    }),

  getAnnouncementById: (id: string) =>
    api.get<AnnouncementDetail>(`/announcements/${id}`),

  createAnnouncement: (data: {
    title: string;
    content: string;
    isPinned?: boolean;
    files?: File[];
  }) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    if (data.isPinned !== undefined) {
      formData.append('isPinned', String(data.isPinned));
    }
    if (data.files) {
      data.files.forEach((file) => formData.append('files', file));
    }
    return api.post<Announcement>('/announcements', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  updateAnnouncement: (
    id: string,
    data: {
      title?: string;
      content?: string;
      isPinned?: boolean;
      files?: File[];
    },
  ) => {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.content) formData.append('content', data.content);
    if (data.isPinned !== undefined)
      formData.append('isPinned', String(data.isPinned));
    if (data.files) {
      data.files.forEach((file) => formData.append('files', file));
    }
    return api.patch<Announcement>(`/announcements/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteAnnouncement: (id: string) => api.delete(`/announcements/${id}`),

  createComment: (announcementId: string, content: string, parentId?: string) =>
    api.post<AnnouncementComment>(
      `/announcements/${announcementId}/comments`,
      { content, parentId },
    ),

  deleteComment: (announcementId: string, commentId: string) =>
    api.delete(`/announcements/${announcementId}/comments/${commentId}`),

  toggleLike: (announcementId: string) =>
    api.post<{ liked: boolean }>(`/announcements/${announcementId}/like`),

  toggleCommentLike: (announcementId: string, commentId: string) =>
    api.post<{ liked: boolean }>(
      `/announcements/${announcementId}/comments/${commentId}/like`,
    ),
};
