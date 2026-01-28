import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole, UserStatus } from '@prisma/client';

export class ApproveUserDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class RejectUserDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;
}
