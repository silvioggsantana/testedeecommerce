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
        items: ({
            product: {
                id: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                price: number;
                name: string;
                description: string;
                image: string | null;
            };
        } & {
            id: string;
            quantity: number;
            price: number;
            size: string;
            productId: string;
            orderId: string;
        })[];
        payment: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            orderId: string;
            amount: number;
            provider: string;
            transactionId: string | null;
        } | null;
    } & {
        id: string;
        total: number;
        status: string;
        paymentProviderId: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
}
