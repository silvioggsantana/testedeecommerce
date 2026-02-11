import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';  // Agora pode importar
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { PrismaModule } from './prisma/prisma.module';
import { MercadoPagoModule } from './mercadopago/mercadopago.module';  // Seu novo módulo

import * as Joi from 'joi';  // Para validação de envs

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,  // Disponível em todos os módulos
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),  // Se você usa JWT
        MERCADO_PAGO_ACCESS_TOKEN: Joi.string().required(),
        MERCADO_PAGO_WEBHOOK_SECRET: Joi.string().required(),
        // Adicione outras envs aqui, ex: PORT: Joi.number().default(3000)
      }),
      validationOptions: {
        allowUnknown: true,  // Permite envs extras
        abortEarly: false,   // Mostra todos os erros de validação
      },
    }),
    AuthModule,
    OrdersModule,
    ProductsModule,
    PrismaModule,
    MercadoPagoModule,  // Importe aqui
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}