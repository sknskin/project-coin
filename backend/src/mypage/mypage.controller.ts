import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MyPageService } from './mypage.service';
import { UpdateProfileDto, ChangePasswordDto } from './dto/update-profile.dto';

interface RequestWithUser extends ExpressRequest {
  user: { id: string; email: string };
}

@Controller('mypage')
@UseGuards(JwtAuthGuard)
export class MyPageController {
  constructor(private myPageService: MyPageService) {}

  @Get('profile')
  getProfile(@Request() req: RequestWithUser) {
    return this.myPageService.getProfile(req.user.id);
  }

  @Patch('profile')
  updateProfile(
    @Request() req: RequestWithUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.myPageService.updateProfile(req.user.id, dto);
  }

  @Post('password')
  changePassword(
    @Request() req: RequestWithUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.myPageService.changePassword(req.user.id, dto);
  }
}
