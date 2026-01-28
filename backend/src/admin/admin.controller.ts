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
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { AdminService } from './admin.service';
import { UserFilterDto } from './dto/user-filter.dto';
import {
  ApproveUserDto,
  RejectUserDto,
  UpdateUserStatusDto,
} from './dto/approve-user.dto';
import { UserRole } from '@prisma/client';

interface RequestWithUser extends ExpressRequest {
  user: { id: string; email: string; role: UserRole };
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  getUsers(@Query() filter: UserFilterDto) {
    return this.adminService.getUsers(filter);
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Post('users/:id/approve')
  approveUser(
    @Request() req: RequestWithUser,
    @Param('id') userId: string,
    @Body() dto: ApproveUserDto,
  ) {
    return this.adminService.approveUser(req.user.id, userId, dto);
  }

  @Post('users/:id/reject')
  rejectUser(
    @Request() req: RequestWithUser,
    @Param('id') userId: string,
    @Body() dto: RejectUserDto,
  ) {
    return this.adminService.rejectUser(req.user.id, userId, dto.reason);
  }

  @Patch('users/:id/status')
  updateStatus(
    @Request() req: RequestWithUser,
    @Param('id') userId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(req.user.id, userId, dto);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') userId: string) {
    return this.adminService.deleteUser(userId);
  }

  @Get('stats/summary')
  getStatsSummary() {
    return this.adminService.getStatsSummary();
  }
}
