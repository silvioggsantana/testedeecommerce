import { OrdersService } from './orders.service';
import type { Response } from 'express';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    checkout(body: {
        items: any[];
    }): Promise<any>;
    webhook(body: any, headers: any, res: Response): Promise<Response<any, Record<string, any>>>;
    getOrders(): Promise<({
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
