import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import * as ratingService from '../services/ratingService';

const submitSchema = z.object({
  order_id: z.string().uuid(),
  stars: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export async function ratingRoutes(app: FastifyInstance): Promise<void> {
  app.post('/ratings', { preHandler: requireAuth }, async (request, reply) => {
    const body = submitSchema.parse(request.body);
    const rating = await ratingService.submitRating(request.user.sub, body.order_id, body.stars, body.comment);
    return reply.status(201).send(rating);
  });

  app.get('/users/:id/ratings', async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as Record<string, string>;
    const result = await ratingService.getUserRatings(id, query.cursor, query.limit ? parseInt(query.limit) : undefined);
    return reply.send(result);
  });
}
