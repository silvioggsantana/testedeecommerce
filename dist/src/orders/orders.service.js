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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const mercadopago_service_1 = require("../mercadopago/mercadopago.service");
const uuid_1 = require("uuid");
const crypto = __importStar(require("crypto"));
let OrdersService = class OrdersService {
    prisma;
    mercadoPagoService;
    configService;
    constructor(prisma, mercadoPagoService, configService) {
        this.prisma = prisma;
        this.mercadoPagoService = mercadoPagoService;
        this.configService = configService;
    }
    async createCheckout(cartItems, payerEmail) {
        let total = 0;
        const orderItems = [];
        for (const item of cartItems) {
            const product = await this.prisma.product.findUnique({
                where: { id: item.productId },
                include: { variants: true },
            });
            if (!product || product.status !== 'ACTIVE') {
                throw new common_1.NotFoundException(`Produto ${item.productId} não encontrado ou inativo.`);
            }
            const variant = product.variants.find((v) => v.size === item.size);
            if (!variant || variant.stock < item.quantity) {
                throw new common_1.BadRequestException(`Estoque insuficiente para ${product.name} (${item.size}).`);
            }
            total += product.price * item.quantity;
            orderItems.push({
                productId: product.id,
                quantity: item.quantity,
                price: product.price,
                size: item.size,
            });
        }
        const order = await this.prisma.order.create({
            data: {
                id: (0, uuid_1.v4)(),
                total,
                status: 'PENDING',
                items: { create: orderItems },
            },
        });
        const paymentMethod = this.configService.get('PAYMENT_METHOD', 'preference');
        let paymentProviderId;
        let responseData;
        if (paymentMethod === 'pix') {
            if (!payerEmail) {
                throw new common_1.BadRequestException('Email do pagador obrigatório para PIX.');
            }
            const pixData = await this.mercadoPagoService.createPixPayment(order.id, total, orderItems, payerEmail);
            paymentProviderId = pixData.paymentId;
            responseData = { qrCodeBase64: pixData.qrCodeBase64, qrCode: pixData.qrCode };
        }
        else {
            const payer = {
                name: 'silvio gabriel',
                email: payerEmail || 'silviogabrielgsantana@gmail.com',
                cpf: '24175355804',
            };
            const checkoutUrl = await this.mercadoPagoService.createPreference(order.id, orderItems, total, payer);
            paymentProviderId = 'preference_id';
            responseData = { checkoutUrl };
        }
        await this.prisma.order.update({
            where: { id: order.id },
            data: { paymentProviderId },
        });
        return { orderId: order.id, ...responseData };
    }
    async handleWebhook(body, headers) {
        const signature = headers['x-signature'];
        const requestId = headers['x-request-id'];
        const dataId = body.data?.id;
        if (!signature || !requestId || !dataId) {
            throw new common_1.BadRequestException('Cabeçalhos de webhook inválidos');
        }
        const webhookSecret = this.configService.get('MERCADO_PAGO_WEBHOOK_SECRET');
        if (!webhookSecret) {
            throw new common_1.InternalServerErrorException('WEBHOOK_SECRET não configurado');
        }
        const signatureParts = signature.split(',').reduce((acc, part) => {
            const [key, value] = part.split('=');
            acc[key.trim()] = value.trim();
            return acc;
        }, {});
        const ts = signatureParts.ts;
        const v1 = signatureParts.v1;
        const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
        const hmac = crypto.createHmac('sha256', webhookSecret).update(manifest).digest('hex');
        if (hmac !== v1) {
            throw new common_1.ForbiddenException('Assinatura de webhook inválida');
        }
        if (body.type === 'payment') {
            const paymentData = await this.mercadoPagoService.getPayment(body.data.id);
            if (!paymentData || !paymentData.external_reference) {
                throw new common_1.BadRequestException('Dados de pagamento inválidos');
            }
            const orderId = paymentData.external_reference;
            const paymentStatus = paymentData.status;
            const order = await this.prisma.order.findUnique({ where: { id: orderId } });
            if (!order) {
                throw new common_1.NotFoundException('Pedido não encontrado');
            }
            if (order.status === 'PAID') {
                return { message: 'Webhook processado (idempotente)' };
            }
            let newStatus;
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
                    throw new common_1.BadRequestException(`Status desconhecido: ${paymentStatus}`);
            }
            await this.updateOrderStatus(orderId, newStatus);
            const transactionAmount = paymentData.transaction_amount;
            if (transactionAmount === undefined) {
                throw new common_1.BadRequestException('Valor da transação não informado');
            }
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
        throw new common_1.BadRequestException('Tipo de evento não suportado');
    }
    async updateOrderStatus(orderId, status) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });
        if (!order) {
            throw new common_1.NotFoundException('Pedido não encontrado');
        }
        if (status === 'PAID' && order.status !== 'PAID') {
            for (const item of order.items) {
                const updated = await this.prisma.productVariant.updateMany({
                    where: {
                        productId: item.productId,
                        size: item.size,
                        stock: { gte: item.quantity },
                    },
                    data: { stock: { decrement: item.quantity } },
                });
                if (updated.count === 0) {
                    throw new common_1.ForbiddenException(`Estoque insuficiente para item ${item.id}`);
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
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mercadopago_service_1.MercadoPagoService,
        config_1.ConfigService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map