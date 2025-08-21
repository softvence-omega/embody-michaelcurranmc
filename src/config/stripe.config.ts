import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeConfig {
  private readonly stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY')!,
      {
        typescript: true,
      },
    );
  }
  getStripeInstance(): Stripe {
    return this.stripe;
  }
  getWebhookSecret(): string {
    return this.configService.get<string>('STRIPE_WEBHOOK_SECRET')!;
  }
  getPublishableKey(): string {
    return this.configService.get<string>('STRIPE_PUBLISHABLE_KEY')!;
  }
}
