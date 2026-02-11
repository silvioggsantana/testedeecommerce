import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

constructor() {
 this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key');
}


  async createCheckoutSession(order: any) {
    const lineItems = order.items.map((item) => ({
      price_data: {
        currency: 'brl',
        product_data: {
          name: `${item.product.name} - Tamanho ${item.size}`,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    return this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/cancel`,
      metadata: {
        orderId: order.id,
      },
    });
  }

  verifyWebhook(payload: Buffer, sig: string) {
    return this.stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || 'dummy_secret',
    );
  }
}
