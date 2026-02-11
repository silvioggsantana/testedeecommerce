import { PrismaService } from '../prisma/prisma.service';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        variants: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            size: string;
            stock: number;
            productId: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        price: import("@prisma/client/runtime/library").Decimal;
        image: string | null;
        status: string;
    })[]>;
    findOne(id: string): Promise<{
        variants: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            size: string;
            stock: number;
            productId: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        price: import("@prisma/client/runtime/library").Decimal;
        image: string | null;
        status: string;
    }>;
    create(data: any): Promise<{
        variants: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            size: string;
            stock: number;
            productId: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        price: import("@prisma/client/runtime/library").Decimal;
        image: string | null;
        status: string;
    }>;
    update(id: string, data: any): Promise<{
        variants: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            size: string;
            stock: number;
            productId: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        price: import("@prisma/client/runtime/library").Decimal;
        image: string | null;
        status: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        price: import("@prisma/client/runtime/library").Decimal;
        image: string | null;
        status: string;
    }>;
}
