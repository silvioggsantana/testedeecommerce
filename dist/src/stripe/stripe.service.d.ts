import Stripe from 'stripe';
export declare class StripeService {
    private stripe;
    constructor();
    createCheckoutSession(order: any): Promise<Stripe.Response<Stripe.Checkout.Session>>;
    verifyWebhook(payload: Buffer, sig: string): Stripe.Event;
}
