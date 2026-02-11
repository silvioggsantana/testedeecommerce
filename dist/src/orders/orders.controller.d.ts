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
