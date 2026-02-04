import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, Menu } from '@prisma/client';

@Injectable()
export class MenuService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultMenus();
  }

  async getMenus(userRole?: UserRole) {
    // SYSTEM과 ADMIN은 모두 관리자 메뉴에 접근 가능
    const isAdmin = userRole === 'ADMIN' || userRole === 'SYSTEM';

    const menus = await this.prisma.menu.findMany({
      where: {
        isActive: true,
        OR: [
          { requiredRole: null },
          ...(userRole ? [{ requiredRole: 'USER' as UserRole }] : []),
          ...(isAdmin ? [{ requiredRole: 'ADMIN' as UserRole }] : []),
        ],
      },
      orderBy: [{ depth: 'asc' }, { order: 'asc' }],
    });

    return this.buildMenuTree(menus);
  }

  private buildMenuTree(menus: Menu[]) {
    const menuMap = new Map<string, Menu & { children: Menu[] }>();
    const roots: (Menu & { children: Menu[] })[] = [];

    menus.forEach((menu) =>
      menuMap.set(menu.id, { ...menu, children: [] }),
    );

    menus.forEach((menu) => {
      const menuItem = menuMap.get(menu.id)!;
      if (menu.parentId) {
        const parent = menuMap.get(menu.parentId);
        if (parent) {
          parent.children.push(menuItem);
        }
      } else {
        roots.push(menuItem);
      }
    });

    return roots;
  }

  async seedDefaultMenus() {
    const defaultMenus = [
      {
        name: '코인시세',
        nameEn: 'Price',
        path: '/coins',
        depth: 1,
        order: 1,
        requiredRole: null,
      },
      {
        name: '코인뉴스',
        nameEn: 'Coin News',
        path: '/coin-info',
        depth: 1,
        order: 2,
        requiredRole: null,
      },
      {
        name: '공지사항',
        nameEn: 'Announcements',
        path: '/announcements',
        depth: 1,
        order: 3,
        requiredRole: 'USER' as UserRole,
      },
      {
        name: '포트폴리오',
        nameEn: 'Portfolio',
        path: '/portfolio',
        depth: 1,
        order: 4,
        requiredRole: 'USER' as UserRole,
      },
      {
        name: '회원관리',
        nameEn: 'Members',
        path: '/admin/members',
        depth: 1,
        order: 5,
        requiredRole: 'ADMIN' as UserRole,
      },
      {
        name: '통계',
        nameEn: 'Statistics',
        path: '/admin/statistics',
        depth: 1,
        order: 6,
        requiredRole: 'ADMIN' as UserRole,
      },
    ];

    for (const menu of defaultMenus) {
      await this.prisma.menu.upsert({
        where: { path: menu.path },
        update: { order: menu.order },
        create: menu,
      });
    }
  }
}
