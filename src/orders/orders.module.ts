import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MercadoPagoModule } from '../mercadopago/mercadopago.module';

@Module({
  imports: [PrismaModule, MercadoPagoModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}