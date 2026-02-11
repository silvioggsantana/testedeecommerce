import { Controller, Post, Body, Get, Query, Req, UseGuards, Res, HttpStatus , Headers } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../products/products.controller'; 
import type { Response } from 'express'; // Importar de onde está definido

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  async checkout(@Body() body: { items: any[] }) {
    return this.ordersService.createCheckout(body.items);
  }

@Post('webhook/mercadopago')
  async webhook(
    @Body() body: any,
    @Headers() headers: any,
    @Res() res: Response,  // força controle do status
  ) {
    console.log('WEBHOOK MERCADO PAGO RECEBIDO');
    console.log('Body recebido:', JSON.stringify(body, null, 2));
    console.log('Headers:', headers);

    // Formas comuns como o MP envia (IPN antigo e novo webhook)
    const event = body.type || body.action || headers['x-type']; // fallback
    let paymentId = body?.data?.id || body?.id || body?.resource?.id;

    // Suporte ao formato antigo de IPN (query params)
    if (!paymentId && headers['x-resource-id']) {
      paymentId = headers['x-resource-id'];
    }

    if (!paymentId) {
      console.warn('Webhook sem payment ID válido');
      // Ainda responde 200 para o MP não bloquear a URL
      return res.status(HttpStatus.OK).json({ status: 'ok', message: 'No payment ID, ignored' });
    }

    try {
      await this.ordersService.handleWebhook(paymentId.toString(), headers);
      return res.status(HttpStatus.OK).json({ status: 'ok' });
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      // NUNCA retorne 4xx em produção para webhook – MP considera falha e desativa
      // Responda 200 mesmo com erro interno (logue e trate depois)
      return res.status(HttpStatus.OK).json({
        status: 'error',
        message: 'Internal processing error, but acknowledged'
      });
    }
  }


  @Get('admin/orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getOrders() {
    return this.ordersService.findAll();
  }
}