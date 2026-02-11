import { ConfigService } from '@nestjs/config';
export declare class MercadoPagoService {
    private configService;
    private client;
    private preferenceClient;
    private paymentClient;
    constructor(configService: ConfigService);
    createPreference(orderId: string, items: any[], totalAmount: number, payer: {
        name: string;
        email: string;
        cpf: string;
    }): Promise<string | undefined>;
    createPixPayment(orderId: string, total: number, items: any[], payerEmail: string): Promise<{
        qrCodeBase64: string | undefined;
        qrCode: string | undefined;
        paymentId: number | undefined;
    }>;
    getPayment(paymentId: string): Promise<import("mercadopago/dist/clients/payment/commonTypes").PaymentResponse>;
}
