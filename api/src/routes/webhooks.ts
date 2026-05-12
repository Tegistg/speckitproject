import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import Stripe from 'stripe';
import { stripe } from '../lib/stripe';
import { prisma } from '../lib/prisma';

export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/webhooks/stripe',
    { config: { rawBody: true } },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const sig = request.headers['stripe-signature'] as string;
      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(
          (request as FastifyRequest & { rawBody: Buffer }).rawBody,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET!,
        );
      } catch {
        return reply.status(400).send({ error: 'Webhook signature verification failed' });
      }

      const pi = event.data.object as Stripe.PaymentIntent;

      switch (event.type) {
        case 'payment_intent.amount_capturable_updated':
          await prisma.order.updateMany({
            where: { stripePaymentIntentId: pi.id },
            data: { paymentStatus: 'authorized' },
          });
          break;
        case 'payment_intent.succeeded':
          await prisma.order.updateMany({
            where: { stripePaymentIntentId: pi.id },
            data: { paymentStatus: 'captured' },
          });
          break;
        case 'payment_intent.canceled':
          await prisma.order.updateMany({
            where: { stripePaymentIntentId: pi.id },
            data: { paymentStatus: 'voided' },
          });
          break;
        case 'charge.refunded':
          await prisma.order.updateMany({
            where: { stripePaymentIntentId: pi.id },
            data: { paymentStatus: 'refunded' },
          });
          break;
      }

      return reply.send({ received: true });
    },
  );
}
