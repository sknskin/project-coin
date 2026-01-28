import { Module } from '@nestjs/common';
import { MyPageController } from './mypage.controller';
import { MyPageService } from './mypage.service';

@Module({
  controllers: [MyPageController],
  providers: [MyPageService],
  exports: [MyPageService],
})
export class MyPageModule {}
