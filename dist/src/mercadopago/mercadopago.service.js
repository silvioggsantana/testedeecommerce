"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MercadoPagoService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mercadopago_1 = require("mercadopago");
const crypto = __importStar(require("crypto"));
let MercadoPagoService = class MercadoPagoService {
    configService;
    client;
    preferenceClient;
    paymentClient;
    constructor(configService) {
        this.configService = configService;
        const accessToken = this.configService.get('MERCADO_PAGO_ACCESS_TOKEN');
        if (!accessToken) {
            throw new common_1.InternalServerErrorException('MERCADO_PAGO_ACCESS_TOKEN não configurado');
        }
        this.client = new mercadopago_1.MercadoPagoConfig({ accessToken });
        this.preferenceClient = new mercadopago_1.Preference(this.client);
        this.paymentClient = new mercadopago_1.Payment(this.client);
    }
    async createPreference(orderId, items, totalAmount, payer) {
        if (!items.length) {
            throw new common_1.BadRequestException('Itens do pedido não podem ser vazios');
        }
        if (totalAmount < 1) {
            throw new common_1.BadRequestException('Valor total deve ser pelo menos R$1 em produção');
        }
        if (!payer || !payer.email || !payer.cpf) {
            throw new common_1.BadRequestException('Dados do payer obrigatórios em produção');
        }
        const appUrl = this.configService.get('APP_URL');
        const webhookUrl = this.configService.get('WEBHOOK_URL');
        if (!appUrl || !appUrl.startsWith('https://')) {
            throw new common_1.InternalServerErrorException('APP_URL deve ser um HTTPS válido');
        }
        if (!webhookUrl || !webhookUrl.startsWith('https://')) {
            throw new common_1.InternalServerErrorException('WEBHOOK_URL deve ser um HTTPS válido');
        }
        const body = {
            items: items.map((item) => {
                if (typeof item.price !== 'number' || item.price <= 0) {
                    throw new common_1.BadRequestException(`Preço inválido para ${item.productId}`);
                }
                if (typeof item.quantity !== 'number' || item.quantity <= 0) {
                    throw new common_1.BadRequestException(`Quantidade inválida para ${item.productId}`);
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
            notification_url: webhookUrl,
            payer: {
                name: payer.name,
                email: payer.email,
                identification: {
                    type: 'CPF',
                    number: payer.cpf,
                },
            },
            payment_methods: {
                installments: 1,
            },
        };
        console.log('Criando preference com body:', JSON.stringify(body, null, 2));
        try {
            const idempotencyKey = crypto.randomUUID();
            const result = await this.preferenceClient.create({
                body,
                requestOptions: { idempotencyKey },
            });
            console.log('Preference ID:', result.id, 'Init Point:', result.init_point);
            return result.init_point;
        }
        catch (error) {
            console.error('Erro no Mercado Pago:', error.response?.data || error.message);
            throw new common_1.BadRequestException(`Falha ao criar preference: ${error.response?.data?.message || 'Verifique configs'}`);
        }
    }
    async createPixPayment(orderId, total, items, payerEmail) {
        if (!items.length) {
            throw new common_1.BadRequestException('Itens do pedido não podem ser vazios');
        }
        if (total <= 0) {
            throw new common_1.BadRequestException('Valor total deve ser positivo');
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
        console.log('Criando PIX com body:', JSON.stringify(requestBody, null, 2));
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
        }
        catch (error) {
            console.error('Erro ao criar pagamento PIX:', error.response?.data || error.message);
            throw new common_1.BadRequestException(`Erro ao criar pagamento PIX: ${error.response?.data?.message || error.message}`);
        }
    }
    async getPayment(paymentId) {
        if (!paymentId) {
            throw new common_1.BadRequestException('ID de pagamento obrigatório');
        }
        try {
            return await this.paymentClient.get({ id: paymentId });
        }
        catch (error) {
            console.error('Erro ao consultar pagamento:', error.response?.data || error.message);
            throw new common_1.InternalServerErrorException(`Falha ao consultar pagamento: ${error.response?.data?.message || 'Erro interno'}`);
        }
    }
};
exports.MercadoPagoService = MercadoPagoService;
exports.MercadoPagoService = MercadoPagoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MercadoPagoService);
//# sourceMappingURL=mercadopago.service.js.map