import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import * as crypto from 'crypto';

@Injectable()
export class MercadoPagoService {
  private client: MercadoPagoConfig;
  private preferenceClient: Preference;
  private paymentClient: Payment;

  constructor(private configService: ConfigService) {
    const accessToken = this.configService.get<string>('MERCADO_PAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new InternalServerErrorException('MERCADO_PAGO_ACCESS_TOKEN não configurado');
    }

    this.client = new MercadoPagoConfig({ accessToken });
    this.preferenceClient = new Preference(this.client);
    this.paymentClient = new Payment(this.client);
  }

  async createPreference(orderId: string, items: any[], totalAmount: number, payer: { name: string; email: string; cpf: string }) {
    // Validações iniciais - Adicionado mínimo para prod
    if (!items.length) {
      throw new BadRequestException('Itens do pedido não podem ser vazios');
    }
    if (totalAmount < 1) {  // Mínimo R$1 para produção
      throw new BadRequestException('Valor total deve ser pelo menos R$1 em produção');
    }
    if (!payer || !payer.email || !payer.cpf) {
      throw new BadRequestException('Dados do payer obrigatórios em produção');
    }

    const appUrl = this.configService.get<string>('APP_URL');
    const webhookUrl = this.configService.get<string>('WEBHOOK_URL');
    if (!appUrl || !appUrl.startsWith('https://')) {
      throw new InternalServerErrorException('APP_URL deve ser um HTTPS válido');
    }
    if (!webhookUrl || !webhookUrl.startsWith('https://')) {
      throw new InternalServerErrorException('WEBHOOK_URL deve ser um HTTPS válido');
    }

    const body = {
      items: items.map((item) => {
        if (typeof item.price !== 'number' || item.price <= 0) {
          throw new BadRequestException(`Preço inválido para ${item.productId}`);
        }
        if (typeof item.quantity !== 'number' || item.quantity <= 0) {
          throw new BadRequestException(`Quantidade inválida para ${item.productId}`);
        }
        return {
          id: item.productId,
          title: `Camiseta - Pedido #${orderId}`,
          quantity: item.quantity,
          unit_price: item.price,
          currency_id: 'BRL',
        };
      }),
      external_reference: orderId,
      back_urls: {
        success: `${appUrl}/success`,
        failure: `${appUrl}/failure`,
        pending: `${appUrl}/pending`,
      },
      auto_return: 'approved',
      notification_url: webhookUrl,  // Use o webhook configurado
      payer: {
        name: payer.name,
        email: payer.email,
        identification: {
          type: 'CPF',
          number: payer.cpf,
        },
      },
      payment_methods: {
        installments: 1,  // Para PIX, limite a 1 parcela; ajuste para cartão
      },
    };

    // Em prod, use um logger como Winston em vez de console.log
    console.log('Criando preference com body:', JSON.stringify(body, null, 2));  // Substitua por logger.info

    try {
      const idempotencyKey = crypto.randomUUID();
      const result = await this.preferenceClient.create({
        body,
        requestOptions: { idempotencyKey },
      });
      console.log('Preference ID:', result.id, 'Init Point:', result.init_point);  // Logger em prod
      return result.init_point;  // Em prod, use init_point real
    } catch (error) {
      console.error('Erro no Mercado Pago:', error.response?.data || error.message);
      throw new BadRequestException(`Falha ao criar preference: ${error.response?.data?.message || 'Verifique configs'}`);
    }
  }

  async createPixPayment(orderId: string, total: number, items: any[], payerEmail: string) {
    // Validações semelhantes
    if (!items.length) {
      throw new BadRequestException('Itens do pedido não podem ser vazios');
    }
    if (total <= 0) {
      throw new BadRequestException('Valor total deve ser positivo');
    }

    const idempotencyKey = crypto.randomUUID();

    const requestBody = {
      transaction_amount: total,
      payment_method_id: 'pix',
      description: `Pedido ${orderId}`,
      payer: { email: payerEmail },
      additional_info: {
        items: items.map(item => ({
          id: item.productId,
          title: item.product.name || `Camiseta ${item.productId}`,
          description: item.product.description || '',
          quantity: item.quantity,
          unit_price: item.price,
          picture_url: item.product.image || '',
        })),
      },
      metadata: { orderId },
      external_reference: orderId,
    };

    console.log('Criando PIX com body:', JSON.stringify(requestBody, null, 2));  // Logger em prod

    try {
      const response = await this.paymentClient.create({
        body: requestBody,
        requestOptions: { idempotencyKey },
      });
      return {
        qrCodeBase64: response.point_of_interaction?.transaction_data?.qr_code_base64,
        qrCode: response.point_of_interaction?.transaction_data?.qr_code,
        paymentId: response.id,
      };
    } catch (error) {
      console.error('Erro ao criar pagamento PIX:', error.response?.data || error.message);
      throw new BadRequestException(`Erro ao criar pagamento PIX: ${error.response?.data?.message || error.message}`);
    }
  }

  async getPayment(paymentId: string) {
    if (!paymentId) {
      throw new BadRequestException('ID de pagamento obrigatório');
    }
    try {
      return await this.paymentClient.get({ id: paymentId });
    } catch (error) {
      console.error('Erro ao consultar pagamento:', error.response?.data || error.message);
      throw new InternalServerErrorException(`Falha ao consultar pagamento: ${error.response?.data?.message || 'Erro interno'}`);
    }
  }
}