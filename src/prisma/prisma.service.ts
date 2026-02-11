import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { prisma } from './prisma.config';  // Ajuste path

@Injectable()
export class PrismaService extends prisma.$extends({}) implements OnModuleInit, OnModuleDestroy {  // Extensível para custom queries
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}