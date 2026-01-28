import { IsOptional, IsString, IsEnum } from 'class-validator';
import { UserRole, UserStatus, ApprovalStatus } from '@prisma/client';

export class UserFilterDto {
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsEnum(ApprovalStatus)
  approvalStatus?: ApprovalStatus;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  search?: string;
}
