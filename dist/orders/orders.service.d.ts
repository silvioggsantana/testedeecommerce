import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoService } from '../mercadopago/mercadopago.service';
export declare class OrdersService {
    private prisma;
    private mercadoPagoService;
    private configService;
    constructor(prisma: PrismaService, mercadoPagoService: MercadoPagoService, configService: ConfigService);
    createCheckout(cartItems: {
        productId: string;
        size: string;
        quantity: number;
    }[], payerEmail?: string): Promise<any>;
    handleWebhook(body: any, headers: any): Promise<{
        message: string;
    }>;
    updateOrderStatus(orderId: string, status: string): Promise<void>;
    findAll(): Promise<({
        payment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            provider: string;
            transactionId: string | null;
            orderId: string;
        } | null;
        items: ({
            product: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string;
                price: import("@prisma/client/runtime/library").Decimal;
                image: string | null;
                status: string;
            };
        } & {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            size: string;
            productId: string;
            quantity: number;
            orderId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        total: import("@prisma/client/runtime/library").Decimal;
        paymentProviderId: string | null;
    })[]>;
}
