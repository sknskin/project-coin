export interface AnnouncementAuthor {
  id: string;
  nickname: string | null;
  name: string;
  role: string;
}

export interface AnnouncementComment {
  id: string;
  announcementId: string;
  userId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: AnnouncementAuthor;
  replies?: AnnouncementComment[];
  isLiked?: boolean;
  _count?: {
    likes: number;
  };
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  isPinned: boolean;
  viewCount: number;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  author: AnnouncementAuthor;
  _count: {
    comments: number;
    likes: number;
  };
}

export interface AnnouncementDetail extends Announcement {
  comments: AnnouncementComment[];
  isLiked: boolean;
}

export interface AnnouncementListResponse {
  announcements: Announcement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
