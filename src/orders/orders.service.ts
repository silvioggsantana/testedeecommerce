import { Injectable, BadRequestException, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';  // Import corrigido
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoService } from '../mercadopago/mercadopago.service';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';  // Para validação de webhook

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private mercadoPagoService: MercadoPagoService,
    private configService: ConfigService,
  ) {}  // Removido this.mp - use o service dedicado

  async createCheckout(cartItems: { productId: string; size: string; quantity: number }[], payerEmail?: string) {
    let total = 0;
    const orderItems: any[] = [];

    for (const item of cartItems) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });

      if (!product || product.status !== 'ACTIVE') {
        throw new NotFoundException(`Produto ${item.productId} não encontrado ou inativo.`);
      }

      const variant = product.variants.find((v) => v.size === item.size);
      if (!variant || variant.stock < item.quantity) {
        throw new BadRequestException(`Estoque insuficiente para ${product.name} (${item.size}).`);
      }

      total += Number(product.price) * item.quantity;
      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: Number(product.price),
        size: item.size,
      });
    }

    const order = await this.prisma.order.create({
      data: {
        id: uuidv4(),
        total,
        status: 'PENDING',
        items: { create: orderItems },
      },
    });

    // Configurável: Use env para escolher método (ex: PAYMENT_METHOD=preference)
    const paymentMethod = this.configService.get<string>('PAYMENT_METHOD', 'preference');
    let paymentProviderId: any;
    let responseData: any;

    if (paymentMethod === 'pix') {
      if (!payerEmail) {
        throw new BadRequestException('Email do pagador obrigatório para PIX.');
      }
      const pixData = await this.mercadoPagoService.createPixPayment(order.id, total, orderItems, payerEmail);
      paymentProviderId = pixData.paymentId;
      responseData = { qrCodeBase64: pixData.qrCodeBase64, qrCode: pixData.qrCode };
    } else {
      // Para checkout, é necessário fornecer os dados do payer (nome, email, cpf)
      // Aqui, como exemplo, usamos dados fictícios; substitua por dados reais do usuário em produção
      const payer = {
        name: 'silvio gabriel',  // Substitua por nome real do usuário
        email: payerEmail || 'silviogabrielgsantana@gmail.com',
        cpf: '24175355804', // CPF de teste; substitua por CPF real do usuário
      };
      const checkoutUrl = await this.mercadoPagoService.createPreference(order.id, orderItems, total, payer);
      paymentProviderId = 'preference_id';  // Extraia do result.id se necessário
      responseData = { checkoutUrl };
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentProviderId },
    });

    return { orderId: order.id, ...responseData };
  }

  async handleWebhook(body: any, headers: any) {
    const signature = headers['x-signature'];
    const requestId = headers['x-request-id'];
    const dataId = body.data?.id;  // Para eventos de payment

    if (!signature || !requestId || !dataId) {
      throw new BadRequestException('Cabeçalhos de webhook inválidos');
    }

    // Validar signature com HMAC (baseado na doc Mercado Pago)
    const webhookSecret = this.configService.get<string>('MERCADO_PAGO_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new InternalServerErrorException('WEBHOOK_SECRET não configurado');
    }

    const signatureParts = signature.split(',').reduce((acc: any, part: string) => {
      const [key, value] = part.split('=');
      acc[key.trim()] = value.trim();
      return acc;
    }, {});

    const ts = signatureParts.ts;
    const v1 = signatureParts.v1;

    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const hmac = crypto.createHmac('sha256', webhookSecret).update(manifest).digest('hex');

    if (hmac !== v1) {
      throw new ForbiddenException('Assinatura de webhook inválida');
    }

    // Processar evento (ex: payment.updated)
    if (body.type === 'payment') {
      const paymentData = await this.mercadoPagoService.getPayment(body.data.id);

      if (!paymentData || !paymentData.external_reference) {
        throw new BadRequestException('Dados de pagamento inválidos');
      }

      const orderId = paymentData.external_reference;
      const paymentStatus = paymentData.status;

      const order = await this.prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        throw new NotFoundException('Pedido não encontrado');
      }

      // Idempotência: Se já pago, ignore
      if (order.status === 'PAID') {
        return { message: 'Webhook processado (idempotente)' };
      }

      let newStatus: string;
      switch (paymentStatus) {
        case 'approved':
          newStatus = 'PAID';
          break;
        case 'pending':
          newStatus = 'PENDING';
          break;
        case 'rejected':
          newStatus = 'CANCELLED';
          break;
        default:
          throw new BadRequestException(`Status desconhecido: ${paymentStatus}`);
      }

      // Atualizar order e debitar estoque se aprovado
      await this.updateOrderStatus(orderId, newStatus);

      const transactionAmount = paymentData.transaction_amount;
      if (transactionAmount === undefined) {
        throw new BadRequestException('Valor da transação não informado');
      }

      // Criar registro de Payment
      await this.prisma.payment.create({
        data: {
          amount: Number(transactionAmount),
          status: paymentStatus.toUpperCase(),
          provider: 'MERCADOPAGO',
          transactionId: paymentData.id !== undefined ? String(paymentData.id) : null,
          orderId,
        },
      });

      return { message: 'Webhook processado com sucesso' };
    }

    throw new BadRequestException('Tipo de evento não suportado');
  }

  async updateOrderStatus(orderId: string, status: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    if (status === 'PAID' && order.status !== 'PAID') {
      for (const item of order.items) {
        const updated = await this.prisma.productVariant.updateMany({
          where: {
            productId: item.productId,
            size: item.size,
            stock: { gte: item.quantity },  // Evitar negativo
          },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new ForbiddenException(`Estoque insuficiente para item ${item.id}`);
        }
      }
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: { items: { include: { product: true } }, payment: true },
    });
  }
}