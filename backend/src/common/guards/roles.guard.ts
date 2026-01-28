import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // SYSTEM 역할은 모든 권한을 가짐 (ADMIN 포함)
    if (user.role === UserRole.SYSTEM) {
      return true;
    }

    // ADMIN 역할은 ADMIN과 USER 권한을 가짐
    if (user.role === UserRole.ADMIN) {
      return requiredRoles.some(
        (role) => role === UserRole.ADMIN || role === UserRole.USER,
      );
    }

    return requiredRoles.includes(user.role);
  }
}
