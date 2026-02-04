import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UserRole, NotificationType, UserStatus, ApprovalStatus } from '@prisma/client';

@Injectable()
export class AnnouncementService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async getAnnouncements(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [announcements, total] = await Promise.all([
      this.prisma.announcement.findMany({
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, nickname: true, name: true, role: true },
          },
          _count: {
            select: { comments: true, likes: true },
          },
        },
      }),
      this.prisma.announcement.count(),
    ]);

    return {
      announcements,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private readonly commentInclude = {
    user: {
      select: { id: true, nickname: true, name: true, role: true },
    },
    _count: {
      select: { likes: true },
    },
  } as const;

  async getAnnouncementById(id: string, userId?: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, nickname: true, name: true, role: true },
        },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: 'asc' },
          include: {
            ...this.commentInclude,
            replies: {
              orderBy: { createdAt: 'asc' as const },
              include: this.commentInclude,
            },
          },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    // 조회수 증가
    await this.prisma.announcement.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // 좋아요 여부 확인
    let isLiked = false;
    if (userId) {
      const like = await this.prisma.announcementLike.findUnique({
        where: {
          announcementId_userId: { announcementId: id, userId },
        },
      });
      isLiked = !!like;
    }

    // 댓글 좋아요 여부 확인
    const commentsWithLikeStatus = await Promise.all(
      announcement.comments.map(async (comment) => {
        let commentIsLiked = false;
        if (userId) {
          const cl = await this.prisma.announcementCommentLike.findUnique({
            where: { commentId_userId: { commentId: comment.id, userId } },
          });
          commentIsLiked = !!cl;
        }
        const repliesWithLikeStatus = await Promise.all(
          (comment as any).replies.map(async (reply: any) => {
            let replyIsLiked = false;
            if (userId) {
              const rl = await this.prisma.announcementCommentLike.findUnique({
                where: { commentId_userId: { commentId: reply.id, userId } },
              });
              replyIsLiked = !!rl;
            }
            return { ...reply, isLiked: replyIsLiked };
          }),
        );
        return { ...comment, isLiked: commentIsLiked, replies: repliesWithLikeStatus };
      }),
    );

    return {
      ...announcement,
      viewCount: announcement.viewCount + 1,
      isLiked,
      comments: commentsWithLikeStatus,
    };
  }

  private async notifyAllUsers(
    announcementId: string,
    title: string,
    isUpdate: boolean,
  ) {
    const users = await this.prisma.user.findMany({
      where: {
        status: UserStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
      },
      select: { id: true },
    });

    const notificationTitle = isUpdate
      ? '공지사항이 수정되었습니다'
      : '새 공지사항이 등록되었습니다';

    await Promise.all(
      users.map((user) =>
        this.notificationService.create(user.id, {
          type: NotificationType.ANNOUNCEMENT,
          title: notificationTitle,
          message: title,
          data: { announcementId },
        }),
      ),
    );
  }

  async createAnnouncement(
    authorId: string,
    dto: CreateAnnouncementDto,
    files?: Express.Multer.File[],
  ) {
    const attachments =
      files?.map((f) => `/uploads/announcements/${f.filename}`) || [];

    const announcement = await this.prisma.announcement.create({
      data: {
        title: dto.title,
        content: dto.content,
        isPinned: dto.isPinned || false,
        authorId,
        attachments,
      },
      include: {
        author: {
          select: { id: true, nickname: true, name: true, role: true },
        },
      },
    });

    this.notifyAllUsers(announcement.id, announcement.title, false);

    return announcement;
  }

  private async checkEditPermission(announcementId: string, currentRole: UserRole) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id: announcementId },
      include: { author: { select: { role: true } } },
    });
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }
    // SYSTEM 작성 → SYSTEM만 수정/삭제 가능
    if (announcement.author.role === UserRole.SYSTEM && currentRole !== UserRole.SYSTEM) {
      throw new ForbiddenException('Only SYSTEM admin can modify this announcement');
    }
    return announcement;
  }

  async updateAnnouncement(
    id: string,
    currentRole: UserRole,
    dto: UpdateAnnouncementDto,
    files?: Express.Multer.File[],
  ) {
    const existing = await this.checkEditPermission(id, currentRole);

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.isPinned !== undefined) data.isPinned = dto.isPinned;

    if (files && files.length > 0) {
      const newAttachments = files.map(
        (f) => `/uploads/announcements/${f.filename}`,
      );
      data.attachments = [...existing.attachments, ...newAttachments];
    }

    const announcement = await this.prisma.announcement.update({
      where: { id },
      data,
      include: {
        author: {
          select: { id: true, nickname: true, name: true, role: true },
        },
      },
    });

    this.notifyAllUsers(announcement.id, announcement.title, true);

    return announcement;
  }

  async deleteAnnouncement(id: string, currentRole: UserRole) {
    await this.checkEditPermission(id, currentRole);
    await this.prisma.announcement.delete({ where: { id } });
    return { success: true };
  }

  // --- 댓글 ---
  async createComment(
    announcementId: string,
    userId: string,
    dto: CreateCommentDto,
  ) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id: announcementId },
    });
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    if (dto.parentId) {
      const parent = await this.prisma.announcementComment.findFirst({
        where: { id: dto.parentId, announcementId },
      });
      if (!parent) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    return this.prisma.announcementComment.create({
      data: {
        announcementId,
        userId,
        content: dto.content,
        parentId: dto.parentId || null,
      },
      include: {
        user: {
          select: { id: true, nickname: true, name: true, role: true },
        },
        _count: {
          select: { likes: true },
        },
      },
    });
  }

  async deleteComment(
    announcementId: string,
    commentId: string,
    userId: string,
    userRole: UserRole,
  ) {
    const comment = await this.prisma.announcementComment.findFirst({
      where: { id: commentId, announcementId },
      include: { user: { select: { role: true } } },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // 본인 댓글은 항상 삭제 가능
    if (comment.userId !== userId) {
      // SYSTEM 작성 댓글 → SYSTEM만 삭제 가능
      if (comment.user.role === UserRole.SYSTEM && userRole !== UserRole.SYSTEM) {
        throw new ForbiddenException('Only SYSTEM admin can delete this comment');
      }
      // ADMIN 작성 댓글 → ADMIN/SYSTEM만 삭제 가능
      if (comment.user.role === UserRole.ADMIN && userRole !== UserRole.ADMIN && userRole !== UserRole.SYSTEM) {
        throw new ForbiddenException('Not authorized to delete this comment');
      }
      // USER 작성 댓글 → ADMIN/SYSTEM 삭제 가능
      if (userRole !== UserRole.ADMIN && userRole !== UserRole.SYSTEM) {
        throw new ForbiddenException('Not authorized to delete this comment');
      }
    }

    await this.prisma.announcementComment.delete({ where: { id: commentId } });
    return { success: true };
  }

  // --- 좋아요 ---
  async toggleLike(announcementId: string, userId: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id: announcementId },
    });
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    const existingLike = await this.prisma.announcementLike.findUnique({
      where: {
        announcementId_userId: { announcementId, userId },
      },
    });

    if (existingLike) {
      await this.prisma.announcementLike.delete({
        where: { id: existingLike.id },
      });
      return { liked: false };
    } else {
      await this.prisma.announcementLike.create({
        data: { announcementId, userId },
      });
      return { liked: true };
    }
  }

  // --- 댓글 좋아요 ---
  async toggleCommentLike(commentId: string, userId: string) {
    const comment = await this.prisma.announcementComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const existingLike = await this.prisma.announcementCommentLike.findUnique({
      where: {
        commentId_userId: { commentId, userId },
      },
    });

    if (existingLike) {
      await this.prisma.announcementCommentLike.delete({
        where: { id: existingLike.id },
      });
      return { liked: false };
    } else {
      await this.prisma.announcementCommentLike.create({
        data: { commentId, userId },
      });
      return { liked: true };
    }
  }
}
