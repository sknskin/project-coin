import { Controller, Get, Headers } from '@nestjs/common';
import { MenuService } from './menu.service';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';

@Controller('menu')
export class MenuController {
  constructor(
    private menuService: MenuService,
    private jwtService: JwtService,
  ) {}

  @Get()
  async getMenus(@Headers('authorization') authHeader?: string) {
    let userRole: UserRole | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = this.jwtService.verify(token);
        userRole = decoded.role;
      } catch {
        // Invalid token, treat as unauthenticated
      }
    }

    return this.menuService.getMenus(userRole);
  }
}
