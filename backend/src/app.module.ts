import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { UpbitModule } from './upbit/upbit.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { WebsocketModule } from './websocket/websocket.module';
import { PrismaModule } from './prisma/prisma.module';
import { NotificationModule } from './notification/notification.module';
import { ChatModule } from './chat/chat.module';
import { AdminModule } from './admin/admin.module';
import { StatisticsModule } from './statistics/statistics.module';
import { NewsModule } from './news/news.module';
import { MenuModule } from './menu/menu.module';
import { MyPageModule } from './mypage/mypage.module';
import { AnnouncementModule } from './announcement/announcement.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    UpbitModule,
    PortfolioModule,
    WebsocketModule,
    NotificationModule,
    ChatModule,
    AdminModule,
    StatisticsModule,
    NewsModule,
    MenuModule,
    MyPageModule,
    AnnouncementModule,
  ],
})
export class AppModule {}
