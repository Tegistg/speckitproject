import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { OrderStatus, PaymentMethod } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import * as orderService from '../services/orderService';

const createOrderSchema = z.object({
  listing_id: z.string().uuid(),
  quantity_ordered: z.number().int().positive(),
  payment_method: z.nativeEnum(PaymentMethod),
  stripe_payment_method_id: z.string().optional(),
});

const transitionSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  pickup_location: z.string().optional(),
  cancel_reason: z.string().optional(),
  dispute_reason: z.string().optional(),
  dispute_note: z.string().optional(),
});

export async function orderRoutes(app: FastifyInstance): Promise<void> {
  app.post('/orders', { preHandler: requireAuth }, async (request, reply) => {
    const body = createOrderSchema.parse(request.body);
    const order = await orderService.createOrder(request.user.sub, {
      listingId: body.listing_id,
      quantityOrdered: body.quantity_ordered,
      paymentMethod: body.payment_method,
      stripePaymentIntentId: body.stripe_payment_method_id,
    });
    return reply.status(201).send(order);
  });

  app.get('/orders/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const order = await orderService.getOrderById(id, request.user.sub);
    return reply.send(order);
  });

  app.patch('/orders/:id/status', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = transitionSchema.parse(request.body);
    const order = await orderService.transitionStatus(id, request.user.sub, body.status, {
      pickupLocation: body.pickup_location,
      cancelReason: body.cancel_reason,
      disputeReason: body.dispute_reason,
      disputeNote: body.dispute_note,
    });
    return reply.send(order);
  });

  app.get('/users/me/orders', { preHandler: requireAuth }, async (request, reply) => {
    const query = request.query as Record<string, string>;
    const result = await orderService.listOrders(
      request.user.sub,
      query.role as 'buyer' | 'seller' | undefined,
      query.status as OrderStatus | undefined,
      query.cursor,
      query.limit ? parseInt(query.limit) : undefined,
    );
    return reply.send({ data: result.data, next_cursor: result.nextCursor });
  });
}
