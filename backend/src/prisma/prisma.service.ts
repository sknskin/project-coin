import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

  constructor() {
    super({
      log: [
        // 쿼리 출력을 원하는 경우 아래 코드 주석 해제
        // { emit: 'stdout', level: 'query' },  // 실행되는 모든 SQL 쿼리 출력
        { emit: 'stdout', level: 'info' },   // 일반적인 정보
        { emit: 'stdout', level: 'warn' },   // 경고
        { emit: 'stdout', level: 'error' },  // 에러
      ],
    })
  }
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
