import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ListingCategory } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import * as listingService from '../services/listingService';
import * as mediaService from '../services/mediaService';

const createListingSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priceCents: z.number().int().positive(),
  quantity: z.number().int().min(0),
  category: z.nativeEnum(ListingCategory),
  acceptedPaymentMethods: z.array(z.enum(['cash', 'stripe'])).min(1).optional(),
});

const patchListingSchema = createListingSchema.partial();

export async function listingRoutes(app: FastifyInstance): Promise<void> {
  app.get('/listings', async (request, reply) => {
    const query = request.query as Record<string, string>;
    const result = await listingService.getFeed({
      cursor: query.cursor,
      limit: query.limit ? parseInt(query.limit) : undefined,
      q: query.q,
      category: query.category as ListingCategory | undefined,
      minPriceCents: query.min_price_cents ? parseInt(query.min_price_cents) : undefined,
      maxPriceCents: query.max_price_cents ? parseInt(query.max_price_cents) : undefined,
    });
    return reply.send({ data: result.data, next_cursor: result.nextCursor });
  });

  app.get('/listings/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const listing = await listingService.getById(id);
    if (!listing) return reply.status(404).send({ error: 'Listing not found' });
    return reply.send(listing);
  });

  app.post('/listings', { preHandler: requireAuth }, async (request, reply) => {
    const body = createListingSchema.parse(request.body);
    const listing = await listingService.createListing(request.user.sub, body);
    return reply.status(201).send(listing);
  });

  app.patch('/listings/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = patchListingSchema.parse(request.body);
    const listing = await listingService.updateListing(id, request.user.sub, body);
    return reply.send(listing);
  });

  app.delete('/listings/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await listingService.removeListing(id, request.user.sub);
    return reply.status(204).send();
  });

  app.post('/listings/:id/photo', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = await request.file();
    if (!data) return reply.status(400).send({ error: 'No file uploaded' });

    const mime = data.mimetype;
    if (!['image/jpeg', 'image/png'].includes(mime)) {
      return reply.status(415).send({ error: 'Only JPEG and PNG photos are accepted' });
    }

    const buffer = await data.toBuffer();
    const photoUrl = await mediaService.uploadPhoto(buffer, `listings/${id}`);
    const listing = await listingService.updatePhoto(id, request.user.sub, photoUrl);
    return reply.send(listing);
  });
}
