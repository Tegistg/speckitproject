import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
});

export async function createPaymentIntent(
  amountCents: number,
  paymentMethodId: string,
  connectedAccountId: string,
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    payment_method: paymentMethodId,
    capture_method: 'manual',
    transfer_data: { destination: connectedAccountId },
    confirm: true,
    return_url: 'dormsnack://payment-return',
  });
}

export async function capturePaymentIntent(paymentIntentId: string): Promise<void> {
  await stripe.paymentIntents.capture(paymentIntentId);
}

export async function voidPaymentIntent(paymentIntentId: string): Promise<void> {
  await stripe.paymentIntents.cancel(paymentIntentId);
}

export async function refundPaymentIntent(paymentIntentId: string): Promise<void> {
  await stripe.refunds.create({ payment_intent: paymentIntentId });
}

export async function createConnectOnboardingLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string,
): Promise<string> {
  const link = await stripe.accountLinks.create({
    account: accountId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: 'account_onboarding',
  });
  return link.url;
}
