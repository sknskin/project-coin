import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AnnouncementService } from './announcement.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UserRole } from '@prisma/client';

const multerOptions = {
  storage: diskStorage({
    destination: './uploads/announcements',
    filename: (_req, file, callback) => {
      const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
      callback(null, uniqueName);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
};

@Controller('announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementController {
  constructor(private announcementService: AnnouncementService) {}

  @Get()
  getAnnouncements(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.announcementService.getAnnouncements(
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get(':id')
  getAnnouncementById(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.announcementService.getAnnouncementById(id, user.id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('files', 5, multerOptions))
  createAnnouncement(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateAnnouncementDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.announcementService.createAnnouncement(user.id, dto, files);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('files', 5, multerOptions))
  updateAnnouncement(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
    @Body() dto: UpdateAnnouncementDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.announcementService.updateAnnouncement(id, user.role, dto, files);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteAnnouncement(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.announcementService.deleteAnnouncement(id, user.role);
  }

  // --- 댓글 ---
  @Post(':id/comments')
  createComment(
    @Param('id') announcementId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateCommentDto,
  ) {
    return this.announcementService.createComment(
      announcementId,
      user.id,
      dto,
    );
  }

  @Delete(':id/comments/:commentId')
  deleteComment(
    @Param('id') announcementId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.announcementService.deleteComment(
      announcementId,
      commentId,
      user.id,
      user.role,
    );
  }

  // --- 좋아요 ---
  @Post(':id/like')
  toggleLike(
    @Param('id') announcementId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.announcementService.toggleLike(announcementId, user.id);
  }

  // --- 댓글 좋아요 ---
  @Post(':id/comments/:commentId/like')
  toggleCommentLike(
    @Param('commentId') commentId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.announcementService.toggleCommentLike(commentId, user.id);
  }
}
