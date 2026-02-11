import { ProductsService } from './products.service';
export declare const Roles: (...roles: string[]) => import("@nestjs/common").CustomDecorator<string>;
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
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
        price: number;
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
        price: number;
        image: string | null;
        status: string;
    }>;
}
export declare class AdminProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
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
        price: number;
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
        price: number;
        image: string | null;
        status: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        price: number;
        image: string | null;
        status: string;
    }>;
}
