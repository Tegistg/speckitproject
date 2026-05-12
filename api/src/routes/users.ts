import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import * as userService from '../services/userService';
import * as listingService from '../services/listingService';
import * as mediaService from '../services/mediaService';
import { stripe, createConnectOnboardingLink } from '../lib/stripe';
import { prisma } from '../lib/prisma';

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  expo_push_token: z.string().optional(),
});

export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.get('/users/me', { preHandler: requireAuth }, async (request, reply) => {
    const user = await userService.getProfile(request.user.sub);
    if (!user) return reply.status(404).send({ error: 'User not found' });
    return reply.send({
      ...user,
      stripe_onboarding_complete: !!user.stripeAccountId,
    });
  });

  app.patch('/users/me', { preHandler: requireAuth }, async (request, reply) => {
    const body = updateProfileSchema.parse(request.body);
    const user = await userService.updateProfile(request.user.sub, {
      name: body.name,
      expoPushToken: body.expo_push_token,
    });
    return reply.send(user);
  });

  app.post('/users/me/avatar', { preHandler: requireAuth }, async (request, reply) => {
    const data = await request.file();
    if (!data) return reply.status(400).send({ error: 'No file uploaded' });
    const buffer = await data.toBuffer();
    const avatarUrl = await mediaService.uploadPhoto(buffer, `avatars/${request.user.sub}`);
    const user = await prisma.user.update({ where: { id: request.user.sub }, data: { avatarUrl } });
    return reply.send(user);
  });

  app.post('/users/me/stripe/onboard', { preHandler: requireAuth }, async (request, reply) => {
    let accountId = (await userService.getProfile(request.user.sub))?.stripeAccountId;
    if (!accountId) {
      const account = await stripe.accounts.create({ type: 'express' });
      accountId = account.id;
      await prisma.user.update({ where: { id: request.user.sub }, data: { stripeAccountId: accountId } });
    }
    const url = await createConnectOnboardingLink(
      accountId,
      'dormsnack://stripe-return',
      'dormsnack://stripe-refresh',
    );
    return reply.send({ onboarding_url: url });
  });

  app.get('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await userService.getPublicProfile(id);
    if (!user) return reply.status(404).send({ error: 'User not found' });
    return reply.send(user);
  });

  app.get('/users/:id/listings', async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as Record<string, string>;
    const result = await listingService.getFeed({ cursor: query.cursor, limit: query.limit ? parseInt(query.limit) : undefined });
    const filtered = result.data.filter((l) => l.sellerId === id);
    return reply.send({ data: filtered, next_cursor: result.nextCursor });
  });
}
